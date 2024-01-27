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
    char *grammar; // Optional: BNF-like grammar to constrain sampling. Defaults to "" (llama.cpp behavior). See https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md
};

typedef void (*fllama_tokenize_callback)(int count);

struct fllama_tokenize_request
{
    char *input; // Required: input text
    char *model_path; // Required: .ggml model file path
};

FFI_PLUGIN_EXPORT void fllama_inference(struct fllama_inference_request request, fllama_inference_callback callback);
FFI_PLUGIN_EXPORT void fllama_tokenize(struct fllama_tokenize_request request, fllama_tokenize_callback callback);

#ifdef __cplusplus
}
#endif






