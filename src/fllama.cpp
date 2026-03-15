// fllama.cpp — Phase 3: thin adapter over llama.cpp's server_context
//
// fllama_inference() spawns a reader thread that posts a server_task and
// streams results back via the Dart callback.  Multiple concurrent calls
// are batched automatically by server_context::update_slots().

#include "fllama.h"
#include "fllama_inference_queue.h"
#include "fllama_mtmd.h"

// server-context headers (no HTTP / httplib dependency)
#include "server-context.h"
#include "server-task.h"
#include "server-common.h"

#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
#include "../ios/llama.cpp/common/chat.h"
#include "../ios/llama.cpp/common/common.h"
#include "../ios/llama.cpp/ggml/include/ggml.h"
#include "../ios/llama.cpp/include/llama.h"
#elif TARGET_OS_OSX
#include "../macos/llama.cpp/common/chat.h"
#include "../macos/llama.cpp/common/common.h"
#include "../macos/llama.cpp/ggml/include/ggml.h"
#include "../macos/llama.cpp/include/llama.h"
#else
#include "llama.cpp/common/chat.h"
#include "llama.cpp/common/common.h"
#include "llama.cpp/ggml/include/ggml.h"
#include "llama.cpp/include/llama.h"
#endif

#include <atomic>
#include <chrono>
#include <cstring>
#include <deque>
#include <iostream>
#include <mutex>
#include <random>
#include <string>
#include <thread>
#include <vector>

#include "ggml-backend.h"

// ── Logging ──────────────────────────────────────────────────────────────────

static void log_message(const char *msg,
                        fllama_log_callback logger = nullptr) {
  if (!logger) {
    fprintf(stderr, "%s\n", msg);
    fflush(stderr);
    return;
  }
  static std::mutex mtx;
  static std::deque<std::string> q;
  std::string s(msg);
  for (size_t p = 0; (p = s.find('\n', p)) != std::string::npos; p += 4)
    s.replace(p, 1, "[NL]");
  std::lock_guard<std::mutex> lk(mtx);
  q.push_back(std::move(s));
  while (q.size() > 1000)
    q.pop_front();
  logger(q.back().c_str());
}
static void log_message(const std::string &m,
                        fllama_log_callback l = nullptr) {
  log_message(m.c_str(), l);
}

// ── Globals ──────────────────────────────────────────────────────────────────

// Intentionally leaked — avoids static destruction order crash on exit.
// (ggml Metal statics may be destroyed before g_mgr's destructor runs,
//  causing ggml_abort when server_context tries to free Metal resources.)
static ServerManager &g_mgr = *new ServerManager();
static std::once_flag  g_backend_init;

// ── The actual inference logic (runs on per-request thread) ──────────────────

