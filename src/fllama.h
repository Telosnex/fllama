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

struct fllama_inference_request
{
    int context_size; // Required: context size
    char *input; // Required: input text
    int max_tokens; // Required: max tokens to generate
    char *model_path; // Required: .ggml model file path
    int num_gpu_layers; // Required: number of GPU layers. 0 for CPU only. 99 for all layers. Automatically 0 on iOS simulator.
    float temperature; // Optional: temperature. Defaults to 0. (llama.cpp behavior)
    float top_p; // Optional: 0 < top_p <= 1. Defaults to 1. (llama.cpp behavior)
};

// A longer lived native function, which occupies the thread calling it.
//
// Do not call these kind of native functions in the main isolate. They will
// block Dart execution. This will cause dropped frames in Flutter applications.
// Instead, call these native functions on a separate isolate.
FFI_PLUGIN_EXPORT void fllama_inference(struct fllama_inference_request request, fllama_inference_callback callback);

#ifdef __cplusplus
}
#endif






