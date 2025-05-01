#include "arg.h"
#include "log.h"
#include "common.h"
#include "sampling.h"
#include "llama.h"
#include "ggml.h"
#include "console.h"
#include "chat.h"
#include "mtmd.h"

#include <vector>
#include <limits.h>
#include <cinttypes>

#if defined (__unix__) || (defined (__APPLE__) && defined (__MACH__))
#include <signal.h>
#include <unistd.h>
#elif defined (_WIN32)
#define WIN32_LEAN_AND_MEAN
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#include <signal.h>
#endif

// volatile, because of signal being an interrupt
static volatile bool g_is_generating = false;
static volatile bool g_is_interrupted = false;

/**
 * Please note that this is NOT a production-ready stuff.
 * It is a playground for trying multimodal support in llama.cpp.
 * For contributors: please keep this code simple and easy to understand.
 */

static void show_additional_info(int /*argc*/, char ** argv) {
    LOG(
        "Experimental CLI for multimodal\n\n"
        "Usage: %s [options] -m <model> --mmproj <mmproj> --image <image> -p <prompt>\n\n"
        "  -m and --mmproj are required\n"
        "  -hf user/repo can replace both -m and --mmproj in most cases\n"
        "  --image and -p are optional, if NOT provided, the CLI will run in chat mode\n"
        "  to disable using GPU for mmproj model, add --no-mmproj-offload\n",
        argv[0]
    );
}

#if defined (__unix__) || (defined (__APPLE__) && defined (__MACH__)) || defined (_WIN32)
static void sigint_handler(int signo) {
    if (signo == SIGINT) {
        if (g_is_generating) {
            g_is_generating = false;
        } else {
            console::cleanup();
            if (g_is_interrupted) {
                _exit(1);
            }
            g_is_interrupted = true;
        }
    }
}
#endif

struct mtmd_cli_context {
    mtmd_context_ptr ctx_vision;
    common_init_result llama_init;

    llama_model       * model;
    llama_context     * lctx;
    const llama_vocab * vocab;
    llama_batch         batch;
    int                 n_batch;

    // note: we know that gemma3 template is "linear", meaning each turn is completely separated to another
    // so here we don't need to keep track of chat history
    common_chat_templates_ptr tmpls;

    // support for legacy templates (models not having EOT token)
    llama_tokens antiprompt_tokens;

    int n_threads    = 1;
    llama_pos n_past = 0;

    mtmd_cli_context(common_params & params) : llama_init(common_init_from_params(params)) {
        model = llama_init.model.get();
        lctx = llama_init.context.get();
        vocab = llama_model_get_vocab(model);
        n_threads = params.cpuparams.n_threads;
        batch = llama_batch_init(params.n_batch, 0, 1);
        n_batch = params.n_batch;

        if (!llama_model_chat_template(model, nullptr) && params.chat_template.empty()) {
            LOG_ERR("Model does not have chat template.\n");
            LOG_ERR("  For old llava models, you may need to use '--chat-template vicuna'\n");
            LOG_ERR("  For MobileVLM models, use '--chat-template deepseek'\n");
            exit(1);
        }

        tmpls = common_chat_templates_init(model, params.chat_template);
        LOG_INF("%s: chat template example:\n%s\n", __func__, common_chat_format_example(tmpls.get(), params.use_jinja).c_str());

        init_vision_context(params);

        // load antiprompt tokens for legacy templates
        if (params.chat_template == "vicuna") {
            antiprompt_tokens = common_tokenize(lctx, "ASSISTANT:", false, true);
        } else if (params.chat_template == "deepseek") {
            antiprompt_tokens = common_tokenize(lctx, "###", false, true);
        }
    }

    void init_vision_context(common_params & params) {
        const char * clip_path = params.mmproj.path.c_str();
        ctx_vision.reset(mtmd_init_from_file(clip_path, model, mtmd_context_params{
            /* use_gpu */   params.mmproj_use_gpu,
            /* timings */   true,
            /* n_threads */ params.cpuparams.n_threads,
            /* verbosity */ params.verbosity > 0 ? GGML_LOG_LEVEL_DEBUG : GGML_LOG_LEVEL_INFO,
        }));
        if (!ctx_vision.get()) {
            LOG_ERR("Failed to load vision model from %s\n", clip_path);
            exit(1);
        }
    }

    bool check_antiprompt(const llama_tokens & generated_tokens) {
        if (antiprompt_tokens.empty() || generated_tokens.size() < antiprompt_tokens.size()) {
            return false;
        }
        return std::equal(
            generated_tokens.end() - antiprompt_tokens.size(),
            generated_tokens.end(),
            antiprompt_tokens.begin()
        );
    }
};

static int generate_response(mtmd_cli_context & ctx, common_sampler * smpl, int n_predict) {
    llama_tokens generated_tokens;
    for (int i = 0; i < n_predict; i++) {
        if (i > n_predict || !g_is_generating || g_is_interrupted) {
            printf("\n");
            break;
        }

        llama_token token_id = common_sampler_sample(smpl, ctx.lctx, -1);
        generated_tokens.push_back(token_id);
        common_sampler_accept(smpl, token_id, true);

        if (llama_vocab_is_eog(ctx.vocab, token_id) || ctx.check_antiprompt(generated_tokens)) {
            printf("\n");
            break; // end of generation
        }

        printf("%s", common_token_to_piece(ctx.lctx, token_id).c_str());
        fflush(stdout);

        if (g_is_interrupted) {
            printf("\n");
            break;
        }

        // eval the token
        common_batch_clear(ctx.batch);
        common_batch_add(ctx.batch, token_id, ctx.n_past++, {0}, true);
        if (llama_decode(ctx.lctx, ctx.batch)) {
            LOG_ERR("failed to decode token\n");
            return 1;
        }
    }
    return 0;
}

