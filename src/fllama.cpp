#include "fllama.h"
#include "fllama_llava.h"
#include "clip.h"
#include "llava.h"

// LLaMA.cpp cross-platform support
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
// iOS-specific includes
#include "../ios/llama.cpp/common/base64.hpp"
#include "../ios/llama.cpp/common/common.h"
#include "../ios/llama.cpp/common/sampling.h"
#include "../ios/llama.cpp/ggml.h"
#include "../ios/llama.cpp/llama.h"

#elif TARGET_OS_OSX
// macOS-specific includes
#include "../macos/llama.cpp/common/base64.hpp"
#include "../macos/llama.cpp/common/common.h"
#include "../macos/llama.cpp/common/sampling.h"
#include "../macos/llama.cpp/ggml.h"
#include "../macos/llama.cpp/llama.h"
#else
// Other platforms
#include "base64.hpp"
#include "common/common.h"
#include "ggml.h"
#include "llama.h"
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
#include <fstream>
#include <functional>
#include <iostream>
#include <limits.h>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <unordered_set>
#include <vector>

#if defined(_MSC_VER)
#pragma warning(disable : 4244 4267) // possible loss of data
#endif

// Multimodal stuff that needs to be pre-declared up top so there aren't
// compilation errors due to method order.
static std::vector<llava_image_embed *>
llava_image_embed_make_with_prompt_base64(struct clip_ctx *ctx_clip,
                                          int n_threads,
                                          const std::string &prompt);
static bool prompt_contains_image(const std::string &prompt);
static std::string remove_all_images_from_prompt(const std::string &prompt,
                                                 const char *replacement = "");
// End of pre-declared multimodal stuff
static bool add_tokens_to_context(struct llama_context *ctx_llama,
                                  std::vector<llama_token> tokens, int n_batch,
                                  int *n_past) {
  int N = (int)tokens.size();
  for (int i = 0; i < N; i += n_batch) {
    int n_eval = (int)tokens.size() - i;
    if (n_eval > n_batch)
      n_eval = n_batch;
    if (llama_decode(ctx_llama,
                     llama_batch_get_one(&tokens[i], n_eval, *n_past, 0))) {
      return false; // probably ran out of context
    }
    *n_past += n_eval;
  }
  return true;
}


static bool add_token_to_context(struct llama_context *ctx_llama, int id,
                                 int *n_past) {
  std::vector<llama_token> tokens;
  tokens.push_back(id);
  return add_tokens_to_context(ctx_llama, tokens, 1, n_past);
}

static bool add_string_to_context(struct llama_context *ctx_llama,
                                  const char *str, int n_batch, int *n_past,
                                  bool add_bos) {
  std::string str2 = str;
  std::vector<llama_token> embd_inp =
      ::llama_tokenize(ctx_llama, str2, add_bos);
  return add_tokens_to_context(ctx_llama, embd_inp, n_batch, n_past);
}

void _fllama_inference_sync(fllama_inference_request request,
                            fllama_inference_callback callback);

static void log_callback_wrapper(enum ggml_log_level level, const char *text,
                                 void *user_data) {
  std::cout << "[llama] " << text;
}

void fllama_log(const char *message,
                fllama_log_callback dart_logger = nullptr) {
  if (dart_logger != NULL) {
    // If a Dart logger is provided, use it
    dart_logger(message);
  } else {
    // Otherwise, fallback to standard output
    std::cout << message << std::endl;
  }
}

void fllama_log(const std::string &message,
                fllama_log_callback dart_logger = nullptr) {
  fllama_log(message.c_str(), dart_logger);
}

