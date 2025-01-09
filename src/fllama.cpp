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
#include "../ios/llama.cpp/common/common.h"
#include "../ios/llama.cpp/common/sampling.h"
#include "../ios/llama.cpp/ggml/include/ggml.h"
#include "../ios/llama.cpp/include/llama.h"

#elif TARGET_OS_OSX
// macOS-specific includes
#include "../macos/llama.cpp/common/base64.hpp"
#include "../macos/llama.cpp/common/common.h"
#include "../macos/llama.cpp/common/sampling.h"
#include "../macos/llama.cpp/ggml/include/ggml.h"
#include "../macos/llama.cpp/include/llama.h"
#else
// Other platforms
#include "llama.cpp/common/base64.hpp"
#include "llama.cpp/common/common.h"
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
#include "ggml-backend.h"
#include "llama.cpp/src/llama-sampling.h"

// Forward declare logging functions
static void log_message(const char *message, fllama_log_callback dart_logger = nullptr);
static void log_message(const std::string &message, fllama_log_callback dart_logger = nullptr);

// Implement logging functions
static void log_message(const char *message, fllama_log_callback dart_logger) {
    if (dart_logger == nullptr) {
        fprintf(stderr, "%s\n", message);
    } else {
        dart_logger(message);
    }
}

static void log_message(const std::string &message, fllama_log_callback dart_logger) {
    log_message(message.c_str(), dart_logger);
}

static InferenceQueue global_inference_queue;

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

static bool add_tokens_to_context(struct llama_context *ctx_llama,
                                  const std::vector<llama_token>& tokens, int n_batch,
                                  int *n_past, fllama_log_callback logger) {
    log_message("[DEBUG] add_tokens_to_context start", logger);
    const int N = (int)tokens.size();
    log_message("[DEBUG] token count: " + std::to_string(N), logger);
    if (N == 0) return true;

    // Keep tokens data alive until we're done with the batch
    std::vector<llama_token> tokens_data = tokens;
    log_message("[DEBUG] about to call llama_batch_get_one", logger);
    llama_batch batch = llama_batch_get_one(tokens_data.data(), tokens_data.size());
    log_message("[DEBUG] got batch with " + std::to_string(batch.n_tokens) + " tokens", logger);
    
    // Check context space
    int n_ctx = llama_n_ctx(ctx_llama);
    int n_ctx_used = llama_get_kv_cache_used_cells(ctx_llama);
    log_message("[DEBUG] ctx space: used=" + std::to_string(n_ctx_used) + ", total=" + std::to_string(n_ctx), logger);
    
    if (n_ctx_used + batch.n_tokens > n_ctx) {
        log_message("context size exceeded", logger);
        return false;
    }
    
    log_message("[DEBUG] about to decode batch", logger);
    if (llama_decode(ctx_llama, batch)) {
        log_message("failed to decode", logger);
        return false;
    }
    log_message("[DEBUG] decode successful", logger);
    
    // Update past token count
    *n_past = llama_get_kv_cache_used_cells(ctx_llama);
    log_message("[DEBUG] updated n_past to " + std::to_string(*n_past), logger);
    return true;
}

static bool add_token_to_context(struct llama_context *ctx_llama,
                                 llama_token id, int *n_past, fllama_log_callback logger) {
    log_message("[DEBUG] adding token " + std::to_string(id) + " to context", logger);
    log_message("[DEBUG] add_token_to_context start, token id: " + std::to_string(id), logger);
    
    // Check context space first
    int n_ctx = llama_n_ctx(ctx_llama);
    int n_ctx_used = llama_get_kv_cache_used_cells(ctx_llama);
    log_message("[DEBUG] ctx space: used=" + std::to_string(n_ctx_used) + ", total=" + std::to_string(n_ctx), logger);
    
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
    *n_past = llama_get_kv_cache_used_cells(ctx_llama);
    log_message("[DEBUG] add_token_to_context complete, n_past: " + std::to_string(*n_past), logger);
    return true;
}

