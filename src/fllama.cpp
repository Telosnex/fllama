#include "fllama.h"
#include "llama.cpp/common/common.h"
#include "llama.cpp/llama.h"
#include "llama.cpp/ggml.h"

#include <cassert>
#include <cinttypes>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <ctime>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <unordered_set>
#include <thread>
#include <atomic>
#include <mutex>

#if defined(_MSC_VER)
#pragma warning(disable: 4244 4267) // possible loss of data
#endif

static std::atomic_bool stop_generation(false);
static std::mutex continue_mutex;

static llama_model * model;
static llama_context * ctx;
static llama_context * ctx_guidance;

static std::vector<llama_token> embd;
static std::vector<llama_token> embd_inp;

static int n_remain;
static int n_past;
static int n_consumed;


// A very short-lived native function.
//
// For very short-lived functions, it is fine to call them on the main isolate.
// They will block the Dart execution while running the native function, so
// only do this for native functions which are guaranteed to be short-lived.
FFI_PLUGIN_EXPORT extern "C" intptr_t sum(intptr_t a, intptr_t b) { return a + b; }

// A longer-lived native function, which occupies the thread calling it.
//
// Do not call these kind of native functions in the main isolate. They will
// block Dart execution. This will cause dropped frames in Flutter applications.
// Instead, call these native functions on a separate isolate.
FFI_PLUGIN_EXPORT extern "C" intptr_t sum_long_running(intptr_t a, intptr_t b) {
  std::cout << "Hello from fllama!" << std::endl;

  sleep(5);
      // Log the current working directory
    char currentDir[PATH_MAX];
    if (getcwd(currentDir, sizeof(currentDir)) != NULL) {
        std::cout << "Current Working Directory: " << currentDir << std::endl;
    } else {
        std::cerr << "getcwd() error" << std::endl;
        return -1;
    }



    ggml_time_init();
        gpt_params params;


    llama_backend_init(params.numa);


        // Load a dummy model from a file (replace 'dummy_model.llm' with an actual model file path)
            const char * modelFolder = "/Users/jamesoleary/Library/Containers/com.example.fllamaExample/Data/";

    const char * modelPath = "/Users/jamesoleary/Library/Containers/com.example.fllamaExample/Data/phi-2.Q4_K_M.gguf";
        #if defined(__APPLE__)
    #include "TargetConditionals.h"
    #if !TARGET_OS_IPHONE
    // This code will only be included in macOS builds, not iOS.
    const char* envVarName = "GGML_METAL_PATH_RESOURCES";
    setenv(envVarName, modelFolder, 1);
    #endif
    #endif

    struct llama_model_params model_params = llama_model_default_params();
    model_params.n_gpu_layers = 0;
    struct llama_model * model = llama_load_model_from_file(modelPath, model_params);
    if (model == NULL) {
        fprintf(stderr , "%s: error: unable to load model\n" , __func__);
        return 1;
    }
    std::vector<llama_token> tokens_list;
    tokens_list = ::llama_tokenize(model, "write me a longgggg poem.", true);
    std::cout << "Number of tokens: " << tokens_list.size() << std::endl;
    const int n_len = 300;
    std::cout << "B" << std::endl;
    llama_context_params ctx_params = llama_context_default_params();
    ctx_params.seed  = 1234;
    ctx_params.n_ctx = 2048;
    ctx_params.n_threads = params.n_threads;
    std::cout << "Number of threads: " << ctx_params.n_threads << std::endl;
    ctx_params.n_threads_batch = params.n_threads_batch == -1 ? params.n_threads : params.n_threads_batch;
    ctx = llama_new_context_with_model(model, ctx_params);

    const int n_ctx    = llama_n_ctx(ctx);
    const int n_kv_req = tokens_list.size() + (n_len - tokens_list.size());
    llama_batch batch = llama_batch_init(512, 0, 1);
     // evaluate the initial prompt
    for (size_t i = 0; i < tokens_list.size(); i++) {
        llama_batch_add(batch, tokens_list[i], i, { 0 }, false);
    }
    // llama_decode will output logits only for the last token of the prompt
    batch.logits[batch.n_tokens - 1] = true;
    if (llama_decode(ctx, batch) != 0) {
        LOG_TEE("%s: llama_decode() failed\n", __func__);
        return 1;
    }

    // main loop

    int n_cur    = batch.n_tokens;
    int n_decode = 0;

    const auto t_main_start = ggml_time_us();

    while (n_cur <= n_len) {
        // sample the next token
        {
            auto   n_vocab = llama_n_vocab(model);
            auto * logits  = llama_get_logits_ith(ctx, batch.n_tokens - 1);

            std::vector<llama_token_data> candidates;
            candidates.reserve(n_vocab);

            for (llama_token token_id = 0; token_id < n_vocab; token_id++) {
                candidates.emplace_back(llama_token_data{ token_id, logits[token_id], 0.0f });
            }

            llama_token_data_array candidates_p = { candidates.data(), candidates.size(), false };

            // sample the most likely token
            const llama_token new_token_id = llama_sample_token_greedy(ctx, &candidates_p);

            // is it an end of stream?
            if (new_token_id == llama_token_eos(model) || n_cur == n_len) {
                LOG_TEE("\n");

                break;
            }

            LOG_TEE("%s", llama_token_to_piece(ctx, new_token_id).c_str());
            fflush(stdout);

            // prepare the next batch
            llama_batch_clear(batch);

            // push this new token for next evaluation
            llama_batch_add(batch, new_token_id, n_cur, { 0 }, true);

            n_decode += 1;
        }

        n_cur += 1;

        // evaluate the current batch with the transformer model
        if (llama_decode(ctx, batch)) {
            fprintf(stderr, "%s : failed to eval, return code %d\n", __func__, 1);
            return 1;
        }
    }

    // Log finished
    const auto t_main_end = ggml_time_us();
    const auto t_main     = t_main_end - t_main_start;
    fprintf(stderr, "main loop: %f ms\n", t_main / 1000.0f);
   LOG_TEE("%s: decoded %d tokens in %.2f s, speed: %.2f t/s\n",
            __func__, n_decode, (t_main_end - t_main_start) / 1000000.0f, n_decode / ((t_main_end - t_main_start) / 1000000.0f));

    llama_print_timings(ctx);

    return GGML_MAX_CONTEXTS;
  // Simulate work.
#if _WIN32
  Sleep(5000);
#else
  usleep(5000 * 1000);
#endif
  return a + b;
}

FFI_PLUGIN_EXPORT extern "C" intptr_t llama_cpp_get_constant(void) {
  return GGML_MAX_CONTEXTS;
}
