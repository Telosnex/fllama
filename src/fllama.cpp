#include "fllama.h"

#ifndef LOG_UTILS_H
#define LOG_UTILS_H

#include <iostream>
#include <string>

#if defined(__ANDROID__)
#include <android/log.h>
#define LOG_TAG "fllama"
#elif defined(__APPLE__)
#include <os/log.h>
#endif

inline void logd_impl(const std::string &message)
{
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
inline void logd(const std::string &format, Args... args)
{
  int size_s = snprintf(nullptr, 0, format.c_str(), args...) + 1; // +1 for '\0'
  if (size_s <= 0)
  {
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
#include "../ios/llama.cpp/llama.h"
#include "../ios/llama.cpp/ggml.h"

#elif TARGET_OS_OSX
// macOS-specific includes
#include "../macos/llama.cpp/common/common.h"
#include "../macos/llama.cpp/llama.h"
#include "../macos/llama.cpp/ggml.h"

#else
// Other platforms
#include "common/common.h"
#include "llama.h"
#include "ggml.h"
#endif

#include <cassert>
#include <cinttypes>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <ctime>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <unordered_set>
#include <thread>
#include <atomic>
#include <mutex>

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

// A very short-lived native function.
//
// For very short-lived functions, it is fine to call them on the main isolate.
// They will block the Dart execution while running the native function, so
// only do this for native functions which are guaranteed to be short-lived.
FFI_PLUGIN_EXPORT extern "C" intptr_t sum(intptr_t a, intptr_t b) { return a + b; }

// A longer-lived native function, which occupies the thread calling it.
//
// Do not call these kind of native functions in the main isolate. They will
// block Dart execution. This will cause dropped frames in Flutter applications.
// Instead, call these native functions on a separate isolate.
FFI_PLUGIN_EXPORT extern "C" const char *c_inference(LlamaInferenceRequest request)
{
  std::cout << "Hello from fllama!" << std::endl;

  // Log the current working directory
  char currentDir[PATH_MAX];
  if (getcwd(currentDir, sizeof(currentDir)) != NULL)
  {
    logd("Current Working Directory: %s", currentDir);
    // std::cout << "Current Working Directory: " << currentDir << std::endl;
  }

  ggml_time_init();
  gpt_params params;

  llama_backend_init(params.numa);

  // Load a dummy model from a file (replace 'dummy_model.llm' with an actual model file path)
  const char *modelFolder = "/Users/jamesoleary/Library/Containers/com.example.fllamaExample/Data/";

  const char *modelPath = "/Users/jamesoleary/Library/Containers/com.example.fllamaExample/Data/phi-2.Q4_K_M.gguf";
#if defined(__APPLE__)
#include "TargetConditionals.h"
#if !TARGET_OS_IPHONE
  // This code will only be included in macOS builds, not iOS.
  const char *envVarName = "GGML_METAL_PATH_RESOURCES";
  setenv(envVarName, modelFolder, 1);
#endif
#endif

  struct llama_model_params model_params = llama_model_default_params();

// Force CPU if iOS simulator: no GPU support available, hangs.
#if TARGET_IPHONE_SIMULATOR
  model_params.n_gpu_layers = 0;
// Otherwise, for physical iOS devices and other platforms
#else
  model_params.n_gpu_layers = 99;
#endif

  struct llama_model *model = llama_load_model_from_file(modelPath, model_params);
  if (model == NULL)
  {
    fprintf(stderr, "%s: error: unable to load model\n", __func__);
    throw std::runtime_error("[fllama] Unable to load model from file: " + std::string(modelPath));
  }
  std::vector<llama_token> tokens_list;
  tokens_list = ::llama_tokenize(model, request.input, true);
  std::cout << "[fllama] Number of tokens: " << tokens_list.size() << std::endl;

  // Current implementation based on llama.cpp/examples/simple/simple.cpp.
  // macOS and iOS based on intuition that:
  // - it will be difficult to get llama.cpp building as a CMakeLists library.
  // - a .podspec is a pseudo-CMakeLists file.
  // - creating a seperate llama.cpp .podspec is not ideal as llama.cpp support
  //   is necessarily opinionated - ex. whether or not to pursue Metal support.
  //
  // Thus, integrating by copying the llama.cpp source to {ios/macos}/Classes/llama.cpp
  // was the best option. After repeatedly building and fixing errors requiring relative
  // imports, you then have a llama.cpp library that can be used in the iOS and macOS.
  //
  // Due to the copying, the build is entirely contained within the codebase.
  // Updating versions required updating the submodule _and_ copying the files
  // to the iOS and macOS directories, and then fixing relative imports. This
  // takes about 20 minutes, tops.
  // 3 files:
  // - llama.cpp/common/common.h
  // - llama.cpp/common/grammar-parser.h
  // - llama.cpp/common/sampling.h
  const int n_len = 300;
  std::cout << "B" << std::endl;
  llama_context_params ctx_params = llama_context_default_params();
  ctx_params.seed = 1234;
  ctx_params.n_ctx = 2048;
  ctx_params.n_threads = params.n_threads;
  std::cout << "Number of threads: " << ctx_params.n_threads << std::endl;
  ctx_params.n_threads_batch = params.n_threads_batch == -1 ? params.n_threads : params.n_threads_batch;
  ctx = llama_new_context_with_model(model, ctx_params);

  const int n_ctx = llama_n_ctx(ctx);
  const int n_kv_req = tokens_list.size() + (n_len - tokens_list.size());
  llama_batch batch = llama_batch_init(512, 0, 1);
  // evaluate the initial prompt
  for (size_t i = 0; i < tokens_list.size(); i++)
  {
    llama_batch_add(batch, tokens_list[i], i, {0}, false);
  }
  // llama_decode will output logits only for the last token of the prompt
  batch.logits[batch.n_tokens - 1] = true;
  if (llama_decode(ctx, batch) != 0)
  {
    LOG_TEE("%s: llama_decode() failed\n", __func__);
    // throw runtime error
    throw std::runtime_error("[fllama] llama_decode() failed");
  }

  // main loop

  int n_cur = batch.n_tokens;
  int n_decode = 0;
  std::string result;

  const auto t_main_start = ggml_time_us();

  while (n_cur <= n_len)
  {
    // sample the next token
    {
      auto n_vocab = llama_n_vocab(model);
      auto *logits = llama_get_logits_ith(ctx, batch.n_tokens - 1);

      std::vector<llama_token_data> candidates;
      candidates.reserve(n_vocab);

      for (llama_token token_id = 0; token_id < n_vocab; token_id++)
      {
        candidates.emplace_back(llama_token_data{token_id, logits[token_id], 0.0f});
      }

      llama_token_data_array candidates_p = {candidates.data(), candidates.size(), false};

      // sample the most likely token
      const llama_token new_token_id = llama_sample_token_greedy(ctx, &candidates_p);

      // is it an end of stream?
      if (new_token_id == llama_token_eos(model) || n_cur == n_len)
      {
        LOG_TEE("\n");

        break;
      }
      result += llama_token_to_piece(ctx, new_token_id);
      fflush(stdout);

      // prepare the next batch
      llama_batch_clear(batch);

      // push this new token for next evaluation
      llama_batch_add(batch, new_token_id, n_cur, {0}, true);

      n_decode += 1;
    }

    n_cur += 1;

    // evaluate the current batch with the transformer model
    if (llama_decode(ctx, batch))
    {
      fprintf(stderr, "%s : failed to eval, return code %d\n", __func__, 1);
      throw std::runtime_error("Inference failed");
    }
  }

  // Log finished
  const auto t_main_end = ggml_time_us();
  const auto t_main = t_main_end - t_main_start;
  fprintf(stderr, "main loop: %f ms\n", t_main / 1000.0f);
  LOG_TEE("%s: decoded %d tokens in %.2f s, speed: %.2f t/s\n",
          __func__, n_decode, (t_main_end - t_main_start) / 1000000.0f, n_decode / ((t_main_end - t_main_start) / 1000000.0f));

  llama_print_timings(ctx);

  // Allocate a C-style string to return.
  // Dart FFI boundary needs to be a C-style string.
  // We need to copy the result to newly allocated memory because the std::string will be destroyed when the function ends
  char *c_result = new char[result.size() + 1]; // +1 for the null terminator
  std::strcpy(c_result, result.c_str());

  // Return the newly allocated C-style string
  return c_result;
}

FFI_PLUGIN_EXPORT extern "C" intptr_t llama_cpp_get_constant(void)
{
  return GGML_MAX_CONTEXTS;
}
