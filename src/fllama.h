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

typedef void (*fllama_inference_callback)(const char *response, uint8_t done);
typedef void (*fllama_log_callback)(const char *);

struct fllama_inference_request {
  char *request_id; // Required: unique ID for the request. Used for cancellation.
  int context_size;        // Required: context size
  char *input;             // Required: input text
  int max_tokens;          // Required: max tokens to generate
  char *model_path;        // Required: .ggml model file path
  char *model_mmproj_path; // Optional: .mmproj file for multimodal models.
  int num_gpu_layers; // Required: number of GPU layers. 0 for CPU only. 99 for
                      // all layers. Automatically 0 on iOS simulator.
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
};

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void fllama_inference(struct fllama_inference_request request,
                                        fllama_inference_callback callback);
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void fllama_inference_sync(struct fllama_inference_request request,
                           fllama_inference_callback callback);
#ifdef __cplusplus
}
#endif

#endif // FLLAMA_H