#ifndef FLLAMA_TOKENIZE_H
#define FLLAMA_TOKENIZE_H

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

#ifdef __cplusplus
extern "C" {
#endif

typedef void (*fllama_tokenize_callback)(int count);


struct fllama_tokenize_request
{
    char *input; // Required: input text
    char *model_path; // Required: .ggml model file path
};

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void fllama_tokenize(struct fllama_tokenize_request request, fllama_tokenize_callback callback);
#ifdef __cplusplus
}
#endif
#endif // FLLAMA_TOKENIZE_H
