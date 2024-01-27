#include "fllama.h"

// LLaMA.cpp cross-platform support
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
// iOS-specific includes
#include "../ios/llama.cpp/common/common.h"
#include "../ios/llama.cpp/common/sampling.h"
#include "../ios/llama.cpp/ggml.h"
#include "../ios/llama.cpp/llama.h"
#elif TARGET_OS_OSX
// macOS-specific includes
#include "../macos/llama.cpp/common/common.h"
#include "../macos/llama.cpp/common/sampling.h"
#include "../macos/llama.cpp/ggml.h"
#include "../macos/llama.cpp/llama.h"
#else
// Other platforms
#include "common/common.h"
#include "ggml.h"
#include "llama.h"
#endif

#include <atomic>
#include <cassert>
#include <cinttypes>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <ctime>
#include <fstream>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
#include <unordered_set>
#include <vector>

#if defined(_MSC_VER)
#pragma warning(disable : 4244 4267) // possible loss of data
#endif

void _fllama_inference_sync(fllama_inference_request request,
                            fllama_inference_callback callback);

FFI_PLUGIN_EXPORT extern "C" void
fllama_inference(fllama_inference_request request,
                 fllama_inference_callback callback) {
  std::cout << "[fllama] Hello from fllama.cpp!" << std::endl;
  // Run on a thread.
  // A non-blocking method ensures that the callback can be on the caller
  // thread. This significantly simplifies the implementation of the caller,
  // particularly in Dart.
  std::thread inference_thread([request, callback]() {
    try {
      _fllama_inference_sync(request, callback);
    } catch (const std::exception &e) {
      std::cout << "[fllama] Exception: " << e.what() << std::endl;
    }
  });
  inference_thread.detach();
}

FFI_PLUGIN_EXPORT extern "C" void fllama_tokenize(struct fllama_tokenize_request request, fllama_tokenize_callback callback) {
  gpt_params params;
  params.n_ctx = 0;
  params.n_batch = 0;
  params.n_predict = 0;
  params.sparams.temp = 0;
  params.sparams.samplers_sequence = "pt";
  params.sparams.top_p = 0;
  params.model = request.model_path;
  params.n_gpu_layers = 0;
  llama_backend_init(params.numa);
  llama_model *model;
  llama_context *ctx;
  std::tie(model, ctx) = llama_init_from_gpt_params(params);
  if (model == NULL || ctx == NULL) {
    std::cout << "[fllama] Unable to load model." << std::endl;
    if (model != NULL) {
      llama_free_model(model);
    }
    throw std::runtime_error("[fllama] Unable to load model.");
  }
  std::vector<llama_token> tokens_list;
  tokens_list = ::llama_tokenize(model, request.input, true);
  std::cout << "[fllama] Input token count: " << tokens_list.size()
            << std::endl;
  callback(tokens_list.size());
}

