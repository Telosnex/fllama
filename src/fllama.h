

#if _WIN32
#define FFI_PLUGIN_EXPORT __declspec(dllexport)
#else
#define FFI_PLUGIN_EXPORT
#endif


#ifdef __cplusplus
extern "C" {
#endif


struct fllama_inference_request
{
    int num_threads;
    int num_threads_batch;
    int num_gpu_layers;
    char *input; // Pointer to the input string
    char *model_path; // Pointer to the model path
};

// A longer lived native function, which occupies the thread calling it.
//
// Do not call these kind of native functions in the main isolate. They will
// block Dart execution. This will cause dropped frames in Flutter applications.
// Instead, call these native functions on a separate isolate.
FFI_PLUGIN_EXPORT const char *fllama_inference(struct fllama_inference_request request);

#ifdef __cplusplus
}
#endif






