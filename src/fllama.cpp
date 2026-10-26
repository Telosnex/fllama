// fllama.cpp — Phase 3: thin adapter over llama.cpp's server_context
//
// fllama_inference() spawns a reader thread that posts a server_task and
// streams results back via the Dart callback.  Multiple concurrent calls
// are batched automatically by server_context::update_slots().

#include "fllama.h"
#include "fllama_backends.h"
#include "fllama_inference_queue.h"
#include "fllama_mtmd.h"

// server-context headers (no HTTP / httplib dependency)
#include "server-context.h"
#include "server-task.h"
#include "server-common.h"
#include "server-schema.h"

#include "llama.cpp/common/chat.h"
#include "llama.cpp/common/common.h"
#include "llama.cpp/common/sampling.h"
#include "llama.cpp/ggml/include/ggml.h"
#include "llama.cpp/include/llama.h"

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <deque>
#include <iostream>
#include <mutex>
#include <random>
#include <string>
#include <thread>
#include <vector>

#include "ggml-backend.h"

// Last: on Windows it includes windows.h.
#include "dart_alloc.h"

// ── Strings for Dart ─────────────────────────────────────────────────────────

// A copy of [s] that Dart owns and frees (dart_alloc.h). Each callback gets
// its own copy, so no string has to outlive a call.
static char *dart_string(const std::string &s) {
  char *p = dart_malloc<char>(s.size() + 1);
  std::memcpy(p, s.data(), s.size());
  p[s.size()] = '\0';
  return p;
}

// JSON text. Replaces invalid UTF-8, which a model can generate, as
// llama-server's safe_json_to_str does. dump() would throw.
static std::string json_text(const json &j) {
  return safe_json_to_str(j);
}

// ── Logging ──────────────────────────────────────────────────────────────────

static constexpr bool kLogVerboseDebugMessages = false;

static void log_message(const std::string &msg,
                        fllama_log_callback logger = nullptr) {
  if (!logger) {
    fprintf(stderr, "%s\n", msg.c_str());
    fflush(stderr);
    return;
  }
  logger(dart_string(msg));
}

// While it exists, sends llama.cpp's log lines from this thread to the
// request's logger, and keeps the first error line. A model load runs on the
// request's thread, so its reason for failing is here.
class request_log_scope {
public:
  explicit request_log_scope(fllama_log_callback logger)
      : logger_(logger),
        scope_([this](enum ggml_log_level level, const char *text) {
          add(level, text ? text : "");
          return false; // Also to stderr.
        }) {}

  ~request_log_scope() { end_line(); }

  // The first error line that llama.cpp logged, or "".
  const std::string &first_error() const { return first_error_; }

  // Sends the line that llama.cpp has not ended. Call it before the request's
  // last callback: no log may reach Dart after it.
  void end_line() {
    if (!line_.empty()) {
      send(line_);
      line_.clear();
    }
  }

private:
  void add(enum ggml_log_level level, const std::string &text) {
    if (level != GGML_LOG_LEVEL_CONT) level_ = level;
    line_ += text;
    for (size_t end; (end = line_.find('\n')) != std::string::npos;) {
      send(line_.substr(0, end));
      line_.erase(0, end + 1);
    }
  }

  void send(const std::string &line) {
    if (line.empty()) return;
    if (level_ == GGML_LOG_LEVEL_ERROR && first_error_.empty()) {
      first_error_ = line;
    }
    if (logger_ && level_ >= GGML_LOG_LEVEL_INFO) {
      logger_(dart_string("[llama.cpp] " + line));
    }
  }

  fllama_log_callback logger_;
  enum ggml_log_level level_ = GGML_LOG_LEVEL_INFO;
  std::string line_;
  std::string first_error_;
  fllama_thread_log_scope scope_; // Last: it uses the members above.
};

// ── Callbacks ────────────────────────────────────────────────────────────────

// How a request ended: the arguments of its last callback.
struct inference_outcome {
  std::string content;
  std::string json;
  // Empty if the request did not fail. See fllama_inference_callback.
  std::string error_type;
  std::string error_message;

  void fail(std::string type, std::string message) {
    error_type = std::move(type);
    error_message = std::move(message);
  }
};

