#ifndef FLLAMA_EOS_H
#define FLLAMA_EOS_H

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
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char *fllama_get_eos_token(const char *fname);
#ifdef __cplusplus
}
#endif
#endif // FLLAMA_EOS_H
