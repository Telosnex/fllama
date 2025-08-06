#include "fllama.h"
#include "clip.h"
#include "fllama_chat_template.h"
#include "fllama_eos.h"
#include "fllama_inference_queue.h"
#include "fllama_llava.h"
#include "llava.h"

// LLaMA.cpp cross-platform support
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
// iOS-specific includes
#include "../ios/llama.cpp/common/base64.hpp"
#include "../ios/llama.cpp/common/chat.h"
#include "../ios/llama.cpp/common/common.h"
#include <nlohmann/json.hpp>
#include "../ios/llama.cpp/vendor/minja/minja.hpp"
#include "../ios/llama.cpp/common/sampling.h"
#include "../ios/llama.cpp/ggml/include/ggml.h"
#include "../ios/llama.cpp/include/llama.h"

#elif TARGET_OS_OSX
// macOS-specific includes
#include "../macos/llama.cpp/common/base64.hpp"
#include "../macos/llama.cpp/common/chat.h"
#include "../macos/llama.cpp/common/common.h"
#include <nlohmann/json.hpp>
#include "../macos/llama.cpp/vendor/minja/minja.hpp"
#include "../macos/llama.cpp/common/sampling.h"
#include "../macos/llama.cpp/ggml/include/ggml.h"
#include "../macos/llama.cpp/include/llama.h"
#else
// Other platforms
#include "llama.cpp/common/base64.hpp"
#include "llama.cpp/common/chat.h"
#include "llama.cpp/common/common.h"
#include <nlohmann/json.hpp>
#include "llama.cpp/vendor/minja/minja.hpp"
#include "llama.cpp/common/sampling.h"
#include "llama.cpp/ggml/include/ggml.h"
#include "llama.cpp/include/llama.h"
#endif

#include <atomic>
#include <cassert>
#include <chrono>
#include <cinttypes>
#include <cmath>
#include <condition_variable>
#include <cstdio>
#include <cstring>
#include <ctime>
#include <deque>
#include <fstream>
#include <functional>
#include <iostream>
#include <limits.h>
#include <mutex>
#include <queue>
#include <random>
#include <string>
#include <thread>
#include <unordered_set>
#include <vector>

#if defined(_MSC_VER)
#pragma warning(disable : 4244 4267) // possible loss of data
#endif
#include "ggml-backend.h"
#include "llama.cpp/src/llama-sampling.h"

// Forward declare logging functions
static void log_message(const char *message,
                        fllama_log_callback dart_logger = nullptr);
static void log_message(const std::string &message,
                        fllama_log_callback dart_logger = nullptr);

// Function to detect if a model is a Gemma 3 model
static bool is_gemma3_model(const char *model_path) {
  if (model_path == nullptr) {
    return false;
  }

  std::string path = std::string(model_path);
  std::transform(path.begin(), path.end(), path.begin(),
                 [](unsigned char c) { return std::tolower(c); });

  return (path.find("gemma-3") != std::string::npos ||
          path.find("gemma3") != std::string::npos);
}

// Implement logging functions
static void log_message(const char *message, fllama_log_callback dart_logger) {
  if (dart_logger == nullptr) {
    fprintf(stderr, "%s\n", message);
    fflush(stderr); // Ensure output is written immediately
  } else {
    // We need to create a persistently allocated string for each log message
    // to ensure it stays alive long enough for Dart to process it
    static std::mutex log_mutex;
    static std::deque<std::string> message_queue;
    static const size_t MAX_QUEUE_SIZE = 1000; // Limit memory usage
    
    // Process the message - replace any newlines to prevent log splitting issues
    std::string processed_message = message;
    
    // Replace any newline characters with a placeholder
    size_t pos = 0;
    while ((pos = processed_message.find('\n', pos)) != std::string::npos) {
      processed_message.replace(pos, 1, "[NL]");
      pos += 4; // Length of " [NL] "
    }
    
    // Use a mutex to ensure thread safety when updating the queue
    {
      std::lock_guard<std::mutex> lock(log_mutex);
      
      // Add the new message to the queue
      message_queue.push_back(processed_message);
      
      // Keep the queue size bounded
      while (message_queue.size() > MAX_QUEUE_SIZE) {
        message_queue.pop_front();
      }
      
      // Pass the pointer to the last message in the queue
      // This string will remain valid as long as we don't remove it from the queue
      dart_logger(message_queue.back().c_str());
    }
  }
}

static void log_message(const std::string &message,
                        fllama_log_callback dart_logger) {
  // Simply pass the c_str() pointer directly to the other overload
  log_message(message.c_str(), dart_logger);
}

static InferenceQueue global_inference_queue;

enum stop_type {
  STOP_TYPE_NONE,
  STOP_TYPE_EOS,
  STOP_TYPE_WORD,
  STOP_TYPE_LIMIT,
};

template <typename T>
static T json_value(const json &body, const std::string &key,
                    const T &default_value) {
  // Fallback null to default value
  if (body.contains(key) && !body.at(key).is_null()) {
    try {
      return body.at(key);
    } catch (NLOHMANN_JSON_NAMESPACE::detail::type_error const &) {
      //  LOG_WRN("Wrong type supplied for parameter '%s'. Expected '%s', using
      //  default value\n", key.c_str(), json(default_value).type_name());
      return default_value;
    }
  } else {
    return default_value;
  }
}

static json oaicompat_completion_params_parse(const json &body) {
  json llama_params;

  if (!body.contains("prompt")) {
    throw std::runtime_error("\"prompt\" is required");
  }

  // Handle "stop" field
  if (body.contains("stop") && body.at("stop").is_string()) {
    llama_params["stop"] = json::array({body.at("stop").get<std::string>()});
  } else {
    llama_params["stop"] = json_value(body, "stop", json::array());
  }

  // Handle "n" field
  int n_choices = json_value(body, "n", 1);
  if (n_choices != 1) {
    throw std::runtime_error("Only one completion choice is allowed");
  }

  // Params supported by OAI but unsupported by llama.cpp
  static const std::vector<std::string> unsupported_params{"best_of", "echo",
                                                           "suffix"};
  for (const auto &param : unsupported_params) {
    if (body.contains(param)) {
      throw std::runtime_error("Unsupported param: " + param);
    }
  }

  // Copy remaining properties to llama_params
  for (const auto &item : body.items()) {
    // Exception: if "n_predict" is present, we overwrite the value specified
    // earlier by "max_tokens"
    if (!llama_params.contains(item.key()) || item.key() == "n_predict") {
      llama_params[item.key()] = item.value();
    }
  }

  return llama_params;
}

#include <string>
#include <vector>

// Helper function to validate UTF-8
bool is_valid_utf8(const std::string &str) {
  const unsigned char *bytes =
      reinterpret_cast<const unsigned char *>(str.c_str());
  size_t len = str.length();

  for (size_t i = 0; i < len; i++) {
    if (bytes[i] <= 0x7F) { // Single byte character
      continue;
    }

    // Get number of bytes in this character
    int extra_bytes;
    if ((bytes[i] & 0xE0) == 0xC0) { // 2-byte sequence
      extra_bytes = 1;
    } else if ((bytes[i] & 0xF0) == 0xE0) { // 3-byte sequence
      extra_bytes = 2;
    } else if ((bytes[i] & 0xF8) == 0xF0) { // 4-byte sequence
      extra_bytes = 3;
    } else {
      return false; // Invalid first byte
    }

    // Check if we have enough bytes left
    if (i + extra_bytes >= len) {
      return false;
    }

    // Validate continuation bytes
    for (int j = 1; j <= extra_bytes; j++) {
      if ((bytes[i + j] & 0xC0) != 0x80) {
        return false;
      }
    }

    i += extra_bytes; // Skip the extra bytes
  }

  return true;
}

