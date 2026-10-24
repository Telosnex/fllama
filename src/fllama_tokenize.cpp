#include "fllama_tokenize.h"
#include "fllama_backends.h"

#include <cstdint>
#include <cstring>
#include <iostream>
#include <memory>
#include <mutex>
#include <unordered_map>

#include "llama.cpp/common/base64.hpp"
#include "llama.cpp/common/common.h"
#include "llama.cpp/common/sampling.h"
#include "llama.cpp/ggml/include/ggml.h"
#include "llama.cpp/include/llama.h"

// Tokenizer model caching predeclarations
static std::shared_ptr<llama_model> _get_or_load_model(const std::string &model_path);
// End tokenizer model caching predeclarations

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT extern "C" 
size_t fllama_tokenize(struct fllama_tokenize_request request) {
  fllama_backends_init_once();
  // Leaves out the ~50 lines that a model load logs, on this thread only.
  // llama_log_set would silence llama.cpp for the whole process.
  fllama_thread_log_scope silence(
      [](enum ggml_log_level, const char *) { return true; });
  // Model caching avoids O(100 ms) cost for every tokenize request.
  llama_model *model = _get_or_load_model(request.model_path).get();
  if (!model) {
    std::cout << "[fllama] Unable to load model." << std::endl;
    return static_cast<size_t>(-1);
  }

  const llama_vocab *vocab = llama_model_get_vocab(model);
  const size_t input_len = strlen(request.input);
  if (input_len > static_cast<size_t>(INT32_MAX)) {
    return static_cast<size_t>(-1);
  }
  // With no buffer, llama_tokenize returns -(the token count), or 0 for no
  // tokens. INT32_MIN: more tokens than an int32 holds.
  const int32_t r = ::llama_tokenize(vocab, request.input,
                                     static_cast<int32_t>(input_len),
                                     nullptr, 0,
                                     true,   // add BOS
                                     true);  // parse special tokens
  if (r == INT32_MIN) return static_cast<size_t>(-1);
  return static_cast<size_t>(r < 0 ? -static_cast<int64_t>(r) : r);
}

struct ModelCacheEntry {
  std::shared_ptr<llama_model> model;
  std::chrono::steady_clock::time_point last_access;
};

static std::mutex cache_mutex;
static std::unordered_map<std::string, ModelCacheEntry> model_cache;

static void cleanup_cache() {
  auto now = std::chrono::steady_clock::now();
  std::vector<std::string> to_erase;

  for (const auto &entry : model_cache) {
    auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(
        now - entry.second.last_access);
    if (elapsed.count() > 30) {
      to_erase.push_back(entry.first);
    }
  }

  for (const auto &key : to_erase) {
    model_cache.erase(key);
  }
}

static std::shared_ptr<llama_model> _get_or_load_model(const std::string &model_path) {
  std::lock_guard<std::mutex> lock(cache_mutex);
  cleanup_cache();

  auto iter = model_cache.find(model_path);
  if (iter != model_cache.end()) {
    iter->second.last_access = std::chrono::steady_clock::now();
    return iter->second.model;
  } else {
    // Initialize model params with defaults
    llama_model_params mparams = llama_model_default_params();
    mparams.vocab_only = true;
    mparams.load_mode = LLAMA_LOAD_MODE_MMAP;
    mparams.n_gpu_layers = 0;
    fllama_backends_init_once();
    auto registry_lock = fllama_backends_registry_read_lock();
    // Using llama_model_load_from_file instead of llama_init_from_gpt_params
    // avoided a crash when tokenization was called in quick succession without
    // this caching mechanism in place.
    //
    // It seems wise to continue using llama_model_load_from_file for tokenization,
    // as after viewing the call chain, the resource allocation load is lower.
    llama_model *raw_model =
        llama_model_load_from_file(model_path.c_str(), mparams);

    if (raw_model == nullptr) {
      return nullptr;
    }

    // Create a shared_ptr with custom deleter
    std::shared_ptr<llama_model> model(
        raw_model, [](llama_model *ptr) { llama_model_free(ptr); });

    model_cache[model_path] = {model, std::chrono::steady_clock::now()};
    return model;
  }
}
