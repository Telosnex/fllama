#ifndef FLLAMA_CHAT_TEMPLATE_H
#define FLLAMA_CHAT_TEMPLATE_H

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
EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char *fllama_get_chat_template(const char *fname);
#ifdef __cplusplus
}
#endif
#endif // FLLAMA_CHAT_TEMPLATE_H