static void emit_update(fllama_inference_callback callback,
                        const std::string &content, const std::string &json) {
  if (!callback) return;
  callback(dart_string(content), json.empty() ? nullptr : dart_string(json),
           nullptr, 0);
}

static void emit_done(fllama_inference_callback callback,
                      const inference_outcome &outcome) {
  if (!callback) return;
  char *error = nullptr;
  if (!outcome.error_type.empty()) {
    error = dart_string(json_text({{"type", outcome.error_type},
                                   {"message", outcome.error_message}}));
  }
  callback(dart_string(outcome.content),
           outcome.json.empty() ? nullptr : dart_string(outcome.json), error,
           1);
}

// ── Sampling ─────────────────────────────────────────────────────────────────

// The sampling settings that a GGUF file recommends (general.sampling.*),
// on top of llama.cpp's defaults. llama-server starts every request from
// these. common_init_sampler_from_model() in common.cpp does the same, but it
// is static.
static common_params_sampling model_sampling(const llama_model *model) {
  common_params_sampling s;
  auto meta = [&](llama_model_meta_key key, std::string &out) {
    char buf[512] = {0};
    if (llama_model_meta_val_str(model, llama_model_meta_key_str(key), buf,
                                 sizeof(buf)) <= 0) {
      return false;
    }
    out = buf;
    return true;
  };
  auto get_int = [&](llama_model_meta_key key, int32_t &dst) {
    std::string v;
    if (!meta(key, v)) return;
    char *end = nullptr;
    const long n = strtol(v.c_str(), &end, 10);
    if (end != v.c_str()) dst = (int32_t)n;
  };
  auto get_float = [&](llama_model_meta_key key, float &dst) {
    std::string v;
    if (!meta(key, v)) return;
    char *end = nullptr;
    const float f = strtof(v.c_str(), &end);
    if (end != v.c_str()) dst = f;
  };

  std::string sequence;
  if (meta(LLAMA_MODEL_META_KEY_SAMPLING_SEQUENCE, sequence)) {
    const auto names = string_split<std::string>(sequence, ';');
    if (!names.empty()) s.samplers = common_sampler_types_from_names(names);
  }
  get_int(LLAMA_MODEL_META_KEY_SAMPLING_TOP_K, s.top_k);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_TOP_P, s.top_p);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_MIN_P, s.min_p);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_XTC_PROBABILITY, s.xtc_probability);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_XTC_THRESHOLD, s.xtc_threshold);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_TEMP, s.temp);
  get_int(LLAMA_MODEL_META_KEY_SAMPLING_PENALTY_LAST_N, s.penalty_last_n);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_PENALTY_REPEAT, s.penalty_repeat);
  get_int(LLAMA_MODEL_META_KEY_SAMPLING_MIROSTAT, s.mirostat);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_MIROSTAT_TAU, s.mirostat_tau);
  get_float(LLAMA_MODEL_META_KEY_SAMPLING_MIROSTAT_ETA, s.mirostat_eta);
  return s;
}

// ── Globals ──────────────────────────────────────────────────────────────────

// Intentionally leaked — avoids static destruction order crash on exit.
// (ggml Metal statics may be destroyed before g_mgr's destructor runs,
//  causing ggml_abort when server_context tries to free Metal resources.)
static ServerManager &g_mgr = *new ServerManager();

static void fllama_copy_cstr(char * dst, size_t cap, const char * src) {
  if (dst == nullptr || cap == 0) {
    return;
  }
  std::snprintf(dst, cap, "%s", src ? src : "");
}

static bool fllama_error_requires_backend_recreation(const std::string &msg) {
  // llama.cpp reports Metal command-buffer OOM / poisoned backend failures to
  // callers as a generic "Compute error.".  Once the backend is in that state,
  // the fix is to destroy and recreate the server_context rather than retrying
  // on the same context.
  return msg.find("Compute error") != std::string::npos ||
         msg.find("backend is in error state") != std::string::npos ||
         msg.find("failed to compute graph") != std::string::npos ||
         msg.find("failed to decode") != std::string::npos ||
         msg.find("OutOfMemory") != std::string::npos ||
         msg.find("out of memory") != std::string::npos;
}

