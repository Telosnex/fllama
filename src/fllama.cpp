#include "fllama.h"

#ifndef LOG_UTILS_H
#define LOG_UTILS_H

#include <iostream>
#include <string>
#include <thread>

#if defined(__ANDROID__)
#include <android/log.h>
#define LOG_TAG "fllama"
#elif defined(__APPLE__)
#include <os/log.h>
#endif

inline void logd_impl(const std::string &message) {
#if defined(__ANDROID__)
  __android_log_write(ANDROID_LOG_DEBUG, LOG_TAG, message.c_str());
#elif defined(__APPLE__)
  os_log(OS_LOG_DEFAULT, "%{public}s", message.c_str());
#else
  std::cout << message << std::endl;
#endif
}

// Variadic template to handle different numbers of arguments
template <typename... Args>
inline void logd(const std::string &format, Args... args) {
  int size_s = snprintf(nullptr, 0, format.c_str(), args...) + 1; // +1 for '\0'
  if (size_s <= 0) {
    logd_impl("logd error during formatting.");
    return;
  }
  auto size = static_cast<size_t>(size_s);
  std::unique_ptr<char[]> buf(new char[size]);
  snprintf(buf.get(), size, format.c_str(), args...);
  logd_impl(std::string(buf.get(), buf.get() + size - 1)); // Exclude the '\0'
}

#endif // LOG_UTILS_H

// LLaMA.cpp cross-platform support
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
// iOS-specific includes
#include "../ios/llama.cpp/common/common.h"
#include "../ios/llama.cpp/ggml.h"
#include "../ios/llama.cpp/llama.h"
#include "../ios/llama.cpp/sampling.h"

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

static std::atomic_bool stop_generation(false);
static std::mutex continue_mutex;

static llama_model *model;
static llama_context *ctx;
static llama_context *ctx_guidance;

static std::vector<llama_token> embd;
static std::vector<llama_token> embd_inp;

static int n_remain;
static int n_past;
static int n_consumed;

void _fllama_inference_sync(fllama_inference_request request,
                            fllama_inference_callback callback);
// Current implementation based on llama.cpp/examples/simple/simple.cpp combined
// with handling sampling manually via top_p and temp functions.
//
// The other route you'll see is setting up a sampling context, but it doesn't
// work well without a lot of hand-holding - ex. manually specifying the exact
// samplers you want to use. If you just use it straight-up, one of the other 6
// techniques outside top-P and temperature overrides temperature, somehow.
//
// It's incompatible with what seems to be the "new batch API", which it seems
// simple.cpp used. But who knows, that'd require some semblance of
// documentation.
//
// macOS and iOS based on intuition that:
// - it will be difficult to get llama.cpp building as a CMakeLists library.
// - a .podspec is a pseudo-CMakeLists file.
// - creating a seperate llama.cpp .podspec is not ideal as llama.cpp
// support
//   is necessarily opinionated - ex. whether or not to pursue Metal
//   support.
//
// Thus, integrating by copying the llama.cpp source to
// {ios/macos}/Classes/llama.cpp was the best option. After repeatedly
// building and fixing errors requiring relative imports, you then have a
// llama.cpp library that can be used in the iOS and macOS.
//
// Due to the copying, the build is entirely contained within the codebase.
// Updating versions required updating the submodule _and_ copying the files
// to the iOS and macOS directories, and then fixing relative imports. This
// takes about 20 minutes, tops.
// 3 files:
// - llama.cpp/common/common.h
// - llama.cpp/common/grammar-parser.h
// - llama.cpp/common/sampling.h
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
  model_params.n_gpu_layers = 0;
// Otherwise, for physical iOS devices and other platforms
#else
  params.n_gpu_layers = request.num_gpu_layers;
#endif
  const char *metal_path = request.ggml_metal_path;
  if (metal_path != nullptr) {
    std::cout << "[fllama] Metal path: " << metal_path << std::endl;
    setenv("GGML_METAL_PATH_RESOURCES", metal_path, 1);
  } else {
    std::cout << "[fllama] Metal path not provided; Metal not enabled. You "
                 "should try to provide a path on macOS or iOS."
              << std::endl;
  }

  llama_backend_init(params.numa);
  std::tie(model, ctx) = llama_init_from_gpt_params(params);
  if (model == NULL || ctx == NULL) {
    std::cout << "[fllama] Unable to load model." << std::endl;
    if (model != NULL) {
      llama_free_model(model);
    }
    throw std::runtime_error("[fllama] Unable to initialize model");
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
    throw std::runtime_error("[fllama] llama_decode() failed");
  }

  // main loop
  int n_cur = batch.n_tokens;
  int n_gen = 0;
  int n_decode = 0;
  std::string result;

  const auto t_main_start = ggml_time_us();

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
      if (new_token_id == llama_token_eos(model) || n_gen == n_max_tokens) {
        break;
      }
      result += llama_token_to_piece(ctx, new_token_id);
      char *c_result =
          (char *)malloc(result.size() + 1); // +1 for the null terminator
      if (c_result) { // Ensure malloc succeeded before using the pointer
        std::strcpy(c_result, result.c_str());
        callback(c_result);
        // Assuming the callback or the caller now owns the resource and will
        // free it.
      }

      // prepare the next batch
      llama_batch_clear(batch);

      // push this new token for next evaluation
      llama_batch_add(batch, new_token_id, n_cur, {0}, true);

      n_decode += 1;
      n_gen += 1;
    }

    n_cur += 1;

    // evaluate the current batch with the transformer model
    if (llama_decode(ctx, batch)) {
      fprintf(stderr, "%s : failed to eval, return code %d\n", __func__, 1);
      throw std::runtime_error("Inference failed");
    }
  }

  // Log finished
  const auto t_main_end = ggml_time_us();
  const auto t_main = t_main_end - t_main_start;
  fprintf(stderr, "main loop: %f ms\n", t_main / 1000.0f);
  LOG_TEE("%s: decoded %d tokens in %.2f s, speed: %.2f t/s\n", __func__,
          n_decode, (t_main_end - t_main_start) / 1000000.0f,
          n_decode / ((t_main_end - t_main_start) / 1000000.0f));
  llama_print_timings(ctx);
}