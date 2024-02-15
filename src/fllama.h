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

struct fllama_inference_request
{
    int context_size; // Required: context size
    char *input; // Required: input text
    int max_tokens; // Required: max tokens to generate
    char *model_path; // Required: .ggml model file path
    char *model_mmproj_path; // Optional: .mmproj file for multimodal models.
    int num_gpu_layers; // Required: number of GPU layers. 0 for CPU only. 99 for all layers. Automatically 0 on iOS simulator.
    float temperature; // Optional: temperature. Defaults to 0. (llama.cpp behavior)
    float top_p; // Optional: 0 < top_p <= 1. Defaults to 1. (llama.cpp behavior)
    float penalty_freq; // Optional: 0 <= penalty_freq <= 1. Defaults to 0.0, which means disabled. (llama.cpp behavior)
    float penalty_repeat; // Optional: 0 <= penalty_repeat <= 1. Defaults to 1.0, which means disabled. (llama.cpp behavior)
    char *grammar; // Optional: BNF-like grammar to constrain sampling. Defaults to "" (llama.cpp behavior). See https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md
    fllama_log_callback dart_logger; // Optional: Dart caller logger. Defaults to NULL.
};

typedef void (*fllama_tokenize_callback)(int count);

struct fllama_tokenize_request
{
    char *input; // Required: input text
    char *model_path; // Required: .ggml model file path
};

FFI_PLUGIN_EXPORT void fllama_inference(struct fllama_inference_request request, fllama_inference_callback callback);
FFI_PLUGIN_EXPORT void fllama_tokenize(struct fllama_tokenize_request request, fllama_tokenize_callback callback);
FFI_PLUGIN_EXPORT const char *fflama_get_chat_template(const char *fname);
FFI_PLUGIN_EXPORT const char *fflama_get_eos_token(const char *fname);

#ifdef __cplusplus
}
#endif