// The fllama error type of an error result from llama.cpp's server code.
static std::string error_type_of_server_error(const json &e,
                                              const std::string &message) {
  if (fllama_error_requires_backend_recreation(message)) return "backend";
  const std::string type = e.value("type", "");
  if (type == "exceed_context_size_error") return "exceed_context_size";
  // Requests that fill the shared (unified) context together. llama.cpp
  // sends this as a server error; the web runtime matches the same text.
  if (message.find("Context size has been exceeded") != std::string::npos) {
    return "exceed_context_size";
  }
  if (type == "invalid_request_error") return "invalid_request";
  return "other";
}

// ── The actual inference logic (runs on per-request thread) ──────────────────

// Runs [request] up to its last result. Sets [outcome], and sends updates on
// the way. Does not send the last callback.
static void run_inference_body(const fllama_inference_request &request,
                               fllama_inference_callback callback,
                               request_log_scope &llama_logs,
                               inference_outcome &outcome) {
    const int64_t t0 = ggml_time_ms();
    const int rid = request.request_id;
    log_message("[fllama] Inference start", request.dart_logger);

    // One-time backend init.
    fllama_backends_init_once();

    // ── 1. Build common_params ────────────────────────────────────────

    common_params params;
    params.model.path       = request.model_path;
    // 0 is the model's trained context size. n_batch and n_ubatch keep
    // llama-server's defaults (2048, 512); llama.cpp limits n_batch to n_ctx.
    params.n_ctx            = request.context_size;
    params.flash_attn_type  = LLAMA_FLASH_ATTN_TYPE_AUTO;
    params.n_parallel       = ServerManager::DEFAULT_N_PARALLEL;
    // One KV cache shared by the slots, as llama-server does by default.
    // Without it each slot gets n_ctx / n_parallel, so one request could use
    // only a quarter of the context the user chose.
    params.kv_unified       = true;
    params.n_predict        = request.max_tokens;
    // Not set (<= 0): one thread per physical core, minus one for the app
    // and the OS, as fllama's default. A thread count that the app sets is
    // used as it is.
    params.cpuparams.n_threads     = request.num_threads > 0
        ? request.num_threads
        : std::max(1, common_cpu_get_num_math() - 1);
    params.use_jinja = true;
    params.reasoning_format = COMMON_REASONING_FORMAT_AUTO;

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

    // GPU selection (ADR 004, D9). An unknown key falls back to Auto.
    const std::string gpu_device_key =
        request.gpu_device_key ? request.gpu_device_key : "";
    if (!gpu_device_key.empty()) {
      if (auto *dev = fllama_backends_find_device(gpu_device_key)) {
        params.devices = {dev, nullptr};
        log_message("[fllama] GPU: " + gpu_device_key, request.dart_logger);
      } else {
        log_message("[fllama] WARNING: GPU not found, using Auto: " +
                        gpu_device_key,
                    request.dart_logger);
      }
    }

    // Leave out GPUs that cannot run the ops of every model (a macOS VM's
    // paravirtual Metal device): llama.cpp would split the graph at nearly
    // every op, and the image encoder crashes. An empty list is every GPU.
    if (params.n_gpu_layers != 0) {
      // params.devices is NULL-terminated, as llama_model_params.devices.
      std::vector<ggml_backend_dev_t> candidates;
      for (auto *dev : params.devices) {
        if (dev != nullptr) candidates.push_back(dev);
      }
      if (candidates.empty()) {
        candidates = fllama_backends_gpu_devices();
      }
      std::vector<ggml_backend_dev_t> usable;
      for (auto *dev : candidates) {
        if (fllama_backends_device_runs_models(dev)) {
          usable.push_back(dev);
        } else {
          log_message("[fllama] GPU skipped, it cannot run matrix multiply, "
                      "RMS norm and softmax: " +
                          fllama_backends_device_key(dev),
                      request.dart_logger);
        }
      }
      if (usable.size() != candidates.size()) {
        params.devices = usable;
        if (!params.devices.empty()) params.devices.push_back(nullptr);
      }
      if (!candidates.empty() && usable.empty()) {
        params.n_gpu_layers = 0;
        log_message("[fllama] No usable GPU: running on the CPU.",
                    request.dart_logger);
      }
    }

    if (request.model_mmproj_path && strlen(request.model_mmproj_path) > 0)
      params.mmproj.path = request.model_mmproj_path;
    // The image encoder follows the model: CPU only when no layer is on a GPU.
    params.mmproj_use_gpu = params.n_gpu_layers != 0;

    // Multi-Token Prediction (MTP) speculative decoding. When a drafter/
    // assistant GGUF is supplied (e.g. gemma-4-31B-it-assistant), wire it into
    // common_params.speculative; server_context handles the shared-KV draft
    // loop. Leave draft cache_type_k/v at their F16 defaults — Q8 KV cache was
    // shown to collapse MTP draft acceptance (llama.cpp#23398).
    if (request.draft_model_path && strlen(request.draft_model_path) > 0) {
      params.speculative.draft.mparams.path = request.draft_model_path;
      params.speculative.types = { COMMON_SPECULATIVE_TYPE_DRAFT_MTP };
      params.speculative.draft.n_max =
          request.draft_n_max > 0 ? request.draft_n_max : 3;
      if (request.draft_p_min >= 0.0f) {
        params.speculative.draft.p_min = request.draft_p_min;
      }
      log_message("[fllama] MTP draft enabled: n_max=" +
                      std::to_string(params.speculative.draft.n_max) +
                      ", p_min=" +
                      std::to_string(params.speculative.draft.p_min),
                  request.dart_logger);
      // Offload the (small) drafter alongside the target model.
      params.speculative.draft.n_gpu_layers = params.n_gpu_layers;
      params.speculative.draft.devices = params.devices;
    }

    // common_params is normally finalized by common_params_parse(), but fllama
    // constructs it directly. Keep the batch and speculative thread settings
    // in sync with the requested model threads just as llama.cpp's CLI does.
    // Leaving cpuparams_batch.n_threads at its sentinel value (-1) makes the
    // b10450 threadpool allocation wrap to nearly SIZE_MAX.
    postprocess_cpu_params(params.cpuparams, nullptr);
    postprocess_cpu_params(params.cpuparams_batch, &params.cpuparams);
    postprocess_cpu_params(params.speculative.draft.cpuparams,
                           &params.cpuparams);
    postprocess_cpu_params(params.speculative.draft.cpuparams_batch,
                           &params.cpuparams_batch);

    // ── 2. Get or create server_context ───────────────────────────────

    // Waits if the model is loaded with another context size and busy.
    auto *srv = g_mgr.get_or_create(
        request.model_path, params, request.dart_logger,
        [rid] { return g_mgr.is_cancelled(rid); });
    if (!srv || !srv->srv_ctx) {
      // Cancelled while waiting for the model: done with no output, as a
      // cancel during generation.
      if (!g_mgr.is_cancelled(rid)) {
        std::string message =
            std::string("Failed to load model ") + request.model_path;
        if (!llama_logs.first_error().empty()) {
          message += ": " + llama_logs.first_error();
        }
        outcome.fail("model_load", message);
      }
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

    auto *lctx = srv->srv_ctx->get_llama_context();
    auto *model = llama_get_model(lctx);
    auto *vocab = llama_model_get_vocab(model);

    // ── 3. Build the prompt ───────────────────────────────────────────

    std::string prompt = request.input ? request.input : "";
    bool is_oai = false;
    // The request after llama-server's /v1/chat/completions parse: the
    // prompt, and the fields of eval_llama_cmpl_schema.
    json body_parsed = json::object();
    // image_url parts of the messages, in order.
    std::vector<raw_buffer> files;
    // The chat's template, parser and message boundaries: the task and the
    // reader (which parses tool calls from the stream) use it.
    common_chat_session chat_session;

    if (request.openai_request_json_string) {
      is_oai = true;
      try {
        auto body = json::parse(request.openai_request_json_string);

        // fllama's top-level enable_thinking. llama-server reads it only
        // from chat_template_kwargs, which wins if both are set.
        if (body.contains("enable_thinking")) {
          if (body["enable_thinking"].is_boolean()) {
            auto &kwargs = body["chat_template_kwargs"];
            if (!kwargs.is_object()) kwargs = json::object();
            if (!kwargs.contains("enable_thinking")) {
              kwargs["enable_thinking"] = body["enable_thinking"];
            }
          }
          body.erase("enable_thinking");
        }

        const server_chat_params &chat = srv->meta->chat_params;
        if (body.contains("jinja_template") &&
            body["jinja_template"].is_string()) {
          // A template for this request only. One that cannot be parsed or
          // applied falls back to ChatML, and the logger says so.
          const auto jinja_tmpl = body["jinja_template"].get<std::string>();
          body.erase("jinja_template");
          common_chat_templates_ptr tmpls;
          try {
            tmpls = common_chat_templates_init(model, jinja_tmpl);
            std::map<std::string, std::string> empty;
            common_chat_format_example(tmpls.get(), true, empty);
          } catch (const std::exception &e) {
            log_message(std::string("[fllama] WARNING: the chat template "
                                    "cannot be used, so ChatML is used: ") +
                            e.what(),
                        request.dart_logger);
            tmpls = common_chat_templates_init(model, "chatml");
          }
          // By name: the field order of server_chat_params changes upstream.
          server_chat_params request_chat;
          request_chat.use_jinja                = chat.use_jinja;
          request_chat.prefill_assistant        = chat.prefill_assistant;
          request_chat.reasoning_format         = chat.reasoning_format;
          request_chat.chat_template_kwargs     = chat.chat_template_kwargs;
          request_chat.tmpls                    = std::move(tmpls);
          request_chat.allow_image              = chat.allow_image;
          request_chat.allow_audio              = chat.allow_audio;
          request_chat.allow_video              = chat.allow_video;
          request_chat.enable_thinking          = chat.enable_thinking;
          request_chat.reasoning_budget         = chat.reasoning_budget;
          request_chat.reasoning_budget_message = chat.reasoning_budget_message;
          request_chat.media_path               = chat.media_path;
          request_chat.force_pure_content       = chat.force_pure_content;
          body_parsed = oaicompat_chat_params_parse(vocab, body, request_chat,
                                                    files, chat_session);
        } else {
          body_parsed = oaicompat_chat_params_parse(vocab, body, chat, files,
                                                    chat_session);
        }
        prompt = body_parsed.at("prompt").get<std::string>();

        if constexpr (kLogVerboseDebugMessages) {
          log_message("[fllama] PROMPT (" + std::to_string(prompt.size()) +
                          " chars):\n" + prompt,
                      request.dart_logger);
        }
      } catch (const std::exception &e) {
        outcome.fail("invalid_request",
                     std::string("Invalid chat request: ") + e.what());
        return;
      }
    }

    // ── 4. Multimodal — extract base64 → raw bytes ───────────────────

    // fllama's <img> tags. Use them or image_url parts, not both: the
    // images must be in the order of their markers.
    if (fllama_prompt_contains_image(prompt)) {
      const char * media_marker = get_media_marker();
      auto img = fllama_extract_images(prompt, media_marker);
      prompt = std::move(img.text_with_markers);
      for (auto &fb : img.file_bytes)
        files.push_back(std::move(fb));
      log_message("[fllama] Extracted " +
                      std::to_string(files.size()) + " image(s) using marker " +
                      media_marker,
                  request.dart_logger);
    }

    // ── 5. Create & post the server task ──────────────────────────────

    auto reader = srv->srv_ctx->get_response_reader();

    server_task task(SERVER_TASK_TYPE_COMPLETION);
    task.id         = reader.get_new_id();
    task.index      = 0;

    // As llama-server: the request's fields over the server's defaults.
    // fllama's defaults: the sampling settings that the GGUF recommends,
    // then the request struct's fields. NaN is: not set.
    common_params params_base = params;
    params_base.sampling = model_sampling(model);
    if (!std::isnan(request.temperature))
      params_base.sampling.temp = request.temperature;
    if (!std::isnan(request.top_p))
      params_base.sampling.top_p = request.top_p;
    if (!std::isnan(request.penalty_freq))
      params_base.sampling.penalty_freq = request.penalty_freq;
    if (!std::isnan(request.penalty_repeat))
      params_base.sampling.penalty_repeat = request.penalty_repeat;
    body_parsed["stream"] = true;
    body_parsed["cache_prompt"] = true;
    try {
      task.params = server_schema::eval_llama_cmpl_schema(
          vocab, params_base, srv->meta->logit_bias_eog, body_parsed);
    } catch (const std::exception &e) {
      outcome.fail("invalid_request",
                   std::string("Invalid chat request: ") + e.what());
      return;
    }

    if (files.empty()) {
      // As llama-server: tokenize on the request thread, not on the thread
      // that runs every request, so a long prompt does not pause the others.
      // A chat also gives llama.cpp its message boundaries: hybrid and
      // recurrent models, such as Qwen 3.5, can then keep context
      // checkpoints at user messages, and reuse the cache up to an edited
      // message.
      task.cli = false;
      task.tokens = server_tokens(common_tokenize(vocab, prompt, true, true),
                                  !srv->mmproj_path.empty());
    } else {
      // With images, llama.cpp tokenizes the prompt: only it has the
      // multimodal context.
      task.cli        = true;
      task.cli_prompt = prompt;
      task.cli_files  = std::move(files);
    }

    if (is_oai) {
      task.params.res_type           = TASK_RESPONSE_TYPE_OAI_CHAT;
      task.params.oaicompat_model    = request.model_path;
      task.params.oaicompat_cmpl_id  = gen_chatcmplid();
    }

    // As llama-server: the chat's sampling, format, stops and message spans
    // (from the tokens; with images there are none yet).
    task.apply_chat_session(chat_session);
    std::vector<server_task> tasks;
    tasks.push_back(std::move(task));
    reader.post_tasks(std::move(tasks), chat_session);

    // ── 6. Read results, invoke callbacks ─────────────────────────────

    auto should_stop = [rid] { return g_mgr.is_cancelled(rid); };

    std::string full_content;
    std::string last_json;

    while (reader.has_next()) {
      // As llama-server: check before each read. reader.next() checks only
      // while it waits, so while tokens stream it never would.
      if (should_stop()) {
        reader.stop();
        break;
      }
      // As llama-server: an exception while reading a result, such as a reply
      // that does not parse as the chat format, ends the request with an
      // error. The text so far is kept.
      server_task_result_ptr res;
      try {
        res = reader.next(should_stop);
      } catch (const std::exception &e) {
        outcome.content = full_content;
        outcome.fail("other", e.what());
        return;
      }
      if (!res) break;

      if (res->is_error()) {
        auto ej = res->to_json();
        std::string msg = ej.contains("message") && ej["message"].is_string()
                              ? ej["message"].get<std::string>()
                              : json_text(ej);
        const std::string type = error_type_of_server_error(ej, msg);
        if (type == "backend") {
          log_message("[fllama] Backend compute error; marking context "
                      "unhealthy so the next request recreates it",
                      request.dart_logger);
          g_mgr.mark_unhealthy(request.model_path);
        }
        outcome.content = full_content;
        outcome.fail(type, msg);
        return;
      }

      auto *partial =
          dynamic_cast<server_task_result_cmpl_partial *>(res.get());
      if (partial) {
        full_content += partial->content.text;
        auto j = res->to_json();
        if (!j.is_null()) {
          last_json = json_text(j);
          emit_update(callback, full_content, last_json);
        }
        continue;
      }

      auto *final_r =
          dynamic_cast<server_task_result_cmpl_final *>(res.get());
      if (final_r) {
        // Keep accumulated full_content — final_r->content can be
        // empty or corrupted for tool-call / reasoning completions.
        outcome.content = full_content;
        try {
          auto j = res->to_json();
          last_json = j.is_null() ? "" : json_text(j);
        } catch (const std::exception &e) {
          outcome.fail("other", e.what());
          return;
        }
        outcome.json = last_json;
        log_message("[fllama] Done. " +
                        std::to_string(final_r->n_decoded) + " tok, " +
                        std::to_string(ggml_time_ms() - t0) + " ms",
                    request.dart_logger);
        return;
      }
    }

    // Cancelled or exhausted without final result. The last callback has no
    // JSON: the chunk of the last update was already sent.
    outcome.content = full_content;
    log_message("[fllama] Done. Stopped after " +
                    std::to_string(full_content.size()) + " chars, " +
                    std::to_string(ggml_time_ms() - t0) + " ms",
                request.dart_logger);
}

// Runs a request on its own thread. The last callback is the last thing that
// uses [request] and its logger: then Dart frees the request's strings and
// closes the callbacks.
static void run_inference(fllama_inference_request request,
                          fllama_inference_callback callback) {
  inference_outcome outcome;
  {
    request_log_scope llama_logs(request.dart_logger);
    try {
      run_inference_body(request, callback, llama_logs, outcome);
    } catch (const std::exception &e) {
      outcome.fail("other", e.what());
    } catch (...) {
      outcome.fail("other", "Unknown exception");
    }
    if (!outcome.error_type.empty()) {
      log_message("[fllama] Failed (" + outcome.error_type +
                      "): " + outcome.error_message,
                  request.dart_logger);
    }
    llama_logs.end_line();
  }
  g_mgr.clear_cancel(request.request_id);
  g_mgr.unregister_request_thread();
  emit_done(callback, outcome);
}

// ── FFI entry points ─────────────────────────────────────────────────────────

extern "C" {

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT int fllama_new_request_id(void) {
  static std::atomic<int> next_id{1};
  return next_id.fetch_add(1);
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT int fllama_set_gpu_allowed(
    uint8_t allowed) {
  return fllama_backends_set_gpu_allowed(allowed != 0) ? 0 : 1;
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char *
fllama_get_loaded_backends(void) {
  // A GPU pack can add a backend later, so read the list on every call.
  thread_local std::string loaded;
  loaded = fllama_backends_loaded_files();
  return loaded.c_str();
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char *
fllama_get_gpu_pack_files(void) {
  static const std::string json = fllama_backends_gpu_pack_files_json();
  return json.c_str();
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT const char *
fllama_load_gpu_pack(const char *pack, const char *directory) {
  thread_local std::string error;
  error = fllama_backends_load_gpu_pack(
      pack ? pack : "", directory ? directory : "",
      [] { return g_mgr.evict_all_idle(); });
  return error.empty() ? nullptr : error.c_str();
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT uint8_t fllama_has_vulkan_gpu(void) {
  return fllama_backends_has_vulkan_gpu() ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT uint8_t fllama_has_cuda_gpu(void) {
  return fllama_backends_has_cuda_gpu() ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT int fllama_get_gpu_device_count(void) {
  return static_cast<int>(fllama_backends_gpu_devices().size());
}

EMSCRIPTEN_KEEPALIVE FFI_PLUGIN_EXPORT int fllama_get_gpu_memory_info(
    int gpu_index,
    struct fllama_gpu_memory_info * out_info) {
  if (out_info == nullptr) {
    return 1;
  }

  std::memset(out_info, 0, sizeof(*out_info));

  if (gpu_index < 0) {
    return 2;
  }

  auto devices = fllama_backends_gpu_devices();
  if (static_cast<size_t>(gpu_index) >= devices.size()) {
    return 3;
  }

  auto * dev = devices[static_cast<size_t>(gpu_index)];
  ggml_backend_dev_props props{};
  ggml_backend_dev_get_props(dev, &props);

  size_t total = props.memory_total;
  size_t free = props.memory_free;

  // Metal reports free as recommendedMaxWorkingSetSize - currentAllocatedSize.
  // If currentAllocatedSize exceeds the recommendation, the backend can
  // underflow the unsigned subtraction. Clamp that to zero here.
  if (total == 0) {
    free = 0;
  } else if (free > total) {
    free = 0;
  }

  out_info->device_index = gpu_index;
  out_info->total_bytes = static_cast<uint64_t>(total);
  out_info->free_bytes = static_cast<uint64_t>(free);
  fllama_copy_cstr(out_info->name, sizeof(out_info->name), props.name);
  fllama_copy_cstr(
      out_info->description,
      sizeof(out_info->description),
      props.description);
  fllama_copy_cstr(
      out_info->device_id,
      sizeof(out_info->device_id),
      props.device_id);
  fllama_copy_cstr(
      out_info->backend,
      sizeof(out_info->backend),
      ggml_backend_reg_name(ggml_backend_dev_backend_reg(dev)));
  fllama_copy_cstr(
      out_info->device_type,
      sizeof(out_info->device_type),
      props.type == GGML_BACKEND_DEVICE_TYPE_IGPU ? "IGPU" : "GPU");
  fllama_copy_cstr(
      out_info->device_key,
      sizeof(out_info->device_key),
      fllama_backends_device_key(dev).c_str());
  return 0;
}

EMSCRIPTEN_KEEPALIVE void fllama_inference(fllama_inference_request request,
                                           fllama_inference_callback callback) {
  g_mgr.start_request_thread([request, callback] {
    run_inference(request, callback);
  });
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
