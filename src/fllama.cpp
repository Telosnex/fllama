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
#include <condition_variable>
#include <cstdio>
#include <cstring>
#include <ctime>
#include <fstream>
#include <functional>
#include <iostream>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <unordered_set>
#include <vector>

#if defined(_MSC_VER)
#pragma warning(disable : 4244 4267) // possible loss of data
#endif

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
  fprintf(stderr, "%s: eval_string: %s\n", __func__, str);
  return add_tokens_to_context(ctx_llama, embd_inp, n_batch, n_past);
}

void _fllama_inference_sync(fllama_inference_request request,
                            fllama_inference_callback callback);

void _fllama_inference_sync(fllama_inference_request request,
                            fllama_inference_callback callback) {
  // 1. Setup parameters, then load the model and create a context.
  std::cout << "[fllama] Inference thread start @ " << ggml_time_us()
            << std::endl;
  gpt_params params;
  std::cout << "[fllama] Initializing params." << std::endl;
  params.n_ctx = request.context_size;
  std::cout << "[fllama] Context size: " << params.n_ctx << std::endl;
  params.n_batch = request.context_size;
  params.n_predict = request.max_tokens;
  params.sparams.temp = request.temperature;
  std::cout << "[fllama] Default penalty_freq: " << params.sparams.penalty_freq
            << std::endl;
  std::cout << "[fllama] Default penalty_repeat: "
            << params.sparams.penalty_repeat << std::endl;
  params.sparams.penalty_freq = request.penalty_freq;
  params.sparams.penalty_repeat = request.penalty_repeat;
  params.sparams.samplers_sequence = "pt";
  params.sparams.top_p = request.top_p;
  if (request.grammar != NULL) {
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
  std::cout << "[fllama] Number of GPU layers: " << params.n_gpu_layers
            << std::endl;
#endif
  llama_backend_init(params.numa);
  std::cout << "[fllama] Backend initialized." << std::endl;
  llama_model *model;
  llama_context *ctx;
  std::tie(model, ctx) = llama_init_from_gpt_params(params);
  if (model == NULL || ctx == NULL) {
    std::cout << "[fllama] Unable to load model." << std::endl;
    if (model != NULL) {
      llama_free_model(model);
    }
    callback(/* response */ "Error: Unable to load model.", /* done */ true);
    return;
  }
  std::cout << "[fllama] Model loaded." << std::endl;

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
  add_string_to_context(ctx, request.input, params.n_batch, &n_past, add_bos);

  struct llama_sampling_context *ctx_sampling =
      llama_sampling_init(params.sparams);

  const std::string eos_token_as_string =
      std::string(fflama_get_eos_token(request.model_path));
  bool has_valid_eos_token = eos_token_as_string.length() > 0;
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
  bool potentially_eos =
      false; // Flag to indicate that we're potentially forming an EOS token
  std::string buffer; // Buffer to accumulate potential EOS token sequences

  const auto model_eos_token = llama_token_eos(model);
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
      fprintf(stderr, "eos_token found at position: %zu\n", eos_pos);
      result += buffer.substr(0, eos_pos);
      buffer.erase(0, eos_pos + eos_token_as_string.length());
      break;
    } else {
      fprintf(stderr, "eos_token not found in buffer\n");
      fprintf(stderr, "buffer: %s\n", buffer.c_str());
      fprintf(stderr, "eos_token: %s\n", eos_token_as_string.c_str());
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
      fprintf(stderr, "%s: Finish. Max tokens reached\n", __func__);
      if (buffer.length() > 0) {
        result += buffer;
      }
      break;
    }

    if (!add_token_to_context(ctx, new_token_id, &n_past)) {
      fprintf(stderr, "%s: Finish. Eval failed\n", __func__);
      if (buffer.length() > 0) {
        result += buffer;
      }
      break;
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
  std::cout << "[fllama] freeing start @ " << ggml_time_us() << std::endl;
  llama_free_model(model);
  llama_sampling_free(ctx_sampling);
  llama_free(ctx);
  llama_backend_free();
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
    callback(-1);
    return;
  }
  std::vector<llama_token> tokens_list;
  tokens_list = ::llama_tokenize(model, request.input, true);
  std::cout << "[fllama] Input token count: " << tokens_list.size()
            << std::endl;
  callback(tokens_list.size());
}

const char *fflama_get_chat_template(const char *fname) {
  struct ggml_context *meta = NULL;

  struct gguf_init_params params = {
      /*.no_alloc = */ true,
      /*.ctx      = */ &meta,
  };

  struct gguf_context *ctx = gguf_init_from_file(fname, params);
  if (!ctx) {
    fprintf(stderr, "Unable to load chat template: %s\n", fname);
    return ""; // Return NULL to indicate failure to load or find the value.
  }

  const char *targetKey = "tokenizer.chat_template";
  const int keyidx = gguf_find_key(ctx, targetKey);
  if (keyidx < 0) {
    printf("%s: key '%s' not found.\n", __func__, targetKey);
    return ""; // Key not found.
  } else {
    const char *keyValue = gguf_get_val_str(ctx, keyidx);
    if (keyValue) {
      // If keyValue is not null, we've found our string value. Return it
      // directly.
      return keyValue;
    } else {
      // Key was found, but it doesn't have an associated string value, or the
      // value is null.
      printf("%s: key '%s' found, but it has no associated string value or "
             "value is null.\n",
             __func__, targetKey);
      return ""; // Value is null.
    }
  }

  // Should not reach here.
  return ""; // Just to avoid compiler warning.
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

  // Return the pointer to the caller. The caller must `delete[]` this memory.
  return heapWord;
}
