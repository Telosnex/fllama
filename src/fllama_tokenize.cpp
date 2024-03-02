#include "fllama_tokenize.h"

#include <mutex>

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

// Tokenizer model caching predeclarations
std::shared_ptr<llama_model> _get_or_load_model(const std::string &model_path);
// End tokenizer model caching predeclarations

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT extern "C" 
size_t fllama_tokenize(struct fllama_tokenize_request request) {
/* DISABLED: Model load logs.
  auto start_time_model_load = std::chrono::high_resolution_clock::now();
*/
  llama_log_set(
      [](enum ggml_log_level level, const char *text, void *user_data) {
        // do nothing. intent is to avoid ~50 lines of log spam with model
        // config when tokenizing
      },
      NULL);
  // Model caching avoids O(100 ms) cost for every tokenize request.
  llama_model *model = _get_or_load_model(request.model_path).get();
  if (!model) {
    std::cout << "[fllama] Unable to load model." << std::endl;
    return -1;
  }
  
  // 50 ms for initial load of 2 GB model, ~^10^-5 for cache hit.
/* DISABLED: Model load logs.
  auto end_time_model_load = std::chrono::high_resolution_clock::now();
  std::chrono::duration<double, std::milli> model_load_duration =
      end_time_model_load - start_time_model_load;
  std::cout << "[fllama] Model loading took: " << model_load_duration.count() << " ms." << std::endl;
*/

/* DISABLED: Tokenization logs.
  auto start_time_tokenize = std::chrono::high_resolution_clock::now();
*/
  std::vector<llama_token> tokens_list = ::llama_tokenize(model, request.input, true);
/* DISABLED: Tokenization logs.
  auto end_time_tokenize = std::chrono::high_resolution_clock::now();
  std::chrono::duration<double, std::milli> tokenize_duration =
       end_time_tokenize - start_time_tokenize;
   std::cout << "[fllama] Tokenization took: " << tokenize_duration.count()
             << " ms. Input token count: " << tokens_list.size() << std::endl;
*/
  return tokens_list.size();
}

struct ModelCacheEntry {
  std::shared_ptr<llama_model> model;
  std::chrono::steady_clock::time_point last_access;
};

std::mutex cache_mutex;
std::unordered_map<std::string, ModelCacheEntry> model_cache;

void cleanup_cache() {
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

std::shared_ptr<llama_model> _get_or_load_model(const std::string &model_path) {
  std::lock_guard<std::mutex> lock(cache_mutex);
  cleanup_cache();

  auto iter = model_cache.find(model_path);
  if (iter != model_cache.end()) {
    iter->second.last_access = std::chrono::steady_clock::now();
    return iter->second.model;
  } else {
    // std::cout << "[fllama] Cache miss, tokenize loading model: " << model_path << std::endl;
    gpt_params params;
    params.n_ctx = 0;
    params.n_batch = 0;
    params.n_predict = 0;
    params.sparams.temp = 0;
    std::vector<llama_sampler_type> samplers = {llama_sampler_type::TOP_P,
                                                llama_sampler_type::TEMP};
    params.sparams.samplers_sequence = samplers;
    params.sparams.top_p = 0;
    params.model = model_path.c_str();
    params.n_gpu_layers = 0;
    llama_model_params mparams = llama_model_params_from_gpt_params(params);
    mparams.vocab_only = true;
    llama_backend_init(params.numa);
    // Using llama_load_model_from_file instead of llama_init_from_gpt_params
    // avoided a crash when tokenization was called in quick succession without
    // this caching mechanism in place.
    //
    // It seems wise to continue using llama_load_model_from_file for tokenization,
    // as after viewing the call chain, the resource allocation load is lower.
    llama_model *raw_model =
        llama_load_model_from_file(model_path.c_str(), mparams);

    if (raw_model == nullptr) {
      return nullptr;
    }

    // Create a shared_ptr with custom deleter
    std::shared_ptr<llama_model> model(
        raw_model, [](llama_model *ptr) { llama_free_model(ptr); });

    model_cache[model_path] = {model, std::chrono::steady_clock::now()};
    llama_backend_free();
    return model;
  }
}
