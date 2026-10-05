#ifndef FLLAMA_H
#define FLLAMA_H

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

#if _WIN32
#define FFI_PLUGIN_EXPORT __declspec(dllexport)
#else
#define FFI_PLUGIN_EXPORT
#endif

#include <stdint.h> // For uint8_t

#ifdef __cplusplus
extern "C" {
#endif

typedef void (*fllama_inference_callback)(const char *response, const char * openai_response_json_string, uint8_t done);
typedef void (*fllama_log_callback)(const char *);

struct fllama_gpu_memory_info {
  int32_t device_index;
  uint64_t total_bytes;
  uint64_t free_bytes;
  char name[128];
  char description[256];
  char device_id[128];
  char backend[64];      // ggml backend name, e.g. "Vulkan", "MTL" (Metal), "CUDA".
  char device_type[16];  // "GPU" (discrete) or "IGPU" (integrated).
  char device_key[512];  // Stable key for fllama_inference_request.gpu_device_key:
                         // "<backend>|<description>|<n>".
};

struct fllama_inference_request {
  int request_id; // Required: unique ID for the request. Used for cancellation.
  int context_size;        // Required: context size
  char *input;             // Required: input text
  int max_tokens;          // Required: max tokens to generate
  char *model_path;        // Required: .ggml model file path
  char *model_mmproj_path; // Optional: .mmproj file for multimodal models.
  int num_gpu_layers; // Required: number of GPU layers. -1 for auto: llama.cpp
                      // fits the layers to free GPU memory. 0 for CPU only.
                      // N > 0 for N layers. Automatically 0 on iOS simulator.
  int num_threads; // Required: 2 recommended. Platforms can be highly sensitive
                   // to this, ex. Android stopped working with 4 suddenly.
  float
      temperature; // Optional: temperature. Defaults to 0. (llama.cpp behavior)
  float top_p; // Optional: 0 < top_p <= 1. Defaults to 1. (llama.cpp behavior)
  float penalty_freq;   // Optional: 0 <= penalty_freq <= 1. Defaults to 0.0,
                        // which means disabled. (llama.cpp behavior)
  float penalty_repeat; // Optional: 0 <= penalty_repeat <= 1. Defaults to 1.0,
                        // which means disabled. (llama.cpp behavior)
  char *
      grammar; // Optional: BNF-like grammar to constrain sampling. Defaults to
               // "" (llama.cpp behavior). See
               // https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md
  char *eos_token; // Optional: end of sequence token. Defaults to one in model file. (llama.cpp behavior)
                   // For example, in ChatML / OpenAI, <|im_end|> means the message is complete.
                   // Often times GGUF files were created incorrectly, and this should be overridden.
                   // Using fllamaChat from Dart handles this automatically.
  fllama_log_callback
      dart_logger; // Optional: Dart caller logger. Defaults to NULL.
  char * openai_request_json_string; // Optional: OpenAI JSON string. Defaults to NULL.
  char * draft_model_path; // Optional: MTP assistant/drafter GGUF for speculative
                           // decoding (e.g. gemma-4-*-it-assistant). NULL/"" disables.
                           // NOTE: keep draft KV cache at F16 (default); Q8 KV
                           // destroys MTP draft acceptance.
  int draft_n_max;         // Optional: tokens to draft per step when
                           // draft_model_path is set. <= 0 falls back to 3.
  float draft_p_min;       // Optional: minimum drafter top-token probability.
                           // < 0 uses llama.cpp default.
  char * gpu_device_key;   // Optional: device_key from fllama_gpu_memory_info.
                           // The model uses only that GPU. NULL/"" is Auto.
                           // An unknown key is logged and treated as Auto.
};

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void fllama_inference(struct fllama_inference_request request,
                                        fllama_inference_callback callback);
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void fllama_inference_sync(struct fllama_inference_request request,
                           fllama_inference_callback callback);
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void fllama_inference_cancel(int request_id);

// Allows or forbids GPU backends for this process. Call before any other
// fllama call. With 0, fllama never loads a GPU backend library.
// Returns 0 on success, non-zero if backends are already loaded with a
// different setting.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT int fllama_set_gpu_allowed(uint8_t allowed);

// Comma-separated file names of the ggml backend libraries that fllama
// loaded, for example "ggml-vulkan.dll,ggml-cpu-haswell.dll". Empty on
// platforms that link the backends into fllama. The string is owned by
// fllama and stays valid for the life of the process.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char * fllama_get_loaded_backends(void);

// JSON array of the GPU pack files that this fllama build expects:
// [{"pack":"vulkan","name":"ggml-vulkan.dll","sha256":"<64 hex>",
//   "url":"<gzipped file in the fllama GitHub release>"}].
// "[]" if the build has no packs, for example a local source build, which
// bundles its GPU backends. The app downloads and gunzips each file and calls
// fllama_load_gpu_pack. The string is owned by fllama and never changes.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char * fllama_get_gpu_pack_files(void);

// Loads the GPU pack [pack] (for example "vulkan") from [directory] (UTF-8),
// which contains its files, not gzipped. Checks the SHA-256 of every file
// first. Unloads idle cached models, so the next request uses the new
// backend. Returns NULL on success or if the pack is already loaded, else
// an error message that stays valid until the next call on this thread.
// Fails if GPU backends are disabled or a request runs.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char * fllama_load_gpu_pack(
    const char * pack, const char * directory);

// 1 if the Vulkan loader lists a GPU that supports Vulkan 1.2, else 0.
// Does not need the Vulkan pack. 0 if GPU backends are disabled or this
// build has no Vulkan pack. Computed once per process; it calls the GPU
// driver.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT uint8_t fllama_has_vulkan_gpu(void);

// GPU device information.
// Returns the number of GPU devices (discrete and integrated) visible to
// ggml/llama.cpp.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT int fllama_get_gpu_device_count(void);

// Fills [out_info] for the GPU at [gpu_index].
// Returns 0 on success, non-zero on failure.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT int fllama_get_gpu_memory_info(
    int gpu_index,
    struct fllama_gpu_memory_info * out_info);
#ifdef __cplusplus
}
#endif

#endif // FLLAMA_H