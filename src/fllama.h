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

// Called for each update of an inference request, from a native thread.
// Each string is NULL or allocated with the Dart VM's allocator
// (dart_alloc.h); the callee owns it and must free it.
// - response: the text so far.
// - openai_response_json_string: the llama-server/OpenAI-style chunk of this
//   update, or NULL.
// - error_json: NULL, or {"type": "...", "message": "..."} on the last call
//   if the request failed. Types: model_load, invalid_request,
//   exceed_context_size, backend, other.
// - done: 1 on the last call, and only the last call. fllama makes no call
//   for the request after it, to this callback or to the request's logger.
//   A cancelled request ends with done and no error.
typedef void (*fllama_inference_callback)(char *response,
                                          char *openai_response_json_string,
                                          char *error_json, uint8_t done);
// Called with one log line. The callee owns the string, which is allocated
// with the Dart VM's allocator, and must free it.
typedef void (*fllama_log_callback)(char *message);

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
  int num_threads; // Required: -1 lets llama.cpp choose: one thread per
                   // physical core, as llama-server does.
  // Sampling. NaN means not set: the value that the GGUF file recommends
  // (general.sampling.*) is used, else llama.cpp's default. This is what
  // llama-server does.
  float temperature;    // llama.cpp default: 0.8.
  float top_p;          // 0 < top_p <= 1. llama.cpp default: 0.95.
  float penalty_freq;   // 0 is off. llama.cpp default: 0.
  float penalty_repeat; // 1 is off. llama.cpp default: 1.
  fllama_log_callback
      dart_logger; // Optional: logger of this request, or NULL. Gets fllama's
                   // lines and llama.cpp's lines from the request's thread,
                   // such as a model load.
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

// 1 if the NVIDIA driver reports a GPU and supports CUDA 12, else 0. Does
// not need the cuda pack. 0 if GPU backends are disabled or this build has
// no cuda pack. Computed once per process; it calls the GPU driver.
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT uint8_t fllama_has_cuda_gpu(void);

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