// Helper function to sanitize UTF-8
std::string sanitize_utf8(const std::string &input) {
  std::string result;
  result.reserve(input.length()); // Pre-allocate for efficiency

  const unsigned char *bytes =
      reinterpret_cast<const unsigned char *>(input.c_str());
  size_t len = input.length();

  for (size_t i = 0; i < len;) {
    if (bytes[i] <= 0x7F) { // ASCII character
      result.push_back(bytes[i]);
      i++;
      continue;
    }

    // Try to read a complete UTF-8 sequence
    int sequence_length = 0;
    if ((bytes[i] & 0xE0) == 0xC0)
      sequence_length = 2;
    else if ((bytes[i] & 0xF0) == 0xE0)
      sequence_length = 3;
    else if ((bytes[i] & 0xF8) == 0xF0)
      sequence_length = 4;

    bool valid_sequence = true;
    if (sequence_length > 0 && i + sequence_length <= len) {
      // Verify continuation bytes
      for (int j = 1; j < sequence_length; j++) {
        if ((bytes[i + j] & 0xC0) != 0x80) {
          valid_sequence = false;
          break;
        }
      }

      if (valid_sequence) {
        // Copy the entire valid sequence
        result.append(reinterpret_cast<const char *>(bytes + i),
                      sequence_length);
        i += sequence_length;
        continue;
      }
    }

    // If we get here, we encountered an invalid sequence
    // Replace with Unicode replacement character (�) encoded in UTF-8
    result.append("\xEF\xBF\xBD");
    i++;
  }

  return result;
}

static json to_json_oaicompat_chat(
    const std::string &content, const std::string &oaicompat_model,
    const std::string &oaicompat_cmpl_id, const std::string &build_info,
    stop_type stop, common_chat_format oaicompat_chat_format,
    // bool verbose,
    // const std::vector<completion_token_output>& probs_output,
    // bool post_sampling_probs,
    int n_decoded, int n_prompt_tokens
    // const result_timings* timings
) {
  // Issues with invalid UTF-8 were virtually always reproducible on iOS
  // Simulator with DeepSeek R1 Qwen 1.5B Distill.
  try {
    auto is_valid = is_valid_utf8(content);
    // If sanitization changed the content, it means we had invalid UTF-8
    if (!is_valid) {
      return NULL;
    }
  } catch (const std::exception &e) {
    throw std::runtime_error("Failed to sanitize content: " +
                             std::string(e.what()));
  }

  std::string finish_reason = "length";
  common_chat_msg msg;
  if (stop == STOP_TYPE_WORD || stop == STOP_TYPE_EOS ||
      stop == STOP_TYPE_NONE) {
    try {
      common_chat_syntax syntax;
      syntax.format = oaicompat_chat_format;
      msg = common_chat_parse(content, /* is_partial= */ false, syntax);
      finish_reason = msg.tool_calls.empty() ? "stop" : "tool_calls";
    } catch (const std::exception &e) {
      // IMPORTANT NOTE OBSERVED W/PHI-4 MINI:
      // Phi-4 mini fallback had some issues when integrated.
      //
      // Sometimes it would fail to parse a text response, and no response would
      // be returned.
      //
      // Removing `return NULL` here, and in the else branch of the stop words,
      // fixed this.
      msg.content = content;
    }
  } else {
    msg.content = content;
  }

  // Also validate any tool call content
  if (!msg.tool_calls.empty()) {
    for (auto &tc : msg.tool_calls) {
      tc.name = sanitize_utf8(tc.name);
      tc.arguments = sanitize_utf8(tc.arguments);
      tc.id = sanitize_utf8(tc.id);
    }
  }

  json message{
      {"role", "assistant"},
  };
  if (!msg.reasoning_content.empty()) {
    message["reasoning_content"] = msg.reasoning_content;
  }
  if (msg.content.empty() && !msg.tool_calls.empty()) {
    message["content"] = json();
  } else {
    message["content"] = msg.content;
  }
  if (!msg.tool_calls.empty()) {
    auto tool_calls = json::array();
    for (const auto &tc : msg.tool_calls) {
      tool_calls.push_back({
          {"type", "function"},
          {"function",
           {
               {"name", tc.name},
               {"arguments", tc.arguments},
           }},
          {"id", tc.id},
      });
    }
    message["tool_calls"] = tool_calls;
  }

  json choice{
      {"finish_reason", finish_reason},
      {"index", 0},
      {"message", message},
  };

  // if (!probs_output.empty()) {
  //     choice["logprobs"] = json{
  //         {"content",
  //         completion_token_output::probs_vector_to_json(probs_output,
  //         post_sampling_probs)},
  //     };
  // }

  std::time_t t = std::time(0);

  json res =
      json{{"choices", json::array({choice})},
           {"created", t},
           {"model", oaicompat_model},
           {"system_fingerprint", build_info},
           {"object", "chat.completion"},
           {"__llamacpp_detected_chat_format",
            common_chat_format_name(oaicompat_chat_format)},
           {"usage", json{{"completion_tokens", n_decoded},
                          {"prompt_tokens", n_prompt_tokens},
                          {"total_tokens", n_decoded + n_prompt_tokens}}},
           {"id", oaicompat_cmpl_id}};

  // extra fields for debugging purposes
  // if (verbose) {
  //     res["__verbose"] = json{{"verbose", true}};
  // }
  // if (timings && timings->prompt_n >= 0) {
  //     res.push_back({"timings", timings->to_json()});
  // }

  return res;
}

