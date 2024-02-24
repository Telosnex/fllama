#ifndef FLLAMA_EOS_H
#define FLLAMA_EOS_H

#if _WIN32
#define FFI_PLUGIN_EXPORT __declspec(dllexport)
#else
#define FFI_PLUGIN_EXPORT
#endif

#ifdef __cplusplus
extern "C" {
#endif
FFI_PLUGIN_EXPORT const char *fflama_get_eos_token(const char *fname);
#ifdef __cplusplus
}
#endif
#endif // FLLAMA_EOS_H
