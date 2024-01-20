#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#if _WIN32
#include <windows.h>
#else
#include <pthread.h>
#include <unistd.h>
#endif

#if _WIN32
#define FFI_PLUGIN_EXPORT __declspec(dllexport)
#else
#define FFI_PLUGIN_EXPORT
#endif

extern "C"
{
    typedef struct
    {
        int num_threads;
        int num_threads_batch;
        int num_gpu_layers;
        const char *input; // Pointer to the input string
    } LlamaInferenceRequest;
}

// A very short-lived native function.
//
// For very short-lived functions, it is fine to call them on the main isolate.
// They will block the Dart execution while running the native function, so
// only do this for native functions which are guaranteed to be short-lived.
FFI_PLUGIN_EXPORT extern "C" intptr_t sum(intptr_t a, intptr_t b);

// A longer lived native function, which occupies the thread calling it.
//
// Do not call these kind of native functions in the main isolate. They will
// block Dart execution. This will cause dropped frames in Flutter applications.
// Instead, call these native functions on a separate isolate.
FFI_PLUGIN_EXPORT extern "C" const char *c_inference(LlamaInferenceRequest request);

// Test of llama.cpp dependency.
FFI_PLUGIN_EXPORT extern "C" intptr_t llama_cpp_get_constant(void);