extern "C" {

EMSCRIPTEN_KEEPALIVE void fllama_inference(fllama_inference_request request,
                                           fllama_inference_callback callback) {
  std::cout << "[fllama] Hello from fllama.cpp! Queueing your request."
            << std::endl;
  global_inference_queue.enqueue(request, callback);
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void
fllama_inference_cancel(int request_id) {
  global_inference_queue.cancel(request_id);
}

// Process tokens using batch views for better performance and memory management
static bool process_tokens_with_batch_view(struct llama_context *ctx_llama,
                                           const std::vector<llama_token> &tokens,
                                           int n_batch, int *n_past,
                                           fllama_log_callback logger) {
  const int N = (int)tokens.size();
  if (N == 0)
    return true;

  // Keep tokens data alive
  std::vector<llama_token> tokens_data = tokens;
  
  // Process tokens in optimal chunks using batch views
  const int optimal_chunk_size = std::min(n_batch, 512);
  int32_t i_next = 0;
  int batch_count = 0;
  int64_t total_batch_time_ms = 0;
  
  // Create full batch but process it in views
  for (int32_t i = 0; i < N; i = i_next) {
    batch_count++;
    int64_t batch_start_time = ggml_time_ms();
    
    // Determine chunk size for this iteration
    int32_t n_tokens = std::min(optimal_chunk_size, N - i);
    
    // Check context space before processing this chunk
    int n_ctx = llama_n_ctx(ctx_llama);
    // Get the maximum position in context (0-based index)
    int n_ctx_used = 0;
    auto* memory = llama_get_memory(ctx_llama);
    if (memory) {
      llama_pos max_pos = llama_memory_seq_pos_max(memory, 0);
      // Convert to count for checking space: if max_pos is 9, we have 10 tokens
      n_ctx_used = max_pos + 1;  // Will be 0 if max_pos is -1 (empty)
    }
    
    if (n_ctx_used + n_tokens > n_ctx) {
      log_message("[ERROR] Context size would be exceeded: used=" +
                  std::to_string(n_ctx_used) + ", adding=" + std::to_string(n_tokens) +
                  ", total=" + std::to_string(n_ctx), logger);
      return false;
    }
    
    // Create a batch view for this chunk
    llama_batch batch_view = llama_batch_get_one(tokens_data.data() + i, n_tokens);
    
    // Attempt to decode this chunk
    int decode_result = llama_decode(ctx_llama, batch_view);
    
    if (decode_result != 0) {
      // If decode failed, try with smaller batch
      if (n_tokens > 1 && decode_result == 1) {
        log_message("[INFO] Batch decode failed, retrying with smaller batch size: " + 
                    std::to_string(n_tokens/2), logger);
        
        // Retry with half the batch size
        int retry_chunk_size = n_tokens / 2;
        for (int j = 0; j < n_tokens; j += retry_chunk_size) {
          int chunk_end = std::min(j + retry_chunk_size, n_tokens);
          llama_batch small_batch = llama_batch_get_one(tokens_data.data() + i + j, chunk_end - j);
          
          int64_t retry_start = ggml_time_ms();
          if (llama_decode(ctx_llama, small_batch) != 0) {
            log_message("[ERROR] Failed to decode even with smaller batch at position " + 
                        std::to_string(i + j), logger);
            return false;
          }
          int64_t retry_time = ggml_time_ms() - retry_start;
          log_message("[BATCH] Retry batch " + std::to_string(j/retry_chunk_size + 1) + 
                      ": processed " + std::to_string(chunk_end - j) + " tokens in " + 
                      std::to_string(retry_time) + " ms (" + 
                      std::to_string((chunk_end - j) * 1000.0 / retry_time) + " tokens/s)", logger);
        }
      } else {
        log_message("[ERROR] Decode failed with code " + std::to_string(decode_result) +
                    " for batch of size " + std::to_string(n_tokens), logger);
        return false;
      }
    }
    
    // Calculate timing for this batch
    int64_t batch_time_ms = ggml_time_ms() - batch_start_time;
    total_batch_time_ms += batch_time_ms;
    
    // Move to next chunk
    i_next = i + n_tokens;
    
    // Log timing and progress for EVERY batch
    double tokens_per_second = n_tokens * 1000.0 / std::max(batch_time_ms, (int64_t)1);
    log_message("[BATCH] Batch " + std::to_string(batch_count) + 
                ": processed " + std::to_string(n_tokens) + " tokens in " + 
                std::to_string(batch_time_ms) + " ms (" + 
                std::to_string(tokens_per_second) + " tokens/s) - Total: " + 
                std::to_string(i_next) + "/" + std::to_string(N) + " tokens", logger);
  }
  
  // Log overall summary
  if (batch_count > 1) {
    double avg_tokens_per_second = N * 1000.0 / std::max(total_batch_time_ms, (int64_t)1);
    log_message("[BATCH] Summary: Processed " + std::to_string(N) + " tokens in " + 
                std::to_string(batch_count) + " batches, total time: " + 
                std::to_string(total_batch_time_ms) + " ms (" + 
                std::to_string(avg_tokens_per_second) + " tokens/s average)", logger);
  }
  
  // Update past token count
  auto* memory = llama_get_memory(ctx_llama);
  if (!memory) {
    *n_past = 0;
  } else {
    llama_pos max_pos = llama_memory_seq_pos_max(memory, 0);
    *n_past = max_pos + 1;  // Convert 0-based position to count
  }
  return true;
}

static bool add_tokens_to_context(struct llama_context *ctx_llama,
                                  const std::vector<llama_token> &tokens,
                                  int n_batch, int *n_past,
                                  fllama_log_callback logger) {
  // Use the new batch view processing function
  return process_tokens_with_batch_view(ctx_llama, tokens, n_batch, n_past, logger);
}

static bool add_token_to_context(struct llama_context *ctx_llama,
                                 llama_token id, int *n_past,
                                 fllama_log_callback logger) {
  // Adding token to context

    // Check context space
    int n_ctx = llama_n_ctx(ctx_llama);
    // Get the maximum position (0-based) and convert to count
    int n_ctx_used = 0;
    auto* memory = llama_get_memory(ctx_llama);
    if (memory) {
      llama_pos max_pos = llama_memory_seq_pos_max(memory, 0);
      n_ctx_used = max_pos + 1;
    }

  if (n_ctx_used + 1 > n_ctx) {
    log_message("context size exceeded", logger);
    return false;
  }

  // Create batch with a single token, following simple-chat.cpp
  llama_batch batch = llama_batch_get_one(&id, 1);
  log_message("[DEBUG] created batch with token " + std::to_string(id), logger);

  // No need to manually manage logits - llama_batch_get_one handles this

  log_message("[DEBUG] about to decode", logger);
  if (llama_decode(ctx_llama, batch)) {
    log_message("failed to decode", logger);

    return false;
  }
  log_message("[DEBUG] decode successful", logger);

  llama_batch_free(batch);
  auto* mem = llama_get_memory(ctx_llama);
  if (!mem) {
    *n_past = 1;  // We just added one token
  } else {
    llama_pos max_pos = llama_memory_seq_pos_max(mem, 0);
    *n_past = max_pos + 1;  // Convert 0-based position to count
  }
  return true;
}

static bool add_string_to_context(struct llama_context *ctx_llama,
                                  const char *str, int n_batch, int *n_past,
                                  bool add_bos, fllama_log_callback logger) {
  std::string str2 = str;
  const llama_vocab *vocab = llama_model_get_vocab(llama_get_model(ctx_llama));
  const int n_prompt_tokens = -llama_tokenize(
      vocab, str2.c_str(), str2.length(), NULL, 0, add_bos, true);
  std::vector<llama_token> embd_inp(n_prompt_tokens);
  if (llama_tokenize(vocab, str2.c_str(), str2.length(), embd_inp.data(),
                     embd_inp.size(), add_bos, true) < 0) {
    log_message("tokenization failed", logger);
    return false;
  }
  return add_tokens_to_context(ctx_llama, embd_inp, n_batch, n_past, logger);
}

static void log_callback_wrapper(enum ggml_log_level level, const char *text,
                                 void *user_data) {
  std::cout << "[llama] " << text;
}

EMSCRIPTEN_KEEPALIVE void
fllama_inference_sync(fllama_inference_request request,
                      fllama_inference_callback callback) {
  // Easier to do this up top: Gemma 3 multimodal requires some specific setup
  // throughout the method.
  bool is_gemma3_model_detected = is_gemma3_model(request.model_path);
  // Setup parameters, then load the model and create a context.
  int64_t start = ggml_time_ms();
  std::cout << "[fllama] Inference thread start" << std::endl;
  try {
    ggml_backend_load_all();
    std::cout << "[fllama] Backend initialized." << std::endl;

    llama_context_params ctx_params = llama_context_default_params();
    std::cout << "[fllama] Initializing params." << std::endl;
    uint32_t requested_context_size = request.context_size;
    ctx_params.n_ctx = requested_context_size;
    std::cout << "[fllama] Context size: " << ctx_params.n_ctx << std::endl;
    // >=32 needed for BLAS.
    // # Why is n_batch = context size?
    // Post-Jan 2025 update, the llama.cpp inference imitates simple-chat.cpp,
    // which adds the entire prompt in one call. There isn't a downside to this,
    // in early 2024, there used to be an issue with memory headroom and context
    // size on extremely constrained devices, but that's no longer the case.
    //
    // Now, if we try using a batch size < input token count, there will be an
    // assertion failure. In general, it seems batch_size = context_size is the
    // best way because that guarantees as the batch updates after each
    // inference run, there won't be any issues. (the idea there might be an
    // issue assumes batch = input + all tokens generated thus far, which may
    // not be the case)
    uint32_t n_batch = requested_context_size;
    ctx_params.n_batch = requested_context_size;
    if (is_gemma3_model_detected) {
      // For Gemma 3, as of 2025-03-12, n_ubatch has to be >= n_tokens
      // Error:
      // /Users/jamesoleary/dev/fllama/macos/llama.cpp/src/llama-context.cpp:1196:
      // GGML_ASSERT((cparams.causal_attn || cparams.n_ubatch >= n_tokens_all) &&
      // "non-causal attention requires n_ubatch >= n_tokens") failed
      ctx_params.n_ubatch = requested_context_size;

      // Should reduce RAM usage w/Gemma, have not observed so, yet.
      ctx_params.swa_full = false;
    }
    std::cout << "[fllama] Batch size: " << ctx_params.n_batch << std::endl;
    ctx_params.flash_attn = false;
    std::cout << "[fllama] flash_attn: " << ctx_params.flash_attn << std::endl;
    std::cout << "[fllama] swa_full: " << ctx_params.swa_full << std::endl;

    // TODO: params.n_predict = request.max_tokens;
    // std::cout << "[fllama] Max tokens: " << params.n_predict << std::endl;
    // TODO: params.n_threads = request.num_threads;
    // std::cout << "[fllama] Number of threads: " << params.n_threads <<
    // std::endl;
    // Generate a random seed using std::random_device for better randomness
    std::random_device rd;
    uint32_t random_seed = rd();
    log_message("Using random seed: " + std::to_string(random_seed), request.dart_logger);
    
    llama_sampler *smpl =
        llama_sampler_chain_init(llama_sampler_chain_default_params());
    llama_sampler_chain_add(
        smpl, llama_sampler_init_min_p((1.0f - request.top_p), 1));
    llama_sampler_chain_add(smpl, llama_sampler_init_temp(request.temperature));
    llama_sampler_chain_add(smpl, llama_sampler_init_dist(random_seed));

    llama_model_params model_params = llama_model_default_params();
    // std::vector<llama_sampler_type> samplers = {
    //     llama_sampler_type::TOP_P, llama_sampler_type::TEMPERATURE};
    // params.sparams.samplers_sequence = samplers;
    // params.sparams.top_p = request.top_p;
    // std::cout << "[fllama] Top_p: " << params.sparams.top_p << std::endl;
    // TODO: request.grammar
    // if (request.grammar != NULL && strlen(request.grammar) > 0) {
    //   std::cout << "[fllama] Grammar: " << request.grammar << std::endl;
    //   params.sparams.grammar = std::string(request.grammar);
    // }
    // std::cout << "[fllama] Model path: " << params.model << std::endl;
// Force CPU if iOS simulator: no GPU support available, hangs.
#if TARGET_IPHONE_SIMULATOR
    model_params.n_gpu_layers = 0;
// Otherwise, for physical iOS devices and other platforms
#else
    model_params.n_gpu_layers = request.num_gpu_layers;
    // fllama_log("[fllama] Number of GPU layers requested: " +
    //  std::to_string(params.n_gpu_layers),
    //  request.dart_logger);
    std::cout << "[fllama] Number of GPU layers requested: "
              << model_params.n_gpu_layers << std::endl;
#endif
    // Check if a Dart logger function is provided, use it if available.
    if (request.dart_logger != NULL) {
      std::cout << "[fllama] Request log callback for llama.cpp detected";
      llama_log_set(
          [](enum ggml_log_level level, const char *text, void *user_data) {
            fllama_log_callback dart_logger =
                reinterpret_cast<fllama_log_callback>(user_data);
            dart_logger(text);
          },
          reinterpret_cast<void *>(request.dart_logger));
      std::cout << "[fllama] Request log callback installed for llama.cpp. ";
    } else {
      std::cout
          << "[fllama] fllama default log callback installed for llama.cpp. ";
      llama_log_set(log_callback_wrapper, NULL);
    }
    // By default, llama.cpp emits a llama.log file containing ex. ~20 highest
    // probability tokens and the tokens selected. This is interesting, but,
    // there's privacy implications with that, as well as the log will grow
    // unbounded according to an issue on the llama.cpp GitHub repo.
    //
    // This imitates the solution used in the llama.cpp server when
    // --log-disable is passed.
    //
    // See https://github.com/ggerganov/llama.cpp/pull/4260.
    // TODO: ???
    // log_set_target(stdout);
    log_message("Initialized llama logger.", request.dart_logger);
    // !!! Specific to multimodal
    bool prompt_contains_img = prompt_contains_image(request.input);
    bool should_load_clip = false;

    if (prompt_contains_img) {
      log_message("Prompt contains images, will process them later.",
                  request.dart_logger);
      std::string mmproj =
          request.model_mmproj_path == NULL ? "" : request.model_mmproj_path;
      if (mmproj.empty()) {
        log_message(
            "Warning: prompt contains images, but inference request doesn't "
            "specify model_mmproj_path. Multimodal model requires a .mmproj "
            "file.",
            request.dart_logger);
      } else {
        should_load_clip = true;
      }

      if (is_gemma3_model_detected) {
        log_message("Detected Gemma3 model with images - will use "
                    "Gemma3-specific processing",
                    request.dart_logger);
      }
    }

    // Use ModelHandle for proper RAII and thread safety
    ModelHandle model_handle;
    llama_model *model = nullptr;
    llama_context *ctx = nullptr;
    std::vector<llava_image_embed *> image_embeddings;
    char *c_result = nullptr;
    std::string model_path_str = request.model_path ? request.model_path : "";
    bool context_reuse_possible = false;
    ModelResources* model_resources = nullptr;
    
    // RAII helper to ensure context lock is released even on exception
    class ContextLockGuard {
      ModelHandle* handle_ptr = nullptr;
      bool locked = false;
    public:
      ContextLockGuard() = default;
      explicit ContextLockGuard(ModelHandle& h) : handle_ptr(&h) {}
      
      // Move constructor and assignment
      ContextLockGuard(ContextLockGuard&& other) noexcept 
        : handle_ptr(other.handle_ptr), locked(other.locked) {
        other.handle_ptr = nullptr;
        other.locked = false;
      }
      
      ContextLockGuard& operator=(ContextLockGuard&& other) noexcept {
        if (this != &other) {
          unlock();
          handle_ptr = other.handle_ptr;
          locked = other.locked;
          other.handle_ptr = nullptr;
          other.locked = false;
        }
        return *this;
      }
      
      // Delete copy operations
      ContextLockGuard(const ContextLockGuard&) = delete;
      ContextLockGuard& operator=(const ContextLockGuard&) = delete;
      
      bool try_lock() {
        if (handle_ptr && handle_ptr->valid()) {
          locked = handle_ptr->try_lock_context_for_reuse();
          return locked;
        }
        return false;
      }
      
      void unlock() {
        if (locked && handle_ptr) {
          handle_ptr->unlock_context();
          locked = false;
        }
      }
      
      ~ContextLockGuard() { unlock(); }
    };
    
    auto cleanup = [&]() {
      // Always free the sampler since we create a new one for each request
      if (smpl)
        llama_sampler_free(smpl);
      
      // Note: The ModelHandle will automatically decrement users and handle cleanup
      // We don't need to manually free model or context - the handle manages it
      llama_backend_free();
      // c_result is freed automatically by unique_ptr
    };
    // Process OpenAI chat messages if provided
    log_message("Initializing llama model...", request.dart_logger);
    
    // Try to get an existing model using the safe handle API
    model_handle = global_inference_queue.get_model_handle(model_path_str);
    
    // Create context lock guard that will auto-unlock on scope exit
    ContextLockGuard context_guard(model_handle);
    
    if (model_handle.valid()) {
      // Model exists and we have a safe handle to it
      model = model_handle.model();
      ctx = model_handle.ctx();
      model_resources = model_handle.operator->();
      
      // Try to lock context for exclusive reuse
      context_reuse_possible = context_guard.try_lock();
      
      log_message(context_reuse_possible ? 
                 "Context reuse is possible - model is cached with single user" : 
                 "Context reuse not possible - model has multiple users", 
                 request.dart_logger);
    } else {
      log_message("Model not cached, will load from file", request.dart_logger);
    }
    
    // Create a new sampler for each request since samplers are lightweight
    // and depend on request-specific parameters (temperature, top_p, seed)
    smpl = llama_sampler_chain_init(llama_sampler_chain_default_params());
    llama_sampler_chain_add(smpl, llama_sampler_init_min_p((1.0f - request.top_p), 1));
    llama_sampler_chain_add(smpl, llama_sampler_init_temp(request.temperature));
    llama_sampler_chain_add(smpl, llama_sampler_init_dist(random_seed));
    
    if (!model_handle.valid()) {
      // Need to load the model from file
      log_message("Loading model from file: " + model_path_str, request.dart_logger);
      model = llama_model_load_from_file(request.model_path, model_params);
      if (!model) {
        callback("Error: Failed to load model from file", "", true);
        cleanup();
        return;
      }
      ctx = llama_init_from_model(model, ctx_params);
      if (!ctx) {
        callback("Error: Failed to create context", "", true);
        llama_model_free(model);
        cleanup();
        return;
      }
      
      // Register and acquire the model atomically
      model_handle = global_inference_queue.register_and_acquire_model(model_path_str, model, ctx);
      if (!model_handle.valid()) {
        // Registration failed - another thread may have loaded it simultaneously
        log_message("Failed to register model - checking if another thread loaded it", request.dart_logger);
        // Clean up our loaded model
        llama_free(ctx);
        llama_model_free(model);
        
        // Try to get the model again
        model_handle = global_inference_queue.get_model_handle(model_path_str);
        if (!model_handle.valid()) {
          callback("Error: Failed to register or retrieve model", "", true);
          cleanup();
          return;
        }
      }
      
      // Update our pointers from the handle
      model = model_handle.model();
      ctx = model_handle.ctx();
      model_resources = model_handle.operator->();
      // Update the context guard with the new handle
      context_guard = std::move(ContextLockGuard(model_handle));
      // Try to lock context - should succeed since we just loaded it
      context_reuse_possible = context_guard.try_lock();
      log_message("Successfully loaded and registered model", request.dart_logger);
    } else {
      log_message("Using cached model: " + model_path_str, request.dart_logger);
    }
    
    if (model == NULL || ctx == NULL) {
      std::cout << "[fllama] Unable to load model." << std::endl;
      callback(/* response */ "Error: Unable to load model.", /* json */ "",
               /* done */ true);
      log_message("Error: Unable to load model.", request.dart_logger);
      cleanup();
      return;
    }

    log_message("Initialized model.", request.dart_logger);
    std::string final_request_input = request.input;

    nlohmann::ordered_json body = NULL;

    auto openai_json_string = request.openai_request_json_string;
    auto common_chat_format = COMMON_CHAT_FORMAT_CONTENT_ONLY;
    std::string jinja_template = "";
    if (openai_json_string != NULL) {
      log_message("Processing OpenAI-style API request via JSON",
                  request.dart_logger);
      try {
        body = json::parse(openai_json_string);
        if (body.contains("jinja_template") && body["jinja_template"].is_string()) {
          jinja_template = body["jinja_template"].get<std::string>();
          body.erase("jinja_template");
          log_message("Using custom Jinja template: " + jinja_template,
                      request.dart_logger);
        }

        auto chat_templates = common_chat_templates_init(model, jinja_template);
        // Try to use model's built-in template, fallback to chatml
        try {
          common_chat_format_example(chat_templates.get(), true);
        } catch (const std::exception &e) {
          log_message(
              "Model's chat template not supported, falling back to chatml",
              request.dart_logger);
          chat_templates = common_chat_templates_init(model, "chatml");
        }

        // Format messages using chat template
        if (body.contains("messages") && body["messages"].is_array()) {
          common_chat_templates_inputs tmpl_inputs;
          tmpl_inputs.use_jinja = true;
          tmpl_inputs.add_generation_prompt = true;
          tmpl_inputs.messages =
              common_chat_msgs_parse_oaicompat<json>(body["messages"]);

          // Handle tools if present
          if (body.contains("tools")) {

            log_message("DEBUG Tools JSON: " + body["tools"].dump(),
                        request.dart_logger);
            auto tools = json_value(body, "tools", json());
            log_message("DEBUG Tools after json_value: " + tools.dump(),
                        request.dart_logger);

            // Check the actual type
            log_message("DEBUG Tools type: " + std::string(tools.type_name()),
                        request.dart_logger);

            tmpl_inputs.tools = common_chat_tools_parse_oaicompat(tools);
            tmpl_inputs.tool_choice =
                body.contains("tool_choice")
                    ? common_chat_tool_choice_parse_oaicompat(
                          body["tool_choice"].template get<std::string>())
                    : COMMON_CHAT_TOOL_CHOICE_AUTO;
          }
          
          // Log tmpl_inputs before applying templates
          log_message("DEBUG tmpl_inputs: {", request.dart_logger);
          log_message("  use_jinja: " + std::to_string(tmpl_inputs.use_jinja), request.dart_logger);
          log_message("  add_generation_prompt: " + std::to_string(tmpl_inputs.add_generation_prompt), request.dart_logger);
          log_message("  messages count: " + std::to_string(tmpl_inputs.messages.size()), request.dart_logger);
          
          // Log message details (roles and brief content previews)
          for (size_t i = 0; i < tmpl_inputs.messages.size(); i++) {
            const auto& msg = tmpl_inputs.messages[i];
            std::string content_preview = msg.content;
            if (content_preview.length() > 50) {
              content_preview = content_preview.substr(0, 47) + "...";
            }
            log_message("    message[" + std::to_string(i) + "]: role=" + msg.role + ", content_preview=\"" + content_preview + "\"", request.dart_logger);
          }
          
          if (!tmpl_inputs.tools.empty()) {
            log_message("  tools count: " + std::to_string(tmpl_inputs.tools.size()), request.dart_logger);
            for (size_t i = 0; i < tmpl_inputs.tools.size(); i++) {
              log_message("    tool[" + std::to_string(i) + "]: " + tmpl_inputs.tools[i].name, request.dart_logger);
            }
            
            log_message("  tool_choice: " + std::to_string(static_cast<int>(tmpl_inputs.tool_choice)), request.dart_logger);
          }
          
          log_message("}", request.dart_logger);
          
          auto result =
              common_chat_templates_apply(chat_templates.get(), tmpl_inputs);
          final_request_input = result.prompt;
          auto formatted_content_contains_image =
              prompt_contains_image(final_request_input);
          if (formatted_content_contains_image) {
            log_message(
                "Formatted content contains images, will process them later.",
                request.dart_logger);
            std::string mmproj = request.model_mmproj_path == NULL
                                     ? ""
                                     : request.model_mmproj_path;
            if (mmproj.empty()) {
              log_message(
                  "Warning: formatted content contains images, but inference "
                  "request doesn't specify model_mmproj_path. Multimodal model "
                  "requires a .mmproj file.",
                  request.dart_logger);
            } else {
              prompt_contains_img = true;
              should_load_clip = true;
            }
          }
          common_chat_format = result.format;
          log_message("Using formatted chat input with template",
                      request.dart_logger);
          log_message("Template format: " + std::string(common_chat_format_name(result.format)),
                      request.dart_logger);
          log_message("Formatted input: " + final_request_input,
                      request.dart_logger);
        } else {
          std::string keys;
          for (auto it = body.begin(); it != body.end(); ++it) {
            keys += it.key() + ", ";
          }
          if (!keys.empty()) {
            keys.pop_back(); // Remove last comma
            keys.pop_back(); // Remove last space
          }
          log_message("No messages found in OpenAI chat format. JSON Keys "
                      "ONLY, NO VALUES: " +
                          keys,
                      request.dart_logger);
        }
      } catch (const std::exception &e) {
        log_message("Error processing OpenAI chat format: " +
                        std::string(e.what()),
                    request.dart_logger);
        log_message("Falling back to raw input", request.dart_logger);
      }
    } else {
      log_message("No OpenAI chat format provided, using raw input",
                  request.dart_logger);
    }

    // TODO: CLIP support
    if (should_load_clip) {
      std::string mmproj_path_std_str =
          request.model_mmproj_path == NULL ? "" : request.model_mmproj_path;
      log_message("Loading multimodal model...", request.dart_logger);
      const char *mmproj_path = mmproj_path_std_str.c_str();
      auto ctx_clip = clip_model_load(mmproj_path, /*verbosity=*/1);
      std::cout << "Loaded model" << std::endl;
      // Use proper thread count for CLIP processing - matching gemma3-cli.cpp
      // Use Gemma3-specific image processing if this is a Gemma3 model
      image_embeddings = llava_image_embed_make_with_prompt_base64(ctx_clip, request.num_threads, final_request_input);
      clip_free(ctx_clip);
    }

    // It is important that this runs regardless of whether CLIP needs to be
    // loaded. For example, for an errorneus request that doesn't provide the
    // CLIP model path. Otherwise, inference has to tokenize the base64 image
    // string, which is not a good idea. (O(100,000K) tokens)
    if (prompt_contains_img) {
      if (image_embeddings.empty()) {
        std::cout
            << "[fllama] Unable to create image embeddings, removing image "
               "data from prompt."
            << std::endl;
      } else {
        std::cout << "[fllama] Images loaded, replacing image data in prompt "
                     "with clip output"
                  << std::endl;
      }
      final_request_input = remove_all_images_from_prompt(final_request_input, "");
    }

    int64_t model_load_end = ggml_time_ms();
    int64_t model_load_duration_ms = model_load_end - start;
    log_message("Model loaded @ " + std::to_string(model_load_duration_ms) +
                    " ms.",
                request.dart_logger);

    // Tokenize the prompt.  We will later use these tokens to decide whether
    // we can reuse an existing cached llama_context or whether we need to
    // replay the full prompt from scratch.
    const int n_ctx = llama_n_ctx(ctx);
    const llama_vocab *vocab = llama_model_get_vocab(model);

    const int n_prompt_tokens =
        -llama_tokenize(vocab, final_request_input.c_str(),
                        final_request_input.length(), NULL, 0, true, true);
    std::vector<llama_token> tokens_list(n_prompt_tokens);
    if (llama_tokenize(vocab, final_request_input.c_str(),
                       final_request_input.length(), tokens_list.data(),
                       tokens_list.size(), true, true) < 0) {
      fprintf(stderr, "%s: tokenization failed\n", __func__);
      callback("Error: Unable to tokenize input", "", true);
      cleanup();
      return;
    }
    log_message("Input token count: " + std::to_string(tokens_list.size()),
                request.dart_logger);
    log_message("Output token count: " + std::to_string(request.max_tokens),
                request.dart_logger);
    const int n_max_tokens = request.max_tokens;
    log_message("Number of threads: " + std::to_string(ctx_params.n_threads),
                request.dart_logger);

    // 2. Load the prompt into the context.
    int n_past = 0;

    // -------------------------------------------------------------------
    // Context & token-state reuse logic
    // -------------------------------------------------------------------
    // If we have a cached model and the new request's tokens have the
    // previous token_state as a prefix, we can avoid replaying those tokens
    // and simply continue the context from where we left off.
    bool reused_context = false;
    size_t prefix_len = 0;
    if (model_resources) {
      std::scoped_lock lk(model_resources->token_state_mutex);

      if (context_reuse_possible) {
        const std::vector<llama_token> &prev_tokens = model_resources->token_state;
        if (!prev_tokens.empty() && tokens_list.size() >= prev_tokens.size()) {
          bool is_prefix = true;
          for (size_t i = 0; i < prev_tokens.size(); ++i) {
            if (tokens_list[i] != prev_tokens[i]) {
              is_prefix = false;
              break;
            }
          }
          int n_ctx_limit = llama_n_ctx(ctx);
          if (is_prefix && static_cast<int>(tokens_list.size()) <= n_ctx_limit) {
            reused_context = true;
            prefix_len = prev_tokens.size();
            n_past = static_cast<int>(prefix_len);
            log_message("[CACHE] Reusing context. Prefix tokens: " + std::to_string(prefix_len), request.dart_logger);
          } else if (is_prefix) {
            log_message("[CACHE] Prefix matches but combined tokens exceed context window (" +
                        std::to_string(tokens_list.size()) + "/" + std::to_string(n_ctx_limit) +
                        "). Skipping reuse.", request.dart_logger);
          }
        } else {
          log_message("[CACHE] No prefix match. Previous tokens: " +
                      std::to_string(prev_tokens.size()) + ", current tokens: " +
                      std::to_string(tokens_list.size()), request.dart_logger);
        }
      } else {
        // We already logged the reason why context reuse isn't possible earlier
      }
    }

    if (!reused_context) {
      // Either no cached context or tokens diverged. Try smarter strategies before full reset.
      if (ctx && model_resources) {
        // Check for sliding window attention models
        const auto n_swa = llama_model_n_swa(model);
        if (n_swa > 0 && n_past > 0) {
          // For SWA models, check if we have enough valid cache data
          const auto pos_min = llama_memory_seq_pos_min(llama_get_memory(ctx), 0);
          if (pos_min > std::max(0, n_past - n_swa)) {
            log_message("[CACHE] SWA model detected with insufficient cache data. Forcing full reprocessing.", request.dart_logger);
            log_message("[CACHE] n_swa=" + std::to_string(n_swa) + ", n_past=" + std::to_string(n_past) + 
                        ", pos_min=" + std::to_string(pos_min), request.dart_logger);
            // Force full reprocessing for SWA models when cache is insufficient
            n_past = 0;
            llama_memory_clear(llama_get_memory(ctx), true);
            model_resources->token_state.clear();
          }
        }
        
        // Strategy 1: Try partial KV cache deletion if we have a partial match
        size_t common_prefix_len = 0;
        if (!model_resources->token_state.empty() && !tokens_list.empty() && n_past > 0) {
          // Find the common prefix between cached and new tokens
          const size_t min_len = std::min(model_resources->token_state.size(), tokens_list.size());
          for (size_t i = 0; i < min_len; ++i) {
            if (model_resources->token_state[i] == tokens_list[i]) {
              common_prefix_len++;
            } else {
              break;
            }
          }
        }
        
        if (common_prefix_len > 0) {
          // We have a partial match - try to keep the common prefix
          log_message("[CACHE] Partial match found. Common prefix: " + std::to_string(common_prefix_len) + 
                      " tokens. Attempting partial KV cache retention.", request.dart_logger);
          
          // Try to remove only the divergent part
          if (llama_memory_seq_rm(llama_get_memory(ctx), 0, common_prefix_len, -1)) {
            // Successfully removed divergent part, update state
            model_resources->token_state.resize(common_prefix_len);
            prefix_len = common_prefix_len;
            n_past = static_cast<int>(common_prefix_len);
            reused_context = true;  // Mark as partial reuse
            log_message("[CACHE] Successfully retained " + std::to_string(common_prefix_len) + 
                        " prefix tokens", request.dart_logger);
          } else {
            // Partial deletion failed, fall back to full clear
            log_message("[CACHE] Partial deletion failed, clearing entire cache", request.dart_logger);
            llama_memory_clear(llama_get_memory(ctx), true);
            model_resources->token_state.clear();
          }
        } else {
          // No common prefix, clear everything
          log_message("[CACHE] No common prefix found, clearing entire cache", request.dart_logger);
          llama_memory_clear(llama_get_memory(ctx), true);
          model_resources->token_state.clear();
        }
      } else if (ctx) {
        // No model resources, just clear
        log_message(
            "[CACHE] No model resources available, clearing context.",
            request.dart_logger);
        llama_memory_clear(llama_get_memory(ctx), true);
      }
    }
    bool add_bos = llama_add_bos_token(vocab);
    int idx_embedding = 0;
    // Check if this is a Gemma 3 model
    bool is_gemma3 = is_gemma3_model_detected;
    if (is_gemma3) {
      log_message(
          "Detected Gemma 3 model, using Gemma-specific conversation format",
          request.dart_logger);
    }

    for (auto *embedding : image_embeddings) {
      if (embedding != NULL) {
        // For Gemma 3, we don't need the "Attached Image" text as it uses
        // <start_of_image> and <end_of_image> tokens
        if (image_embeddings.size() > 1 && !is_gemma3) {
          const std::string image_prompt =
              "Attached Image #" + std::to_string(idx_embedding + 1) + ":\n";
          add_string_to_context(ctx, image_prompt.c_str(), n_batch, &n_past,
                                add_bos, request.dart_logger);
          idx_embedding++;
        }
        log_message("Adding image #" + std::to_string(idx_embedding + 1) +
                        " to context.",
                    request.dart_logger);
        // For Gemma3 models, print detailed information about the embeddings
        if (is_gemma3_model_detected) {
          fprintf(stderr, "Processing Gemma3 image with %d tokens from embedding\n", embedding->n_image_pos);
          // Add <start_of_image> token
          add_string_to_context(ctx, "<start_of_image>", n_batch, &n_past,
                                add_bos, request.dart_logger);
        }
        
        // Always force is_gemma3 flag to match is_gemma3_model_detected to avoid mismatches
        auto success = add_image_embed_to_context(ctx, embedding, n_batch,
                                              &n_past, is_gemma3_model_detected);
        if (!success) {
          log_message(
              "Unable to add image to context. Continuing to run inference "
              "anyway.",
              request.dart_logger);
        } else {
          // Add <end_of_image> token
          add_string_to_context(ctx, "<end_of_image>", n_batch, &n_past,
                                add_bos, request.dart_logger);
        }
        llava_image_embed_free(embedding);
        log_message("Added image #" + std::to_string(idx_embedding + 1) +
                        " to context.",
                    request.dart_logger);
      }
    }

    log_message("Adding input to context...length: " +
                    std::to_string(final_request_input.length()),
                request.dart_logger);
    log_message("Context size: " + std::to_string(n_ctx), request.dart_logger);
    log_message("Input tokens: " + std::to_string(tokens_list.size()),
                request.dart_logger);
    // Process tokens in batches for better performance with batch views
    if (reused_context) {
      // We have reused some context, only process new tokens
      if (prefix_len < tokens_list.size()) {
        std::vector<llama_token> suffix_tokens(tokens_list.begin() + prefix_len,
                                               tokens_list.end());
        log_message("[CACHE] Processing " + std::to_string(suffix_tokens.size()) + 
                    " new tokens after reused prefix", request.dart_logger);
        
        // Process with batch views for better performance
        if (!process_tokens_with_batch_view(ctx, suffix_tokens, n_batch, &n_past, request.dart_logger)) {
          callback("Error: Failed to process prompt", "", true);
          cleanup();
          return;
        }
      } else {
        log_message("[CACHE] All tokens already in cache, no new tokens to process", request.dart_logger);
      }
    } else {
      // No reuse, but still process with batch views for better performance
      log_message("[CACHE] Processing full prompt of " + std::to_string(tokens_list.size()) + 
                  " tokens with batch views", request.dart_logger);
      
      if (!process_tokens_with_batch_view(ctx, tokens_list, n_batch, &n_past, request.dart_logger)) {
        callback("Error: Failed to process prompt", "", true);
        cleanup();
        return;
      }
    }
    if (tokens_list.size() > n_ctx) {
      log_message("Input tokens exceed context size.", request.dart_logger);
      auto error_message = "Error: Input exceeds context size. Input tokens: " +
                           std::to_string(tokens_list.size()) +
                           ", context size: " + std::to_string(n_ctx);
      callback(error_message.c_str(), "", true);
      cleanup();
      return;
    }

    log_message("Added input to context.", request.dart_logger);
    const char *eos_token_chars =
        request.eos_token != NULL ? request.eos_token
                                  : fllama_get_eos_token(request.model_path);
    const std::string eos_token_as_string = std::string(eos_token_chars);
    free((void *)eos_token_chars);
    const int64_t context_setup_complete = ggml_time_ms();
    log_message("Context setup complete & input added to context. Took " +
                    std::to_string(context_setup_complete - start) + " ms.",
                request.dart_logger);

    // 3. Generate tokens.
    // Check for cancellation before starting the generation loop
    int request_id = request.request_id;

    if (global_inference_queue.is_cancelled(request_id)) {
      log_message("Cancelled before starting generation loop. ID:" +
                      std::to_string(request_id),
                  request.dart_logger);
      callback("", "", true);
      cleanup();
      return;
    }

    const auto estimated_total_size = n_max_tokens * 10;
    std::string result;
    result.reserve(estimated_total_size);
    
    // Use unique_ptr for automatic cleanup
    auto c_result_holder = std::unique_ptr<char[], decltype(&free)>(
        (char*)malloc(estimated_total_size), &free);
    c_result = c_result_holder.get(); // Get raw pointer for compatibility

    int n_gen = 0;
    std::string buffer;   // Buffer to accumulate potential EOS token sequences
    json last_valid_json; // Track last valid JSON response
    std::string last_valid_json_string;
    bool has_valid_json = false;

    const auto model_eos_token = llama_token_eos(vocab);
    const int64_t start_t = ggml_time_ms();
    int64_t t_last = start_t;

    std::vector<std::string> eos_tokens = {
        eos_token_as_string, // The original EOS token
        "<|end|>",           // Phi 3 24-04-30
        "<|eot_id|>"         // Llama 3 24-04-30
    };
    /**
     * Token Generation Loop
     *
     * Each iteration follows this sequence:
     * 1. Decode current batch (updates KV cache/model state)
     * 2. Sample next token (using updated state)
     * 3. Convert token to text & add to output
     * 4. Create new batch with sampled token (for next iteration)
     *
     * Batches represent "what needs to be processed to update the state
     * before we can sample the next token". The model's state is maintained
     * in its KV cache, which gets updated when we decode each batch.
     *
     * Example flow:
     * Initial state -> [decode nothing] -> sample "The" ->
     * [decode "The"] -> sample "cat" ->
     * [decode "cat"] -> sample "sat" -> ...
     */
    log_message("[DEBUG] starting token generation loop", request.dart_logger);
    std::vector<llama_token> generated_token_ids;
    llama_token new_token_id = llama_sampler_sample(smpl, ctx, -1);
    llama_batch batch = llama_batch_get_one(&new_token_id, 1);

    while (true) {
      // Check context space and apply context shifting if needed
      int n_ctx = llama_n_ctx(ctx);
      int n_ctx_used = 0;
      auto* memory = llama_get_memory(ctx);
      if (!memory) {
        // If no memory module, we can't do context shifting
        break;
      } else {
        llama_pos max_pos = llama_memory_seq_pos_max(memory, 0);
        n_ctx_used = max_pos + 1;  // Convert 0-based position to count
      }
      
      // Context shifting: When we're about to run out of context space,
      // we shift the context window by removing older tokens from the KV cache
      // This allows for infinite generation at the cost of forgetting earlier parts
      if (n_ctx_used + batch.n_tokens > n_ctx) {
        // Check if context shifting is available
        if (!llama_memory_can_shift(llama_get_memory(ctx))) {
          break;
        }
        
        // Perform context shift
        const int n_keep = 32;  // Keep first 32 tokens (usually includes system prompt)
        const int n_left = n_ctx_used - n_keep;
        const int n_discard = n_left / 2;  // Discard half of the available context
        
        log_message("[CONTEXT] Shifting context: keeping " + std::to_string(n_keep) + 
                    " tokens, discarding " + std::to_string(n_discard) + " tokens", request.dart_logger);
        
        // Remove tokens from KV cache
        if (!llama_memory_seq_rm(llama_get_memory(ctx), 0, n_keep, n_keep + n_discard)) {
          log_message("[ERROR] Failed to remove tokens from KV cache during context shift", request.dart_logger);
          break;
        }
        
        // Shift remaining tokens
        llama_memory_seq_add(llama_get_memory(ctx), 0, n_keep + n_discard, n_ctx_used, -n_discard);
        
        // Update n_past to reflect the shift
        n_past -= n_discard;
        
        // Update cached tokens if model resources exist
        if (model_resources) {
          std::scoped_lock lk(model_resources->token_state_mutex);
          if (model_resources->token_state.size() > static_cast<size_t>(n_keep + n_discard)) {
            // Remove the discarded tokens from our cache
            model_resources->token_state.erase(
              model_resources->token_state.begin() + n_keep,
              model_resources->token_state.begin() + n_keep + n_discard
            );
          }
        }
        
        log_message("[CONTEXT] Context shift complete. New n_past: " + std::to_string(n_past), request.dart_logger);
        
        // Re-check if we now have space
        memory = llama_get_memory(ctx);
        if (!memory) {
          break;
        }
        llama_pos new_max_pos = llama_memory_seq_pos_max(memory, 0);
        n_ctx_used = new_max_pos + 1;  // Convert 0-based position to count
        if (n_ctx_used + batch.n_tokens > n_ctx) {
          break;
        }
      }

      // Convert current token to text and output it
      char token_text[256];
      int token_len = llama_token_to_piece(vocab, new_token_id, token_text,
                                           sizeof(token_text), 0, true);
      if (token_len < 0) {
        log_message("[DEBUG] failed to convert token to text",
                    request.dart_logger);
        break;
      }

      // Record generated token id for cache update later
      generated_token_ids.push_back(new_token_id);

      // Add to result and send partial update
      std::string piece(token_text, token_len);
      result += piece;
      n_gen++;
      if (callback != NULL) {
        std::strcpy(c_result, result.c_str());
        auto completion_response = to_json_oaicompat_chat(
            result, request.model_path,
            "cmpl-" + std::to_string(request.request_id), "", STOP_TYPE_NONE,
            common_chat_format, n_gen, n_prompt_tokens);

        // Only update last_valid_json and call callback if we got a valid
        // response (i.e. if the response isn't just echoing back
        // last_valid_json)
        if (completion_response != NULL &&
            (!has_valid_json || completion_response != last_valid_json)) {
          std::string json_str = completion_response.dump();
          if (is_valid_utf8(json_str)) {
            last_valid_json = completion_response;
            last_valid_json_string = json_str;
            has_valid_json = true;
            callback(c_result, last_valid_json_string.c_str(), false);
          } else {
            log_message("[DEBUG] invalid UTF-8 in JSON response",
                        request.dart_logger);
          }
        } else {
          log_message(
              "[DEBUG] skipping callback. completion_response null? " +
                  std::to_string(completion_response == NULL) +
                  ", has_valid_json? " + std::to_string(has_valid_json) +
                  ", response == last_valid_json? " +
                  std::to_string(completion_response == last_valid_json),
              request.dart_logger);
        }
      }

      // Process current batch
      if (llama_decode(ctx, batch)) {
        log_message("[DEBUG] decode failed", request.dart_logger);
        break;
      }
      // Sample next token
      new_token_id = llama_sampler_sample(smpl, ctx, -1);

      // Check for end conditions
      if (llama_token_is_eog(vocab, new_token_id)) {
        log_message("[DEBUG] end of generation detected", request.dart_logger);
        break;
      }
      if (n_gen >= n_max_tokens) {
        log_message("[DEBUG] reached max tokens: " +
                        std::to_string(n_max_tokens),
                    request.dart_logger);
        break;
      }
      if (global_inference_queue.is_cancelled(request_id)) {
        log_message("[DEBUG] generation cancelled", request.dart_logger);
        break;
      }

      // Create new batch for next iteration
      batch = llama_batch_get_one(&new_token_id, 1);
      // auto add_to_context_end = std::chrono::high_resolution_clock::now();
      // std::chrono::duration<double, std::milli> add_to_context_duration =
      //     add_to_context_end - add_to_context_start;
      // fllama_log("Add to context took " +
      // std::to_string(add_to_context_duration.count()) +
      //                " milliseconds.",
      //            request.dart_logger);

      // If greater than a second has passed since last log, log
      // the speed of generation.
      const auto t_now = ggml_time_ms();
      if (t_now - t_last > 1000) {
        fprintf(stderr,
                "[fllama] generated %d tokens in %.2f s, speed: %.2f t/s\n",
                n_gen, (t_now - start_t) / 1000.0,
                n_gen / ((t_now - start_t) / 1000.0));
        t_last = t_now;
      }

      // Check for EOS on model tokens
      if (llama_token_is_eog(vocab, new_token_id)) {
        fprintf(stderr, "%s: Finish. Model EOS token found.", __func__);
        if (buffer.length() > 0) {
          result += buffer;
        }
        break;
      }
      // auto other_end = std::chrono::high_resolution_clock::now();
      // std::chrono::duration<double, std::milli> other_duration =
      //     other_end - sample_end;
      // fllama_log("Other took " + std::to_string(other_duration.count()) +
      //                " milliseconds.",
      //            request.dart_logger);
    }
    log_message("[DEBUG] token generation loop complete", request.dart_logger);
    // If EOS token is found, above loop does not add it to buffer, and the
    // loop stops immediately.
    //
    // That leaves the last tokens whos length sum < EOS token length in buffer.
    //
    // Add it to result.
    //
    // Oddly, this issue was only readily apparent when doing function
    // calling with models < 7B.
    // if (buffer.length() > 0) {
    //   result += buffer;
    // }

    // Can't free this: the threading behavior is such that the Dart function
    // will get the pointer at some point in the future. Infrequently, 1 / 20
    // times, this will be _after_ this function returns. In that case, the
    // final output is a bunch of null characters: they look like 6 vertical
    // lines stacked.

    std::strcpy(c_result, result.c_str());
    if (callback != NULL) {
      log_message("[DEBUG] Invoking final callback", request.dart_logger);

      // Parse the result using common_chat_parse to extract tool calls
      auto json_string = "";

      if (!has_valid_json) {
        log_message("[DEBUG] Never had valid JSON", request.dart_logger);
        // If we never got valid JSON, return empty content
        auto completion_response = to_json_oaicompat_chat(
            "", request.model_path,
            "cmpl-" + std::to_string(request.request_id), "" /* build info */,
            STOP_TYPE_LIMIT, common_chat_format, n_gen, n_prompt_tokens);
        json_string = completion_response == NULL
                          ? NULL
                          : completion_response.dump().c_str();
        auto is_valid_string =
            json_string == NULL ? false : is_valid_utf8(json_string);
        if (is_valid_string) {
          log_message("[DEBUG] Never had valid JSON, was able to produce valid "
                      "JSON for an empty message",
                      request.dart_logger);
          // Never had valid JSON, was able to produce valid JSON for an empty
          // message.
          callback(c_result, json_string, true);
        } else {
          // Never had valid JSON, could not produce valid JSON for an empty
          // message.
          callback(c_result,
                   "Never had valid JSON, could not produce valid JSON for an "
                   "empty message.",
                   true);
        }
      } else {
        if (is_valid_utf8(last_valid_json_string)) {
          log_message("[DEBUG] Final JSON  is valid UTF-8. Response length: " +
                          std::to_string(last_valid_json_string.length()),
                      request.dart_logger);
          callback(c_result, last_valid_json_string.c_str(), true);
        } else {
          log_message("[DEBUG] Final JSON response is invalid UTF-8",
                      request.dart_logger);
          callback(c_result,
                   "{\"error\": \"Invalid UTF-8 in final JSON response\"}",
                   true);
        }
      }
      log_message("[DEBUG] Final callback invoked", request.dart_logger);
    } else {
      log_message("WARNING: callback is NULL. Output: " + result,
                  request.dart_logger);
    }

    log_message("About to write speed of generation", request.dart_logger);

    const auto t_now = ggml_time_ms();

    const auto speed_string =
        "Generated " + std::to_string(n_gen) + " tokens in " +
        std::to_string((t_now - start_t) / 1000.0) +
        " s, speed: " + std::to_string(n_gen / ((t_now - start_t) / 1000.0)) +
        " t/s.";

    log_message(speed_string, request.dart_logger);

    log_message("Wrote speed of generation.", request.dart_logger);

    // -------------------------------------------------------------------
    // Update cached token_state for future reuse
    // -------------------------------------------------------------------
    if (model_resources) {
      // Take a single lock for the entire token state update to avoid race conditions
      std::scoped_lock lk(model_resources->token_state_mutex);
      
      if (!reused_context) {
        // We fed the full prompt, start fresh token state
        model_resources->token_state = tokens_list;
      } else {
        // We only fed suffix tokens, token_state already has prefix
        // (prev_tokens). Ensure it matches up to prefix_len, then append
        // suffix tokens we actually fed (which may be zero)
        if (model_resources->token_state.size() != prefix_len) {
          model_resources->token_state.resize(prefix_len);
        }
        // Append suffix tokens from prompt if any
        for (size_t i = prefix_len; i < tokens_list.size(); ++i) {
          model_resources->token_state.push_back(tokens_list[i]);
        }
      }
      
      // Append generated tokens
      model_resources->token_state.insert(model_resources->token_state.end(),
                                        generated_token_ids.begin(),
                                        generated_token_ids.end());
      
      log_message("Updated token state cache for future reuse. Total tokens: " + 
                 std::to_string(model_resources->token_state.size()), request.dart_logger);
    }
    // Instead of freeing everything immediately, we'll either cache the model
    // or free it based on our caching logic
    log_message("Managing model resources...", request.dart_logger);
    
    // Model registration and user count increment is now done immediately after loading
    // to prevent race conditions where the model could be freed during inference
    
    // Log the reuse status for debugging
    if (reused_context) {
      log_message("Successfully reused context with " + std::to_string(prefix_len) + 
                 " prefix tokens out of " + std::to_string(tokens_list.size()) + " total tokens", 
                 request.dart_logger);
    } else {
      log_message("Did not reuse context - using fresh context", request.dart_logger);
    }
    
    // Now call cleanup() which will decrement the active users counter
    // and only free resources if they're not cached and no longer in use
    cleanup();
    log_message("Cleanup complete - model will be freed after " + 
                std::to_string(global_inference_queue.MODEL_INACTIVITY_TIMEOUT_SEC) + 
                " seconds of inactivity if no longer in use", request.dart_logger);
  } catch (const std::exception &e) {
    std::string error_msg = "Unhandled error: " + std::string(e.what());
    if (callback != NULL) {
      callback(error_msg.c_str(), error_msg.c_str(), true);
    }
    std::cerr << error_msg << std::endl;
  } catch (...) {
    std::string error_msg = "Unknown unhandled error occurred";
    if (callback != NULL) {
      callback(error_msg.c_str(), error_msg.c_str(), true);
    }
    std::cerr << error_msg << std::endl;
  }
}

} // extern "C"