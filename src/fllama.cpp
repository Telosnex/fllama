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

static bool eval_tokens(struct llama_context *ctx_llama,
                        std::vector<llama_token> tokens, int n_batch,
                        int *n_past) {
  int N = (int)tokens.size();
  for (int i = 0; i < N; i += n_batch) {
    fprintf(stderr, "%s: eval_tokens %d/%d\n", __func__, i, N);
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

static bool eval_id(struct llama_context *ctx_llama, int id, int *n_past) {
  std::vector<llama_token> tokens;
  tokens.push_back(id);
  return eval_tokens(ctx_llama, tokens, 1, n_past);
}

static bool eval_string(struct llama_context *ctx_llama, const char *str,
                        int n_batch, int *n_past, bool add_bos) {
  std::string str2 = str;
  std::vector<llama_token> embd_inp =
      ::llama_tokenize(ctx_llama, str2, add_bos);
  fprintf(stderr, "%s: eval_string: %s\n", __func__, str);
  return eval_tokens(ctx_llama, embd_inp, n_batch, n_past);
}

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

FFI_PLUGIN_EXPORT extern "C" void
fllama_tokenize(struct fllama_tokenize_request request,
                fllama_tokenize_callback callback) {
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
  // 1. Setup parameters, then load the model and create a context.
  std::cout << "[fllama] Inference thread started." << std::endl;
  gpt_params params;
  std::cout << "[fllama] Initializing params." << std::endl;
  params.n_ctx = request.context_size;
  std::cout << "[fllama] Context size: " << params.n_ctx << std::endl;
  params.n_batch = request.context_size;
  params.n_predict = request.max_tokens;
  params.sparams.temp = request.temperature;
  params.sparams.samplers_sequence = "pt";
  params.sparams.top_p = request.top_p;
  params.model = request.model_path;
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
  std::cout << "[fllama] Number of threads: " << ctx_params.n_threads
            << std::endl;

  // 2. Load the prompt into the context.
  int n_past = 0;
  bool add_bos = llama_should_add_bos_token(model);
  eval_string(ctx, request.input, params.n_batch, &n_past, add_bos);

  struct llama_sampling_context *ctx_sampling =
      llama_sampling_init(params.sparams);

  const auto t_main_start = ggml_time_us();

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
  fprintf(stderr, "%s\n", printOutput.c_str());
  fprintf(stderr, "cfg_scale: %f\n", cfg_scale);
  fprintf(stderr, "%s\n", orderPrintOutput.c_str());

  int n_gen = 0;
  while (true) {

    const llama_token new_token_id =
        llama_sampling_sample(ctx_sampling, ctx, NULL);
    llama_sampling_accept(ctx_sampling, ctx, new_token_id, true);

    // is it an end of stream?
    if (new_token_id == llama_token_eos(model)) {
      fprintf(stderr, "%s: Finish. EOS token found\n", __func__);
      break;
    }
    result += llama_token_to_piece(ctx, new_token_id);
    std::strcpy(c_result, result.c_str());
    callback(c_result, false);
    n_gen += 1;
    if (n_gen >= n_max_tokens) {
      fprintf(stderr, "%s: Finish. Max tokens reached\n", __func__);
      break;
    }

    if (!eval_id(ctx, new_token_id, &n_past)) {
      fprintf(stderr, "%s: Finish. Eval failed\n", __func__);
      break;
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
  LOG_TEE("%s: generated %d tokens in %.2f s, speed: %.2f t/s\n", __func__,
          n_gen, (t_main_end - t_main_start) / 1000000.0f,
          n_gen / ((t_main_end - t_main_start) / 1000000.0f));
  llama_print_timings(ctx);

  // Free everything. Model loading time is negligible, especially when
  // compared to amount of RAM consumed by leaving model in memory
  // (~= size of model on disk)
  llama_free_model(model);
  llama_sampling_free(ctx_sampling);
  llama_free(ctx);
  llama_backend_free();
}
