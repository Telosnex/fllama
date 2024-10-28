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
#include "base64.hpp"
#include "common.h"
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
                                  std::vector<llama_token> tokens, int n_batch,
                                  int *n_past) {
  int N = (int)tokens.size();
  for (int i = 0; i < N; i += n_batch) {
    int n_eval = (int)tokens.size() - i;
    if (n_eval > n_batch)
      n_eval = n_batch;
    // DEBUG:
    // int token = tokens[i];
    // std::cout << "[fllama] Adding token to context: " << token << std::endl;
    if (llama_decode(ctx_llama,
                     llama_batch_get_one(&tokens[i], n_eval, *n_past, 0))) {
      return false; // probably ran out of context
    }
    *n_past += n_eval;
    std::cout << "[fllama] Added " << n_eval << " tokens to context."
              << std::endl;
  }
  return true;
}
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

EMSCRIPTEN_KEEPALIVE void
fllama_inference_sync(fllama_inference_request request,
                      fllama_inference_callback callback) {
  // Setup parameters, then load the model and create a context.
  int64_t start = ggml_time_ms();
  std::cout << "[fllama] Inference thread start" << std::endl;
  try {
    gpt_params params;
    std::cout << "[fllama] Initializing params." << std::endl;
    params.n_ctx = request.context_size;
    std::cout << "[fllama] Context size: " << params.n_ctx << std::endl;
    // >=32 needed for BLAS.
    params.n_batch = 512;
    params.flash_attn = false;
    std::cout << "[fllama] flash_attn: " << params.flash_attn << std::endl;

    params.n_predict = request.max_tokens;
    // std::cout << "[fllama] Max tokens: " << params.n_predict << std::endl;
    params.n_threads = request.num_threads;
    // std::cout << "[fllama] Number of threads: " << params.n_threads <<
    // std::endl;
    params.sparams.temp = request.temperature;
    std::cout << "[fllama] Default penalty_freq: "
              << params.sparams.penalty_freq << std::endl;
    std::cout << "[fllama] Default penalty_repeat: "
              << params.sparams.penalty_repeat << std::endl;
    params.sparams.penalty_freq = request.penalty_freq;
    std::cout << "[fllama] Penalty_freq: " << params.sparams.penalty_freq
              << std::endl;
    params.sparams.penalty_repeat = request.penalty_repeat;
    std::cout << "[fllama] Penalty_repeat: " << params.sparams.penalty_repeat
              << std::endl;
    std::vector<llama_sampler_type> samplers = {
        llama_sampler_type::TOP_P, llama_sampler_type::TEMPERATURE};
    params.sparams.samplers_sequence = samplers;
    params.sparams.top_p = request.top_p;
    // std::cout << "[fllama] Top_p: " << params.sparams.top_p << std::endl;
    if (request.grammar != NULL && strlen(request.grammar) > 0) {
      std::cout << "[fllama] Grammar: " << request.grammar << std::endl;
      params.sparams.grammar = std::string(request.grammar);
    }
    params.model = request.model_path;
    // std::cout << "[fllama] Model path: " << params.model << std::endl;
// Force CPU if iOS simulator: no GPU support available, hangs.
#if TARGET_IPHONE_SIMULATOR
    params.n_gpu_layers = 0;
// Otherwise, for physical iOS devices and other platforms
#else
    params.n_gpu_layers = request.num_gpu_layers;
    // fllama_log("[fllama] Number of GPU layers requested: " +
    //  std::to_string(params.n_gpu_layers),
    //  request.dart_logger);
#endif
    std::cout << "[fllama] Number of GPU layers requested: "
              << params.n_gpu_layers << std::endl;
    llama_backend_init();
    std::cout << "[fllama] Backend initialized." << std::endl;

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
    log_set_target(stdout);
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

    llama_model *model = nullptr;
    llama_context *ctx = nullptr;
    struct llama_sampling_context *ctx_sampling = nullptr;
    std::vector<llava_image_embed *> image_embeddings;
    char *c_result = nullptr;

    auto cleanup = [&]() {
      if (model)
        llama_free_model(model);
      if (ctx_sampling)
        llama_sampling_free(ctx_sampling);
      if (ctx)
        llama_free(ctx);
      llama_backend_free();
      free(c_result);
    };

    fllama_log("Initializing llama model...", request.dart_logger);
    llama_init_result init_result = llama_init_from_gpt_params(params);
    model = init_result.model;
    ctx = init_result.context;
    if (model == NULL || ctx == NULL) {
      std::cout << "[fllama] Unable to load model." << std::endl;
      if (model != NULL) {
        llama_free_model(model);
      }
      callback(/* response */ "Error: Unable to load model.", /* done */ true);
      fllama_log("Error: Unable to load model.", request.dart_logger);
      cleanup();
      return;
    }

    fllama_log("Initialized model.", request.dart_logger);

    std::string final_request_input = request.input;
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

    // // DEBUG: Print the input line by line, numbered:
    // std::istringstream iss(final_request_input);
    // std::string line;
    // int line_number = 1;

    // while (std::getline(iss, line)) {
    //   fllama_log("Line " + std::to_string(line_number) + ": " + line,
    //              request.dart_logger);
    //   line_number++;
    // }

    fllama_log("Adding input to context...length: " +
                   std::to_string(final_request_input.length()),
               request.dart_logger);
    fllama_log("Context size: " + std::to_string(params.n_ctx),
               request.dart_logger);
    fllama_log("Input tokens: " + std::to_string(tokens_list.size()),
               request.dart_logger);
    add_tokens_to_context(ctx, tokens_list, params.n_batch, &n_past);
    fllama_log("Added input to context.", request.dart_logger);

    fllama_log("Initializing sampling context...", request.dart_logger);
    ctx_sampling = llama_sampling_init(params.sparams);
    fllama_log("Sampling context initialized.", request.dart_logger);
    const char *eos_token_chars =
        request.eos_token != NULL ? request.eos_token
                                  : fllama_get_eos_token(request.model_path);
    const std::string eos_token_as_string = std::string(eos_token_chars);
    free((void *)eos_token_chars);
    const int64_t context_setup_complete = ggml_time_ms();
    fllama_log("Context setup complete & input added to context. Took " +
                   std::to_string(context_setup_complete - start) + " ms.",
               request.dart_logger);

    // 3. Generate tokens.
    // Check for cancellation before starting the generation loop
    int request_id = request.request_id;

    if (global_inference_queue.is_cancelled(request_id)) {
      fllama_log("Cancelled before starting generation loop. ID:" +
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

    std::string printOutput = llama_sampling_print(params.sparams);
    std::string orderPrintOutput = llama_sampling_order_print(params.sparams);

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
    while (true) {
      // auto sample_start = std::chrono::high_resolution_clock::now();
      const llama_token new_token_id =
          llama_sampling_sample(ctx_sampling, ctx, NULL);
      llama_sampling_accept(ctx_sampling, ctx, new_token_id, true);
      // auto sample_end = std::chrono::high_resolution_clock::now();
      // // Calculate duration
      // std::chrono::duration<double, std::milli> sample_duration =
      //     sample_end - sample_start;
      // Log the duration
      // fllama_log("Sample took " + std::to_string(sample_duration.count()) +
      //                " milliseconds.",
      //            request.dart_logger);
      n_gen += 1;
      // Identify EOS token from the model
      bool is_eos_model_token = llama_token_is_eog(model, new_token_id);

      // Get the token as a string piece
      std::string token_piece = llama_token_to_piece(ctx, new_token_id, false);
      fprintf(stderr,
              "token_piece from llama_sampling_sample: %s\n. Token ID: %d\n",
              token_piece.c_str(), new_token_id);

      // Add the current token piece to buffer to check for eos_token
      buffer += token_piece;

      // We need to check for EOS token as a string in the buffer.
      // Some models don't have an EOS token per se, but rather, a string
      // that is the sum of a set of tokens. This is the only way to handle
      // that.
      //
      // However, it opens up another problem: there's models that have an EOS
      // token that llama_token_to_piece() can't convert to a string. This is
      // a problem because it means there will be leftover tokens in the buffer.
      //
      // This is handled at the end of this loop - if is_eos_model_token is
      // true, then we append the buffer to result and break the loop. It is
      // safe to append down there because of the check up here that ensures the
      // buffer does not contain the EOS token.
      bool eos_found = false;
      for (const auto &eos_token : eos_tokens) {
        size_t eos_pos = buffer.find(eos_token);
        if (eos_pos != std::string::npos) {
          // If eos_token is found, append content before eos_token to result
          // and end generation
          fllama_log("Encountered EOS token: " + eos_token +
                         ". Ending generation.",
                     request.dart_logger);
          result += buffer.substr(0, eos_pos);
          buffer.erase(0, eos_pos + eos_token.length());
          eos_found = true;
          break;
        }
      }
      if (eos_found) {
        break;
      }
      // If the buffer length exceeds the eos_token length, it means the start
      // of the buffer cannot be part of an eos_token. Move such content to
      // result.
      if (buffer.length() > eos_token_as_string.length()) {
        result +=
            buffer.substr(0, buffer.length() - eos_token_as_string.length());
        buffer.erase(0, buffer.length() - eos_token_as_string.length());
      }
#if defined(__EMSCRIPTEN__)
      emscripten_sleep(1);
#endif
      if (global_inference_queue.is_cancelled(request_id)) {
        fllama_log("Cancelled during generation loop. ID:" +
                       std::to_string(request_id),
                   request.dart_logger);
        break; // Exit the generation loop if cancelled. Callback will be
               // called.
      }

      std::strcpy(c_result, result.c_str());
      if (callback != NULL) {
        callback(/* response */ c_result, /* done */ false);
      } else {
        fllama_log("WARNING: callback is NULL. Output: " + result,
                   request.dart_logger);
      }
      // If we reach the maximum number of tokens or an eval fails, finish.
      if (n_gen >= n_max_tokens) {
        fllama_log("Finish. Max tokens reached (" +
                       std::to_string(n_max_tokens) + ")",
                   request.dart_logger);
        if (buffer.length() > 0) {
          result += buffer;
        }
        break;
      }

      // auto add_to_context_start = std::chrono::high_resolution_clock::now();
      if (!add_token_to_context(ctx, new_token_id, &n_past)) {
        fllama_log("Finish. Eval failed", request.dart_logger);
        fprintf(stderr, "%s: Finish. Eval failed\n", __func__);
        if (buffer.length() > 0) {
          result += buffer;
        }
        break;
      }
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
      callback(/* response */ c_result, /* done */ true);
    } else {
      fllama_log("WARNING: callback is NULL. Output: " + result,
                 request.dart_logger);
    }

    const auto t_now = ggml_time_ms();

    fllama_log("Generated " + std::to_string(n_gen) + " tokens in " +
                   std::to_string((t_now - start_t) / 1000.0) + " s, speed: " +
                   std::to_string(n_gen / ((t_now - start_t) / 1000.0)) +
                   " t/s.",
               request.dart_logger);

    // Log finished
    const auto t_main_end = ggml_time_ms();
    const auto t_main = t_main_end - context_setup_complete;
    LOG_TEE("%s: generated %d tokens in %.2f s, speed: %.2f t/s\n", __func__,
            n_gen, t_main / 1000.0,
            n_gen / ((t_main_end - context_setup_complete) / 1000.0));
    llama_print_timings(ctx);

    // Free everything. Model loading time is negligible, especially when
    // compared to amount of RAM consumed by leaving model in memory
    // (~= size of model on disk)
    std::cout << "[fllama] freeing start @ " << ggml_time_us() << std::endl;
    cleanup();
    std::cout << "[fllama] freeing and thread end @ " << ggml_time_us()
              << std::endl;
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
