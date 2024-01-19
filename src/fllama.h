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
FFI_PLUGIN_EXPORT extern "C" intptr_t sum_long_running(intptr_t a, intptr_t b);

// Test of llama.cpp dependency.
FFI_PLUGIN_EXPORT extern "C" intptr_t llama_cpp_get_constant(void);

extern "C"
{
    struct maid_params
    {
        unsigned char format; // 0 = raw, 1 = alpaca, 2 = chatml

        char *path;
        char *preprompt;
        char *input_prefix; // string to prefix user inputs with
        char *input_suffix; // string to suffix user inputs with

        unsigned int seed; // RNG seed
        int n_ctx;         // context size
        int n_batch;       // batch size for prompt processing (must be >=32 to use BLAS)
        int n_threads;     // number of threads to use for processing
        int n_predict;     // new tokens to predict
        int n_keep;        // number of tokens to keep from initial prompt

        int top_k;                 // <= 0 to use vocab size
        float top_p;               // 1.0 = disabled
        float min_p;               // 1.0 = disabled
        float tfs_z;               // 1.0 = disabled
        float typical_p;           // 1.0 = disabled
        float temp;                // 1.0 = disabled
        int penalty_last_n;        // last n tokens to penalize (0 = disable penalty, -1 = context size)
        float penalty_repeat;      // 1.0 = disabled
        float penalty_freq;        // 0.0 = disabled
        float penalty_present;     // 0.0 = disabled
        int mirostat;              // 0 = disabled, 1 = mirostat, 2 = mirostat 2.0
        float mirostat_tau;        // target entropy
        float mirostat_eta;        // learning rate
        unsigned char penalize_nl; // consider newlines as a repeatable token
    };

    enum return_code
    {
        STOP,
        CONTINUE,
    };

    typedef void maid_logger(const char *buffer);

    typedef void maid_output_stream(unsigned char code, const char *buffer);

    FFI_PLUGIN_EXPORT int core_init(struct maid_params *mparams, maid_logger *log_output);

    FFI_PLUGIN_EXPORT int core_prompt(const char *input, maid_output_stream *maid_output);

    FFI_PLUGIN_EXPORT void core_stop(void);

    FFI_PLUGIN_EXPORT void core_cleanup(void);
}