void _fllama_inference_sync(fllama_inference_request request,
                            fllama_inference_callback callback) {
  std::cout << "[fllama] Inference thread started." << std::endl;
  gpt_params params;
  std::cout << "[fllama] Initializing params." << std::endl;
  params.n_ctx = request.context_size;
  std::cout << "[fllama] Context size: " << params.n_ctx << std::endl;
  // Very unclear what this means, but, if its < the total number of tokens,
  // llama.cpp assertion fails. (n_tokens <= n_batch)
  params.n_batch = request.context_size;
  std::cout << "[fllama] Batch size: " << params.n_batch << std::endl;
  params.n_predict = request.max_tokens;
  std::cout << "[fllama] Max tokens: " << params.n_predict << std::endl;
  params.sparams.temp = request.temperature;
  std::cout << "[fllama] Temperature: " << params.sparams.temp << std::endl;
  params.sparams.samplers_sequence = "pt";
  params.sparams.top_p = request.top_p;
  std::cout << "[fllama] Top P: " << params.sparams.top_p << std::endl;
  params.model = request.model_path;
  std::cout << "[fllama] Model path: " << params.model << std::endl;
// Force CPU if iOS simulator: no GPU support available, hangs.
#if TARGET_IPHONE_SIMULATOR
  params.n_gpu_layers = 0;
// Otherwise, for physical iOS devices and other platforms
#else
  params.n_gpu_layers = request.num_gpu_layers;
#endif
  llama_backend_init(params.numa);
  llama_model *model;
  llama_context *ctx;
  std::tie(model, ctx) = llama_init_from_gpt_params(params);
  if (model == NULL || ctx == NULL) {
    std::cout << "[fllama] Unable to load model." << std::endl;
    if (model != NULL) {
      llama_free_model(model);
    }
      callback(/* response */ "Error: Unable to load model.", /* done */ true);
    throw std::runtime_error("[fllama] Unable to load model.");
  }

  std::vector<llama_token> tokens_list;
  tokens_list = ::llama_tokenize(model, request.input, true);
  std::cout << "[fllama] Input token count: " << tokens_list.size()
            << std::endl;
  std::cout << "[fllama] Output tokens requested: " << params.n_predict
            << std::endl;
  const int n_max_tokens = request.max_tokens;
  llama_context_params ctx_params =
      llama_context_params_from_gpt_params(params);
  std::cout << "Number of threads: " << ctx_params.n_threads << std::endl;

  llama_batch batch = llama_batch_init(tokens_list.size() + n_max_tokens, 0, 1);
  // evaluate the initial prompt
  for (size_t i = 0; i < tokens_list.size(); i++) {
    llama_batch_add(batch, tokens_list[i], i, {0}, false);
  }
  // llama_decode will output logits only for the last token of the prompt
  batch.logits[batch.n_tokens - 1] = true;
  if (llama_decode(ctx, batch) != 0) {
    LOG_TEE("%s: llama_decode() failed\n", __func__);
    // throw runtime error
    callback(/* response */ "Error: decoding failed.", /* done */ true);
    throw std::runtime_error("[fllama] llama_decode() failed");
  }

  // main loop
  int n_cur = batch.n_tokens;
  int n_gen = 0;
  int n_decode = 0;

  const auto t_main_start = ggml_time_us();

  // Reserve result string once to avoid an allocation in loop.
  const auto estimated_total_size = n_max_tokens * 10;
  std::string result;
  result.reserve(estimated_total_size);
  char *c_result =
      (char *)malloc(estimated_total_size); // Allocate once with estimated size
  while (n_gen <= n_max_tokens) {
    {
      auto n_vocab = llama_n_vocab(model);
      auto *logits = llama_get_logits_ith(ctx, batch.n_tokens - 1);

      std::vector<llama_token_data> candidates;
      candidates.reserve(n_vocab);

      for (llama_token token_id = 0; token_id < n_vocab; token_id++) {
        candidates.emplace_back(
            llama_token_data{token_id, logits[token_id], 0.0f});
      }
      llama_token_data_array candidates_p = {candidates.data(),
                                             candidates.size(), false};
      // Why if?
      // - Observed get repeated [PAD] output from stable lm Zephyr 3B at 0
      // temp.
      // - Observed infinitesimally larger than 0 gets same output as when
      // llama_sample_temp is commented out.
      // - llama_sample_temp implementation indicates silent divide by 0 when
      // temp == 0.
      if (params.sparams.temp > 0.0f) {
        llama_sample_temp(ctx, &candidates_p, params.sparams.temp);
      }
      // Only bother with top_p if it's not 1.0f (consider all tokens)
      // > 0 condition added out of caution, not tested.
      if (params.sparams.top_p < 1.0f && params.sparams.top_p > 0.0f) {
        llama_sample_top_p(ctx, &candidates_p, params.sparams.top_p,
                           1 /* min_keep */);
      }
      const llama_token new_token_id = llama_sample_token(ctx, &candidates_p);

      // is it an end of stream?
      if (new_token_id == llama_token_eos(model)) {
        fprintf(stderr, "%s: Finish. EOS token found\n", __func__);
        break;
      }
      result += llama_token_to_piece(ctx, new_token_id);

      std::strcpy(c_result, result.c_str());
      callback(c_result, false);

      // prepare the next batch
      llama_batch_clear(batch);

      // push this new token for next evaluation
      llama_batch_add(batch, new_token_id, n_cur, {0}, true);

      n_decode += 1;
      n_gen += 1;

      if (n_gen == n_max_tokens) {
        fprintf(stderr, "%s: Finish. Max tokens reached\n", __func__);
        break;
      }
    }

    n_cur += 1;

    // evaluate the current batch with the transformer model
    if (llama_decode(ctx, batch)) {
      fprintf(stderr, "%s : failed to eval, return code %d\n", __func__, 1);
      std::strcpy(c_result, result.c_str());
      callback(/* response */ c_result, /* done */ true);
      throw std::runtime_error("Inference failed");
    }
  }

  // Can't free this: the threading behavior is such that the Dart function will
  // get the pointer at some point in the future. Infrequently, 1 / 20 times,
  // this will be _after_ this function returns. In that case, the final output
  // is a bunch of null characters: they look like 6 vertical lines stacked.
  std::strcpy(c_result, result.c_str());
  callback(/* response */ c_result, /* done */ true);

  // Log finished
  const auto t_main_end = ggml_time_us();
  const auto t_main = t_main_end - t_main_start;
  fprintf(stderr, "main loop: %f ms\n", t_main / 1000.0f);
  LOG_TEE("%s: decoded %d tokens in %.2f s, speed: %.2f t/s\n", __func__,
          n_decode, (t_main_end - t_main_start) / 1000000.0f,
          n_decode / ((t_main_end - t_main_start) / 1000000.0f));
  llama_print_timings(ctx);

  // Free everything. Model loading time is negligible, especially when
  // compared to amount of RAM consumed by leaving model in memory
  // (~= size of model on disk)
  llama_batch_free(batch);
  llama_free_model(model);
  llama_free(ctx);
  llama_backend_free();
}