static int eval_message(mtmd_cli_context & ctx, common_chat_msg & msg, std::vector<std::string> & images_fname, bool add_bos = false) {
    std::vector<mtmd_bitmap> bitmaps;

    common_chat_templates_inputs tmpl_inputs;
    tmpl_inputs.messages = {msg};
    tmpl_inputs.add_generation_prompt = true;
    tmpl_inputs.use_jinja = false; // jinja is buggy here
    auto formatted_chat = common_chat_templates_apply(ctx.tmpls.get(), tmpl_inputs);
    LOG_DBG("formatted_chat.prompt: %s\n", formatted_chat.prompt.c_str());

    for (auto & fname : images_fname) {
        mtmd_bitmap bitmap;
        if (mtmd_helper_bitmap_init_from_file(fname.c_str(), bitmap)) {
            LOG_ERR("Unable to load image %s\n", fname.c_str());
            return 2; // image not found
        }
        bitmaps.push_back(std::move(bitmap));
    }

    mtmd_input_text text;
    text.text          = formatted_chat.prompt;
    text.add_special   = add_bos;
    text.parse_special = true;
    mtmd_input_chunks chunks;

    if (g_is_interrupted) return 0;

    int32_t res = mtmd_tokenize(ctx.ctx_vision.get(), chunks, text, bitmaps);
    if (res != 0) {
        LOG_ERR("Unable to tokenize prompt, res = %d\n", res);
        return 1;
    }

    if (mtmd_helper_eval(ctx.ctx_vision.get(), ctx.lctx, chunks, ctx.n_past, 0, ctx.n_batch)) {
        LOG_ERR("Unable to eval prompt\n");
        return 1;
    }

    ctx.n_past += mtmd_helper_get_n_pos(chunks);

    return 0;
}

int main(int argc, char ** argv) {
    ggml_time_init();

    common_params params;
    params.sampling.temp = 0.2; // lower temp by default for better quality

    if (!common_params_parse(argc, argv, params, LLAMA_EXAMPLE_LLAVA, show_additional_info)) {
        return 1;
    }

    common_init();

    if (params.mmproj.path.empty()) {
        show_additional_info(argc, argv);
        LOG_ERR("ERR: Missing --mmproj argument\n");
        return 1;
    }

    mtmd_cli_context ctx(params);
    printf("%s: %s\n", __func__, params.model.path.c_str());

    bool is_single_turn = !params.prompt.empty() && !params.image.empty();

    struct common_sampler * smpl = common_sampler_init(ctx.model, params.sampling);
    int n_predict = params.n_predict < 0 ? INT_MAX : params.n_predict;

    // ctrl+C handling
    {
#if defined (__unix__) || (defined (__APPLE__) && defined (__MACH__))
        struct sigaction sigint_action;
        sigint_action.sa_handler = sigint_handler;
        sigemptyset (&sigint_action.sa_mask);
        sigint_action.sa_flags = 0;
        sigaction(SIGINT, &sigint_action, NULL);
#elif defined (_WIN32)
        auto console_ctrl_handler = +[](DWORD ctrl_type) -> BOOL {
            return (ctrl_type == CTRL_C_EVENT) ? (sigint_handler(SIGINT), true) : false;
        };
        SetConsoleCtrlHandler(reinterpret_cast<PHANDLER_ROUTINE>(console_ctrl_handler), true);
#endif
    }

    if (g_is_interrupted) return 130;

    if (is_single_turn) {
        g_is_generating = true;
        if (params.prompt.find("<__image__>") == std::string::npos) {
            params.prompt += " <__image__>";
        }
        common_chat_msg msg;
        msg.role = "user";
        msg.content = params.prompt;
        if (eval_message(ctx, msg, params.image, true)) {
            return 1;
        }
        if (!g_is_interrupted && generate_response(ctx, smpl, n_predict)) {
            return 1;
        }

    } else {
        LOG("\n Running in chat mode, available commands:");
        LOG("\n   /image <path>    load an image");
        LOG("\n   /clear           clear the chat history");
        LOG("\n   /quit or /exit   exit the program");
        LOG("\n");

        bool is_first_msg = true;
        std::vector<std::string> images_fname;
        std::string content;

        while (!g_is_interrupted) {
            g_is_generating = false;
            LOG("\n> ");
            console::set_display(console::user_input);
            std::string line;
            console::readline(line, false);
            if (g_is_interrupted) break;
            console::set_display(console::reset);
            line = string_strip(line);
            if (line.empty()) {
                continue;
            }
            if (line == "/quit" || line == "/exit") {
                break;
            }
            if (line == "/clear") {
                ctx.n_past = 0;
                llama_kv_self_seq_rm(ctx.lctx, 0, 1, -1); // keep BOS
                LOG("Chat history cleared\n\n");
                continue;
            }
            g_is_generating = true;
            if (line.find("/image") == 0) {
                std::string image = line.substr(7);
                images_fname.push_back(string_strip(image));
                content += "<__image__>";
                continue;
            } else {
                content += line;
            }
            common_chat_msg msg;
            msg.role = "user";
            msg.content = content;
            int ret = eval_message(ctx, msg, images_fname, is_first_msg);
            if (g_is_interrupted) break;
            if (ret == 2) {
                // non-fatal error
                images_fname.clear();
                content.clear();
                continue;
            }
            if (ret) {
                return 1;
            }
            if (generate_response(ctx, smpl, n_predict)) {
                return 1;
            }
            images_fname.clear();
            content.clear();
            is_first_msg = false;
        }
    }
    if (g_is_interrupted) LOG("\nInterrupted by user\n");
    LOG("\n\n");
    llama_perf_context_print(ctx.lctx);
    return g_is_interrupted ? 130 : 0;
}