static bool add_string_to_context(struct llama_context *ctx_llama,
                                  const char *str, int n_batch, int *n_past,
                                  bool add_bos, fllama_log_callback logger) {
  std::string str2 = str;
  const int n_prompt_tokens = -llama_tokenize(
      llama_get_model(ctx_llama), str2.c_str(), str2.length(), NULL, 0, add_bos, true);
  std::vector<llama_token> embd_inp(n_prompt_tokens);
  if (llama_tokenize(llama_get_model(ctx_llama), str2.c_str(), str2.length(), embd_inp.data(),
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
    uint32_t n_batch = 512;
    ctx_params.n_batch = n_batch;
    std::cout << "[fllama] Batch size: " << ctx_params.n_batch << std::endl;
    ctx_params.flash_attn = false;
    std::cout << "[fllama] flash_attn: " << ctx_params.flash_attn << std::endl;

    // TODO: params.n_predict = request.max_tokens;
    // std::cout << "[fllama] Max tokens: " << params.n_predict << std::endl;
    // TODO: params.n_threads = request.num_threads;
    // std::cout << "[fllama] Number of threads: " << params.n_threads <<
    // std::endl;
    llama_sampler *smpl =
        llama_sampler_chain_init(llama_sampler_chain_default_params());
    llama_sampler_chain_add(
        smpl, llama_sampler_init_min_p((1.0f - request.top_p), 1));
    llama_sampler_chain_add(smpl, llama_sampler_init_temp(request.temperature));
    llama_sampler_chain_add(smpl, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));

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
        // TODO: End of multimodal? :|
        // params.mmproj = mmproj;
        // should_load_clip = true;
      }
    }

    llama_model *model = nullptr;
    llama_context *ctx = nullptr;
    std::vector<llava_image_embed *> image_embeddings;
    char *c_result = nullptr;

    auto cleanup = [&]() {
      if (model)
        llama_model_free(model);
      if (smpl)
        llama_sampler_free(smpl);
      if (ctx)
        llama_free(ctx);
      llama_backend_free();
      free(c_result);
    };

    log_message("Initializing llama model...", request.dart_logger);
    model = llama_model_load_from_file(request.model_path, model_params);
    ctx = llama_new_context_with_model(model, ctx_params);
    if (model == NULL || ctx == NULL) {
      std::cout << "[fllama] Unable to load model." << std::endl;
      if (model != NULL) {
        llama_model_free(model);
      }
      callback(/* response */ "Error: Unable to load model.", /* done */ true);
      log_message("Error: Unable to load model.", request.dart_logger);
      cleanup();
      return;
    }

    log_message("Initialized model.", request.dart_logger);

    std::string final_request_input = request.input;
    // TODO: CLIP support
    // if (should_load_clip) {
    //   fllama_log("Loading multimodal model...", request.dart_logger);
    //   const char *mmproj_path = params.mmproj.c_str();
    //   auto ctx_clip = clip_model_load(mmproj_path, /*verbosity=*/1);
    //   std::cout << "Loaded model" << std::endl;
    //   image_embeddings = llava_image_embed_make_with_prompt_base64(
    //       ctx_clip, 1 /* or params.n_threads */, final_request_input);
    //   clip_free(ctx_clip);
    // }

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
      final_request_input = remove_all_images_from_prompt(request.input, "");
    }

    int64_t model_load_end = ggml_time_ms();
    int64_t model_load_duration_ms = model_load_end - start;
    log_message("Model loaded @ " + std::to_string(model_load_duration_ms) +
                   " ms.",
               request.dart_logger);

    // Tokenize the prompt
    const int n_ctx = llama_n_ctx(ctx);
    const int n_prompt_tokens =
        -llama_tokenize(model, final_request_input.c_str(),
                        final_request_input.length(), NULL, 0, true, true);
    std::vector<llama_token> tokens_list(n_prompt_tokens);
    if (llama_tokenize(model, final_request_input.c_str(),
                       final_request_input.length(), tokens_list.data(),
                       tokens_list.size(), true, true) < 0) {
      fprintf(stderr, "%s: tokenization failed\n", __func__);
      callback("Error: Unable to tokenize input", true);
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
    bool add_bos = llama_add_bos_token(model);
    int idx_embedding = 0;
    for (auto *embedding : image_embeddings) {
      if (embedding != NULL) {
        if (image_embeddings.size() > 1) {
          const std::string image_prompt =
              "Attached Image #" + std::to_string(idx_embedding + 1) + ":\n";
          add_string_to_context(ctx, image_prompt.c_str(), n_batch, &n_past,
                                add_bos, request.dart_logger);
          idx_embedding++;
        }
        log_message("Adding image #" + std::to_string(idx_embedding + 1) +
                       " to context.",
                   request.dart_logger);
        auto success =
            add_image_embed_to_context(ctx, embedding, n_batch, &n_past);
        if (!success) {
          log_message(
              "Unable to add image to context. Continuing to run inference "
              "anyway.",
              request.dart_logger);
        }
        llava_image_embed_free(embedding);
        log_message("Added image #" + std::to_string(idx_embedding + 1) +
                       " to context.",
                   request.dart_logger);
      }
    }

    // // DEBUG: Print the input line by line, numbered:
    // std::istringstream iss(final_request_input);
    // std::string line;
    // int line_number = 1;

    // while (std::getline(iss, line)) {
    //   fllama_log("Line " + std::to_string(line_number) + ": " + line,
    //              request.dart_logger);
    //   line_number++;
    // }

    log_message("Adding input to context...length: " +
                   std::to_string(final_request_input.length()),
               request.dart_logger);
    log_message("Context size: " + std::to_string(n_ctx), request.dart_logger);
    log_message("Input tokens: " + std::to_string(tokens_list.size()),
               request.dart_logger);
    add_tokens_to_context(ctx, tokens_list, n_batch, &n_past, request.dart_logger);
    log_message("Added input to context.", request.dart_logger);
    
    log_message("Initializing sampling context...", request.dart_logger);
    // Using smpl instead of ctx_sampling
    log_message("Sampling context initialized.", request.dart_logger);
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
      callback("", true);
      cleanup();
      return;
    }
    // Reserve result string once to avoid an allocation in loop.
    const auto estimated_total_size = n_max_tokens * 10;
    std::string result;
    result.reserve(estimated_total_size);
    c_result = (char *)malloc(
        estimated_total_size); // Allocate once with estimated size

    // TODO: re-implement sampling print
    // TODO: re-implement sampling order print

    int n_gen = 0;
    std::string buffer; // Buffer to accumulate potential EOS token sequences

    const auto model_eos_token = llama_token_eos(model);
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
    llama_token new_token_id = llama_sampler_sample(smpl, ctx, -1);
    llama_batch batch = llama_batch_get_one(&new_token_id, 1);
    
    while (true) {
        // Check context space
        int n_ctx = llama_n_ctx(ctx);
        int n_ctx_used = llama_get_kv_cache_used_cells(ctx);
        if (n_ctx_used + batch.n_tokens > n_ctx) {
            log_message("[DEBUG] context size exceeded", request.dart_logger);
            break;
        }
    
        // Convert current token to text and output it
        char token_text[256];
        int token_len = llama_token_to_piece(model, new_token_id, token_text, sizeof(token_text), 0, true);
        if (token_len < 0) {
            log_message("[DEBUG] failed to convert token to text", request.dart_logger);
            break;
        }
        
        // Add to result and send partial update
        std::string piece(token_text, token_len);
        result += piece;
        n_gen++;
        if (callback != NULL) {
            std::strcpy(c_result, result.c_str());
            callback(c_result, false);
        }
    
        // Process current batch
        if (llama_decode(ctx, batch)) {
            log_message("[DEBUG] decode failed", request.dart_logger);
            break;
        }
        // Sample next token
        new_token_id = llama_sampler_sample(smpl, ctx, -1);
    
        // Check for end conditions
        if (llama_token_is_eog(model, new_token_id)) {
            log_message("[DEBUG] end of generation detected", request.dart_logger);
            break;
        }
        if (n_gen >= n_max_tokens) {
            log_message("[DEBUG] reached max tokens: " + std::to_string(n_max_tokens), request.dart_logger);
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
      if (llama_token_is_eog(model, new_token_id)) {
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
      callback(/* response */ c_result, /* done */ true);
      log_message("[DEBUG] Final callback invoked", request.dart_logger);
    } else {
      log_message("WARNING: callback is NULL. Output: " + result,
                 request.dart_logger);
    }

    log_message("About to write speed of generation", request.dart_logger);

    const auto t_now = ggml_time_ms();

    const auto speed_string =
        "Generated " + std::to_string(n_gen) + " tokens in " +
        std::to_string((t_now - start_t) / 1000.0) + " s, speed: " +
        std::to_string(n_gen / ((t_now - start_t) / 1000.0)) + " t/s.";

    log_message(speed_string, request.dart_logger);

    log_message("Wrote speed of generation.", request.dart_logger);
    // Free everything. Model loading time is negligible, especially when
    // compared to amount of RAM consumed by leaving model in memory
    // (~= size of model on disk)
    log_message("Freeing resources...", request.dart_logger);
    cleanup();
    log_message("Freed resources.", request.dart_logger);
  } catch (const std::exception &e) {
    std::string error_msg = "Unhandled error: " + std::string(e.what());
    if (callback != NULL) {
      callback(error_msg.c_str(), true);
    }
    std::cerr << error_msg << std::endl;
  } catch (...) {
    std::string error_msg = "Unknown unhandled error occurred";
    if (callback != NULL) {
      callback(error_msg.c_str(), true);
    }
    std::cerr << error_msg << std::endl;
  }
}

} // extern "C"