void _fllama_inference_sync(fllama_inference_request request,
                            fllama_inference_callback callback) {
  // Setup parameters, then load the model and create a context.
  int64_t start = ggml_time_ms();
  std::cout << "[fllama] Inference thread start" << std::endl;
  gpt_params params;
  std::cout << "[fllama] Initializing params." << std::endl;
  params.n_ctx = request.context_size;
  std::cout << "[fllama] Context size: " << params.n_ctx << std::endl;
  // >=32 needed for BLAS.
  params.n_batch = 512;
  params.n_predict = request.max_tokens;
  params.n_threads = request.num_threads;
  params.sparams.temp = request.temperature;
  std::cout << "[fllama] Default penalty_freq: " << params.sparams.penalty_freq
            << std::endl;
  std::cout << "[fllama] Default penalty_repeat: "
            << params.sparams.penalty_repeat << std::endl;
  params.sparams.penalty_freq = request.penalty_freq;
  params.sparams.penalty_repeat = request.penalty_repeat;
  std::vector<llama_sampler_type> samplers = {llama_sampler_type::TOP_P,
                                              llama_sampler_type::TEMP};
  params.sparams.samplers_sequence = samplers;
  params.sparams.top_p = request.top_p;
  if (request.grammar != NULL && strlen(request.grammar) > 0) {
    std::cout << "[fllama] Grammar: " << request.grammar << std::endl;
    params.sparams.grammar = std::string(request.grammar);
  }
  params.model = request.model_path;
// Force CPU if iOS simulator: no GPU support available, hangs.
#if TARGET_IPHONE_SIMULATOR
  params.n_gpu_layers = 0;
// Otherwise, for physical iOS devices and other platforms
#else
  params.n_gpu_layers = request.num_gpu_layers;
  fllama_log("Number of GPU layers requested: " +
                 std::to_string(params.n_gpu_layers),
             request.dart_logger);
#endif
  llama_backend_init(params.numa);

  // Check if a Dart logger function is provided, use it if available.
  if (request.dart_logger != NULL) {
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
  fllama_log("Initialized llama logger.", request.dart_logger);
  // !!! Specific to multimodal
  bool prompt_contains_img = prompt_contains_image(request.input);
  bool should_load_clip = false;
  if (prompt_contains_img) {
    fllama_log("Prompt contains images, will process them later.",
               request.dart_logger);
    std::string mmproj =
        request.model_mmproj_path == NULL ? "" : request.model_mmproj_path;
    if (mmproj.empty()) {
      fllama_log(
          "Warning: prompt contains images, but inference request doesn't "
          "specify model_mmproj_path. Multimodal model requires a .mmproj "
          "file.",
          request.dart_logger);
    } else {
      params.mmproj = mmproj;
      should_load_clip = true;
    }
  }
  llama_model *model;
  llama_context *ctx;
  fllama_log("Initializing llama model...", request.dart_logger);
  std::tie(model, ctx) = llama_init_from_gpt_params(params);
  if (model == NULL || ctx == NULL) {
    std::cout << "[fllama] Unable to load model." << std::endl;
    if (model != NULL) {
      llama_free_model(model);
    }
    callback(/* response */ "Error: Unable to load model.", /* done */ true);
    fllama_log("Error: Unable to load model.", request.dart_logger);
    return;
  }

  fllama_log("Initialized model.", request.dart_logger);

  std::string final_request_input = request.input;
  // !!! Specific to multimodal
  std::vector<llava_image_embed *>
      image_embeddings; // Now a vector to hold multiple embeddings
  if (should_load_clip) {
    fllama_log("Loading multimodal model...", request.dart_logger);
    const char *mmproj_path = params.mmproj.c_str();
    auto ctx_clip = clip_model_load(mmproj_path, /*verbosity=*/1);
    std::cout << "Loaded model" << std::endl;
    image_embeddings = llava_image_embed_make_with_prompt_base64(
        ctx_clip, 1 /* or params.n_threads */, final_request_input);
    clip_free(ctx_clip);
  }

  // It is important that this runs regardless of whether CLIP needs to be
  // loaded. For example, for an errorneus request that doesn't provide the CLIP
  // model path. Otherwise, inference has to tokenize the base64 image string,
  // which is not a good idea. (O(100,000K) tokens)
  if (prompt_contains_img) {
    if (image_embeddings.empty()) {
      std::cout << "[fllama] Unable to create image embeddings, removing image "
                   "data from prompt."
                << std::endl;
    } else {
      std::cout << "[fllama] Images loaded, replacing image data in prompt "
                   "with clip output"
                << std::endl;
    }
    final_request_input = remove_all_images_from_prompt(
        request.input); // Updated to remove all images
  }

  int64_t model_load_end = ggml_time_ms();
  int64_t model_load_duration_ms = model_load_end - start;
  fllama_log("Model loaded @ " + std::to_string(model_load_duration_ms) +
                 " ms.",
             request.dart_logger);

  std::vector<llama_token> tokens_list;
  tokens_list = ::llama_tokenize(model, final_request_input, true);
  fllama_log("Input token count: " + std::to_string(tokens_list.size()),
             request.dart_logger);
  fllama_log("Output token count: " + std::to_string(request.max_tokens),
             request.dart_logger);
  const int n_max_tokens = request.max_tokens;
  llama_context_params ctx_params =
      llama_context_params_from_gpt_params(params);
  fllama_log("Number of threads: " + std::to_string(ctx_params.n_threads),
             request.dart_logger);

  // 2. Load the prompt into the context.
  int n_past = 0;
  bool add_bos = llama_should_add_bos_token(model);
  int idx_embedding = 0;
  for (auto *embedding : image_embeddings) {
    if (embedding != NULL) {
      if (image_embeddings.size() > 1) {
        const std::string image_prompt =
            "Attached Image #" + std::to_string(idx_embedding + 1) + ":\n";
        add_string_to_context(ctx, image_prompt.c_str(), params.n_batch,
                              &n_past, add_bos);
        idx_embedding++;
      }
      fllama_log("Adding image #" + std::to_string(idx_embedding + 1) +
                     " to context.",
                 request.dart_logger);
      auto success =
          add_image_embed_to_context(ctx, embedding, params.n_batch, &n_past);
      if (!success) {
        fllama_log(
            "Unable to add image to context. Continuing to run inference "
            "anyway.",
            request.dart_logger);
      }
      llava_image_embed_free(embedding);
      fllama_log("Added image #" + std::to_string(idx_embedding + 1) +
                     " to context.",
                 request.dart_logger);
    }
  }

  fllama_log("Adding input to context...length: " +
                 std::to_string(final_request_input.length()),
             request.dart_logger);
  add_string_to_context(ctx, final_request_input.c_str(), params.n_batch,
                        &n_past, add_bos);
  fllama_log("Added input to context.", request.dart_logger);

  fllama_log("Initializing sampling context...", request.dart_logger);
  struct llama_sampling_context *ctx_sampling =
      llama_sampling_init(params.sparams);
  fllama_log("Sampling context initialized.", request.dart_logger);
  const char *eos_token_chars = fflama_get_eos_token(request.model_path);
  const std::string eos_token_as_string = std::string(eos_token_chars);
  free((void *)eos_token_chars);
  bool has_valid_eos_token = eos_token_as_string.length() > 0;
  const int64_t context_setup_complete = ggml_time_ms();
  fllama_log("Context setup complete & input added to context. Took " +
                 std::to_string(context_setup_complete - start) + " ms.",
             request.dart_logger);

  // 3. Generate tokens.
  // Reserve result string once to avoid an allocation in loop.
  const auto estimated_total_size = n_max_tokens * 10;
  std::string result;
  result.reserve(estimated_total_size);
  char *c_result =
      (char *)malloc(estimated_total_size); // Allocate once with estimated size

  std::string printOutput = llama_sampling_print(params.sparams);
  std::string orderPrintOutput = llama_sampling_order_print(params.sparams);
  const float cfg_scale = params.sparams.cfg_scale;

  int n_gen = 0;
  bool potentially_eos =
      false; // Flag to indicate that we're potentially forming an EOS token
  std::string buffer; // Buffer to accumulate potential EOS token sequences

  const auto model_eos_token = llama_token_eos(model);
  const int64_t start_t = ggml_time_ms();
  int64_t t_last = start_t;
  while (true) {
    const llama_token new_token_id =
        llama_sampling_sample(ctx_sampling, ctx, NULL);
    llama_sampling_accept(ctx_sampling, ctx, new_token_id, true);
    n_gen += 1;
    // Identify EOS token from the model
    bool is_eos_model_token = new_token_id == model_eos_token;

    // Get the token as a string piece
    std::string token_piece = llama_token_to_piece(ctx, new_token_id);
    // fprintf(stderr, "token_piece from llama_sampling_sample: %s\n",
    // token_piece.c_str());

    // Add the current token piece to buffer to check for eos_token
    buffer += token_piece;

    // We need to check for EOS token as a string in the buffer.
    // Some models don't have an EOS token per se, but rather, a string
    // that is the sum of a set of tokens. This is the only way to handle that.
    //
    // However, it opens up another problem: there's models that have an EOS
    // token that llama_token_to_piece() can't convert to a string. This is
    // a problem because it means there will be leftover tokens in the buffer.
    //
    // This is handled at the end of this loop - if is_eos_model_token is true,
    // then we append the buffer to result and break the loop. It is safe to
    // append down there because of the check up here that ensures the buffer
    // does not contain the EOS token.
    size_t eos_pos = buffer.find(eos_token_as_string);
    if (eos_pos != std::string::npos) {
      // If eos_token is found, append content before eos_token to result and
      // end generation
      result += buffer.substr(0, eos_pos);
      buffer.erase(0, eos_pos + eos_token_as_string.length());
      break;
    }
    // If the buffer length exceeds the eos_token length, it means the start of
    // the buffer cannot be part of an eos_token. Move such content to result.
    if (buffer.length() > eos_token_as_string.length()) {
      result +=
          buffer.substr(0, buffer.length() - eos_token_as_string.length());
      buffer.erase(0, buffer.length() - eos_token_as_string.length());
    }

    std::strcpy(c_result, result.c_str());
    // fprintf(stderr, "c_result: %s\n", c_result);
    // fprintf(stderr, "buffer: %s\n", buffer.c_str());
    callback(/* response */ c_result, /* done */ false);

    // If we reach the maximum number of tokens or an eval fails, we should also
    // finish
    if (n_gen >= n_max_tokens) {
      fllama_log("Finish. Max tokens reached (" + std::to_string(n_max_tokens) +
                     ")",
                 request.dart_logger);
      if (buffer.length() > 0) {
        result += buffer;
      }
      break;
    }

    if (!add_token_to_context(ctx, new_token_id, &n_past)) {
      fllama_log("Finish. Eval failed", request.dart_logger);
      fprintf(stderr, "%s: Finish. Eval failed\n", __func__);
      if (buffer.length() > 0) {
        result += buffer;
      }
      break;
    }

    // If greater than a second has passed, log the token creation.
    const auto t_now = ggml_time_ms();
    if (t_now - t_last > 1000) {
      fprintf(stderr,
              "[fllama] generated %d tokens in %.2f s, speed: %.2f t/s\n",
              n_gen, (t_now - start_t) / 1000.0,
              n_gen / ((t_now - start_t) / 1000.0));
      t_last = t_now;
    }

    // Check for EOS on model tokens
    if (is_eos_model_token) {
      fprintf(stderr, "%s: Finish. Model EOS token found. Token is: %s\n",
              __func__, eos_token_as_string.c_str());
      fprintf(stderr, "%s: EOS token length: %zu\n", __func__,
              eos_token_as_string.length());
      if (buffer.length() > 0) {
        result += buffer;
      }
      break;
    }
  }

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

  // Can't free this: the threading behavior is such that the Dart function will
  // get the pointer at some point in the future. Infrequently, 1 / 20 times,
  // this will be _after_ this function returns. In that case, the final output
  // is a bunch of null characters: they look like 6 vertical lines stacked.
  std::strcpy(c_result, result.c_str());
  callback(/* response */ c_result, /* done */ true);
  const auto t_now = ggml_time_ms();

  fllama_log("Generated " + std::to_string(n_gen) + " tokens in " +
                 std::to_string((t_now - start_t) / 1000.0) + " s, speed: " +
                 std::to_string(n_gen / ((t_now - start_t) / 1000.0)) + " t/s.",
             request.dart_logger);

  // Log finished
  const auto t_main_end = ggml_time_ms();
  const auto t_main = t_main_end - context_setup_complete;
  fprintf(stderr, "[fllama] main loop took %f ms\n", t_main);
  LOG_TEE("%s: generated %d tokens in %.2f s, speed: %.2f t/s\n", __func__,
          n_gen, t_main / 1000.0,
          n_gen / ((t_main_end - context_setup_complete) / 1000.0));
  llama_print_timings(ctx);

  // Free everything. Model loading time is negligible, especially when
  // compared to amount of RAM consumed by leaving model in memory
  // (~= size of model on disk)
  std::cout << "[fllama] freeing start @ " << ggml_time_us() << std::endl;
  llama_free_model(model);
  llama_sampling_free(ctx_sampling);
  llama_free(ctx);
  llama_backend_free();
  free(c_result);
  std::cout << "[fllama] freeing and thread end @ " << ggml_time_us()
            << std::endl;
}

class InferenceQueue {
public:
  InferenceQueue()
      : done(false), worker(&InferenceQueue::process_inference, this) {}

  ~InferenceQueue() {
    // Signal termination and cleanup
    {
      std::lock_guard<std::mutex> lock(mutex);
      done = true;
    }
    cond_var.notify_one();
    if (worker.joinable()) {
      worker.join();
    }
  }

  void enqueue(fllama_inference_request request,
               fllama_inference_callback callback) {
    {
      std::lock_guard<std::mutex> lock(mutex);
      tasks.emplace(
          [request, callback]() { _fllama_inference_sync(request, callback); });
    }
    cond_var.notify_one();
  }

private:
  void process_inference() {
    while (true) {
      std::function<void()> task;
      {
        std::unique_lock<std::mutex> lock(mutex);
        cond_var.wait(lock, [this] { return !tasks.empty() || done; });
        if (done && tasks.empty())
          break;
        task = std::move(tasks.front());
        tasks.pop();
      }
      try {
        task();
      } catch (const std::exception &e) {
        std::cout << "[fllama] Exception: " << e.what() << std::endl;
      }
    }
  }

  std::thread worker;
  std::mutex mutex;
  std::condition_variable cond_var;
  std::queue<std::function<void()>> tasks;
  bool done;
};

// Global queue instance
static InferenceQueue global_inference_queue;

FFI_PLUGIN_EXPORT extern "C" void
fllama_inference(fllama_inference_request request,
                 fllama_inference_callback callback) {
  std::cout << "[fllama] Hello from fllama.cpp! Queueing your request."
            << std::endl;
  global_inference_queue.enqueue(request, callback);
}



const char *fflama_get_chat_template(const char *fname) {
  struct ggml_context *meta = NULL;

  struct gguf_init_params params = {
      /*.no_alloc = */ true,
      /*.ctx      = */ &meta,
  };

  struct gguf_context *ctx = gguf_init_from_file(fname, params);
  if (!ctx) {
    fprintf(stderr, "Unable to load model to get chat template: %s\n", fname);
    return ""; // Return NULL to indicate failure to load or find the value.
  }

  const char *result = "";

  const char *targetKey = "tokenizer.chat_template";
  const int keyidx = gguf_find_key(ctx, targetKey);

  if (keyidx >= 0) { // Key found.
    const char *keyValue = gguf_get_val_str(ctx, keyidx);
    if (keyValue) {
      // If keyValue is not null, assign our result to the key value.
      result = keyValue;
    } else {
      // Key was found, but it doesn't have an associated string value, or the
      // value is null.
      printf("%s: key '%s' found, but it has no associated string value or "
             "value is null.\n",
             __func__, targetKey);
      // result already initialized to "", so just leave it as it is.
    }
  } else {
    printf("%s: key '%s' not found.\n", __func__, targetKey);
    // result already initialized to "", so just leave it as it is.
  }

  // Assuming gguf_free(ctx) should be called regardless of the conditional
  // branches above.
  ggml_free(meta);
  gguf_free(ctx);

  return result;
}

static int gguf_data_to_int(enum gguf_type type, const void *data, int i) {
  switch (type) {
  case GGUF_TYPE_UINT8:
    return static_cast<int>(((const uint8_t *)data)[i]);
  case GGUF_TYPE_INT8:
    return static_cast<int>(((const int8_t *)data)[i]);
  case GGUF_TYPE_UINT16:
    return static_cast<int>(((const uint16_t *)data)[i]);
  case GGUF_TYPE_INT16:
    return static_cast<int>(((const int16_t *)data)[i]);
  case GGUF_TYPE_UINT32:
    // Check if the uint32_t value can fit in an int, otherwise return INT_MIN
    {
      uint32_t val = ((const uint32_t *)data)[i];
      return val <= static_cast<uint32_t>(INT_MAX) ? static_cast<int>(val)
                                                   : INT_MIN;
    }
  case GGUF_TYPE_INT32:
    return static_cast<int>(((const int32_t *)data)[i]);
  case GGUF_TYPE_UINT64:
  case GGUF_TYPE_INT64:
    // For both 64-bit integer types, converting directly to int could lead to
    // significant data loss. This logic limits the conversion to IN_MIN if out
    // of the `int` range.
    {
      int64_t val = type == GGUF_TYPE_UINT64
                        ? static_cast<int64_t>(((const uint64_t *)data)[i])
                        : ((const int64_t *)data)[i];
      if (val >= static_cast<int64_t>(INT_MIN) &&
          val <= static_cast<int64_t>(INT_MAX)) {
        return static_cast<int>(val);
      } else {
        return INT_MIN;
      }
    }
  case GGUF_TYPE_FLOAT32:
    // For float, we attempt to cast to int directly, but large values could
    // cause undefined behavior.
    return static_cast<int>(((const float *)data)[i]);
  case GGUF_TYPE_FLOAT64:
    // Similar to float, casting directly from double to int, with potential for
    // large value issues.
    return static_cast<int>(((const double *)data)[i]);
  case GGUF_TYPE_BOOL:
    return ((const bool *)data)[i] ? 1 : 0;
  default:
    return INT_MIN; // Sentinel value indicating "not a number-y type" or
                    // "error"
  }
}

const char *fflama_get_eos_token(const char *fname) {
  struct ggml_context *meta = NULL;

  struct gguf_init_params params = {
      /*.no_alloc = */ true,
      /*.ctx      = */ &meta,
  };

  struct gguf_context *ctx = gguf_init_from_file(fname, params);
  if (!ctx) {
    fprintf(stderr, "Unable to load model: %s\n", fname);
    return NULL; // Return NULL to indicate failure to load or find the value.
  }

  const char *tokens_key = "tokenizer.ggml.tokens";
  const int tokens_idx = gguf_find_key(ctx, tokens_key);
  printf("%s: tokens_idx: %d\n", __func__, tokens_idx);

  if (tokens_idx < 0) {
    printf("%s: key '%s' not found.\n", __func__, tokens_key);
    return ""; // Key not found.
  }

  const char *eos_id_key = "tokenizer.ggml.eos_token_id";
  const int eos_id_idx = gguf_find_key(ctx, eos_id_key);
  if (eos_id_idx < 0) {
    printf("%s: key '%s' not found.\n", __func__, eos_id_key);
    return ""; // Key not found.
  }

  const void *eos_id_val_data = gguf_get_val_data(ctx, eos_id_idx);
  const int eos_id_index =
      gguf_data_to_int(gguf_get_kv_type(ctx, eos_id_idx), eos_id_val_data, 0);
  if (eos_id_index == INT_MIN) {
    printf("%s: eos_id_val is INT_MIN, indicating an error.\n", __func__);
    return ""; // Key not found.
  }

  const uint32_t n_vocab = gguf_get_arr_n(ctx, tokens_idx);
  if (n_vocab <= tokens_idx) {
    printf("%s: tokens key found, but index %d is out of bounds for array of "
           "size %d.\n",
           __func__, eos_id_idx, n_vocab);
  }

  std::string word = gguf_get_arr_str(ctx, tokens_idx, eos_id_index);
  printf("%s: word: %s\n", __func__, word.c_str());
  char *heapWord = new char[word.length() + 1]; // +1 for the null terminator

  // Copy the contents of `word` to the allocated memory.
  std::strcpy(heapWord, word.c_str());

  ggml_free(meta);
  gguf_free(ctx);
  // Return the pointer to the caller. The caller must `delete[]` this memory.
  return heapWord;
}