static void run_inference(fllama_inference_request request,
                          fllama_inference_callback callback) {
  try {
    int64_t t0 = ggml_time_ms();
    log_message("[fllama] Inference start", request.dart_logger);

    // One-time backend init.
    std::call_once(g_backend_init, [] {
      ggml_backend_load_all();
      llama_backend_init();
    });

    // ── 1. Build common_params ────────────────────────────────────────

    common_params params;
    params.model.path       = request.model_path;
    params.n_ctx            = request.context_size;
    params.n_batch          = request.context_size;
    params.n_ubatch         = request.context_size;
    params.flash_attn_type  = LLAMA_FLASH_ATTN_TYPE_AUTO;
    params.n_parallel       = ServerManager::DEFAULT_N_PARALLEL;
    params.n_predict        = request.max_tokens;
    params.sampling.temp    = request.temperature;
    params.sampling.top_p   = request.top_p;
    params.sampling.penalty_freq   = request.penalty_freq;
    params.sampling.penalty_repeat = request.penalty_repeat;
    params.cpuparams.n_threads     = request.num_threads;
    params.use_jinja = true;

    // Default is 8192 MiB — way too much for mobile/embedded.
    // 0 = disable host-memory prompt caching entirely.
    // The KV cache in the llama_context still handles prompt reuse;
    // this only controls the EXTRA host-RAM cache from PR #16391.
    params.cache_ram_mib = 0;

#if TARGET_IPHONE_SIMULATOR
    params.n_gpu_layers = 0;
#else
    params.n_gpu_layers = request.num_gpu_layers;
#endif

    if (request.model_mmproj_path && strlen(request.model_mmproj_path) > 0)
      params.mmproj.path = request.model_mmproj_path;

    // ── 2. Get or create server_context ───────────────────────────────

    auto *srv = g_mgr.get_or_create(
        request.model_path, params, request.dart_logger);
    if (!srv || !srv->srv_ctx) {
      callback("Error: Failed to create inference context", "", true);
      return;
    }
    // RAII — release when we leave scope.
    struct Guard {
      ServerManager &m; std::string p;
      ~Guard() { m.release(p); }
    } guard{g_mgr, request.model_path};

    log_message("[fllama] Model ready (" +
                    std::to_string(ggml_time_ms() - t0) + " ms)",
                request.dart_logger);

    // ── 3. Build the prompt ───────────────────────────────────────────

    std::string prompt = request.input ? request.input : "";
    common_chat_parser_params parser_params;
    bool is_oai = false;

    if (request.openai_request_json_string) {
      is_oai = true;
      try {
        auto body = nlohmann::ordered_json::parse(
            request.openai_request_json_string);

        std::string jinja_tmpl;
        if (body.contains("jinja_template") &&
            body["jinja_template"].is_string()) {
          jinja_tmpl = body["jinja_template"].get<std::string>();
          body.erase("jinja_template");
        }

        auto *lctx  = srv->srv_ctx->get_llama_context();
        auto *model  = llama_get_model(lctx);
        auto  tmpls  = common_chat_templates_init(model, jinja_tmpl);

        try {
          std::map<std::string, std::string> empty;
          common_chat_format_example(tmpls.get(), true, empty);
        } catch (...) {
          tmpls = common_chat_templates_init(model, "chatml");
        }

        if (body.contains("messages") && body["messages"].is_array()) {
          common_chat_templates_inputs inputs;
          inputs.use_jinja = true;
          inputs.add_generation_prompt = true;
          inputs.messages =
              common_chat_msgs_parse_oaicompat(body["messages"]);

          if (body.contains("tools")) {
            inputs.tools =
                common_chat_tools_parse_oaicompat(body["tools"]);
            inputs.tool_choice =
                body.contains("tool_choice")
                    ? common_chat_tool_choice_parse_oaicompat(
                          body["tool_choice"]
                              .template get<std::string>())
                    : COMMON_CHAT_TOOL_CHOICE_AUTO;
          }

          auto result =
              common_chat_templates_apply(tmpls.get(), inputs);
          prompt = result.prompt;
          parser_params = common_chat_parser_params(result);
          if (!result.parser.empty()) {
            parser_params.parser.load(result.parser);
          }

          log_message("[fllama] Chat format: " +
                          std::string(common_chat_format_name(
                              result.format)),
                      request.dart_logger);
        }
      } catch (const std::exception &e) {
        log_message(std::string("[fllama] OAI parse error: ") + e.what(),
                    request.dart_logger);
        is_oai = false;
      }
    }

    // ── 4. Multimodal — extract base64 → raw bytes ───────────────────

    std::vector<raw_buffer> files;
    if (fllama_prompt_contains_image(prompt)) {
      auto img = fllama_extract_images(prompt);
      prompt = std::move(img.text_with_markers);
      for (auto &fb : img.file_bytes)
        files.push_back(std::move(fb));
      log_message("[fllama] Extracted " +
                      std::to_string(files.size()) + " image(s)",
                  request.dart_logger);
    }

    // ── 5. Create & post the server task ──────────────────────────────

    auto reader = srv->srv_ctx->get_response_reader();

    server_task task(SERVER_TASK_TYPE_COMPLETION);
    task.id         = reader.get_new_id();
    task.index      = 0;
    task.cli        = true;
    task.cli_prompt = prompt;
    task.cli_files  = std::move(files);

    task.params.stream       = true;
    task.params.cache_prompt = true;
    task.params.n_predict    = request.max_tokens;
    task.params.sampling.temp           = request.temperature;
    task.params.sampling.top_p          = request.top_p;
    task.params.sampling.penalty_freq   = request.penalty_freq;
    task.params.sampling.penalty_repeat = request.penalty_repeat;

    std::random_device rd;
    task.params.sampling.seed = rd();

    if (is_oai) {
      task.params.res_type           = TASK_RESPONSE_TYPE_OAI_CHAT;
      task.params.oaicompat_model    = request.model_path;
      task.params.oaicompat_cmpl_id  = gen_chatcmplid();
      task.params.chat_parser_params = parser_params;
    }

    reader.post_task(std::move(task));

    // ── 6. Read results, invoke callbacks ─────────────────────────────

    int rid = request.request_id;
    auto should_stop = [&] { return g_mgr.is_cancelled(rid); };

    std::string full_content;
    std::string last_json;

    while (reader.has_next()) {
      auto res = reader.next(should_stop);
      if (!res) break;

      if (res->is_error()) {
        auto ej = res->to_json();
        std::string msg = ej.contains("message")
                              ? ej["message"].get<std::string>()
                              : ej.dump();
        callback(msg.c_str(), "", true);
        g_mgr.clear_cancel(rid);
        g_mgr.unregister_request_thread(rid);
        return;
      }

      auto *partial =
          dynamic_cast<server_task_result_cmpl_partial *>(res.get());
      if (partial) {
        full_content += partial->content;
        auto j = res->to_json();
        if (!j.is_null()) {
          last_json = j.dump();
          callback(full_content.c_str(), last_json.c_str(), false);
        }
        continue;
      }

      auto *final_r =
          dynamic_cast<server_task_result_cmpl_final *>(res.get());
      if (final_r) {
        full_content = final_r->content;
        auto j = res->to_json();
        last_json = j.is_null() ? "" : j.dump();
        callback(full_content.c_str(), last_json.c_str(), true);

        log_message("[fllama] Done. " +
                        std::to_string(final_r->n_decoded) + " tok, " +
                        std::to_string(ggml_time_ms() - t0) + " ms",
                    request.dart_logger);
        g_mgr.clear_cancel(rid);
        g_mgr.unregister_request_thread(rid);
        return;
      }
    }

    // Cancelled or exhausted without final result.
    callback(full_content.c_str(), last_json.c_str(), true);
    g_mgr.clear_cancel(rid);
    g_mgr.unregister_request_thread(rid);

  } catch (const std::exception &e) {
    std::string msg = "Error: " + std::string(e.what());
    callback(msg.c_str(), "", true);
    g_mgr.clear_cancel(request.request_id);
    g_mgr.unregister_request_thread(request.request_id);
  } catch (...) {
    callback("Error: Unknown exception", "", true);
    g_mgr.clear_cancel(request.request_id);
    g_mgr.unregister_request_thread(request.request_id);
  }
}

// ── FFI entry points ─────────────────────────────────────────────────────────

extern "C" {

EMSCRIPTEN_KEEPALIVE void fllama_inference(fllama_inference_request request,
                                           fllama_inference_callback callback) {
  int rid = request.request_id;
  std::thread t([request, callback] { run_inference(request, callback); });
  g_mgr.register_request_thread(rid, std::move(t));
}

EMSCRIPTEN_KEEPALIVE void
fllama_inference_sync(fllama_inference_request request,
                      fllama_inference_callback callback) {
  // Synchronous variant — blocks the calling thread.
  run_inference(request, callback);
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT void
fllama_inference_cancel(int request_id) {
  g_mgr.cancel(request_id);
}

} // extern "C"
