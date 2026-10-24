# Audit worklog

Audit of 2026-10-23. Each item: a red test, the fix, then the test is green.

## Items

| # | Item | Test | Status |
|---|---|---|---|
| 1 | Android arm64 needs ARMv8.2 dotprod; no fallback | hook: `build_hook_split_test.dart`; integration: loaded backend is `android_armv*`; disassembly scan | done: all 7 ggml Android variants |
| 2 | Web `fllamaChat` sends an empty prompt | `test/web_runtime_test.dart` (prompt_n 28 → >70) | done |
| 3 | Web ignores top-level `enable_thinking` | `test/openai_request_test.dart` | done; sends both forms |
| 8 | Web file picker never returns on cancel | `test/web_runtime_test.dart` | done |
| 6 | Two requests can load the same model twice | integration: `loads a model once ... when requests race` | done. Worse than audited: the 2nd request deadlocked (recursive get_or_create under model_load_mutex) |
| 7 | A busy, broken context gives "Failed to load model" | none: needs a GPU fault | done: waits, as for a settings change |
| 5 | `Message` has no `tool_call_id` | `test/openai_request_test.dart` | done |
| 4 | Native chat parse is hand-written, not llama-server's | integration: stop, seed, JSON schema, grammar; web: grammar | done |
| m | Minor items | integration: `fllamaTokenize throws` | partly done; see notes |

## Notes
- 2: web `fllamaInference` now runs `openAiRequestJsonString` as a chat, as
  native does. `FllamaInferenceRequest.nParallel` added (web only), so
  `fllamaChat` and `fllamaChatWeb` load the model with the same key.
- 3: native ignores `chat_template_kwargs` until item 4.
- Found: `fllamaChatWeb` passes no numThreads/numGpuLayers; web
  `requestGpuLayers` treats 0 as "all layers on GPU", native as CPU only.
- 6: the red run timed out after 5 min. The racing request held
  model_load_mutex, found the other context busy, and recursed into
  get_or_create, which locks model_load_mutex again. get_or_create is now a
  loop; a request loads only when it holds the mutex and finds no context.
- 4: fllama.cpp uses oaicompat_chat_params_parse and eval_llama_cmpl_schema,
  as wllama and llama-server do. ServerResources keeps get_meta() from
  before the loop thread starts. Top-level enable_thinking is moved into
  chat_template_kwargs. New Dart fields: seed, stop, jsonSchema, grammar.
  An unset seed is now LLAMA_DEFAULT_SEED (random in llama.cpp).
- Full native integration file: 24 pass, 3 skipped (macOS).
- Minor, done: fllamaTokenize throws when the model does not load (it
  returned -1 as a count); a request thread is listed before it runs;
  tokenize globals are static; EOS/BOS no longer printf on every call;
  analysis_options excludes tmp/. Full native file: 25 pass, 3 skipped.
- Minor, not done:
  - n_ctx 0 sets n_batch 0. Dart never sends 0; llama.cpp would then use
    the trained context (262144 for Qwen 3.5).
  - Web tokenize, chat template, BOS and EOS are stubs: a real one loads the
    model in wllama, which can unload the model of a running chat.
  - Web reasoning text in `response`; native returns raw think tags.
  - Two web chats for different models at once can unload each other.
  - DISABLE_SERVER_REQUEST_QUEUE dead code; codemagic.yaml unused.
  - fllamaChatWeb passes no numThreads/numGpuLayers.
- 1: Android arm64 splits (BUILD_SHARED_LIBS, GGML_BACKEND_DL,
  GGML_CPU_ALL_VARIANTS), with no global -march. fllama dlopens the variant
  names that CMake lists, since the libraries can be inside the APK.
  Sizes: 16.8 MB installed, 6.5 MB gzipped (was 11.1 / 4.3).
  Disassembly: old libfllama.so has 907 sdot; fllama, llama, ggml,
  ggml-base, mtmd and armv8.0_1 have no dotprod/fp16/i8mm/SVE.
  Emulator (dotprod, fp16, SVE i8mm): loads android_armv8.2_2; full native
  file 25 pass, 3 skipped. A 2 GB AVD is OOM-killed by lmkd at the
  whole-context test; 4 GB passes. Not run on an ARMv8.0 phone.

## Full audit (second pass)

Fixed:
- Request IDs: each isolate counted from 0, and native keyed request
  threads by that ID. Two isolates (or a hot restart while a request runs)
  gave a duplicate key: emplace dropped a joinable std::thread, which is
  std::terminate. Red: integration `requests from two isolates both finish`
  (app died, test did not complete). Native now gives IDs
  (fllama_new_request_id) and keys threads by std::thread::id.
- Web: fllamaHasCudaGpu missing on web and in the stub (web compile error).
- Web: promises read with .then() into a Completer; a rejection left the
  Future pending forever. Now awaited.
- Web tokenize test passed against the 4-chars-per-token stub; renamed.
- Web cancel: test added; it already ended with no error.
- Stale docs: fllamaLoadedBackendFiles, fllama_backends.h (Android arm64).

Checked, no change:
- GGML_NATIVE is OFF on every target (CMakeCache). macOS x86_64 has no
  AVX/AVX2 (slow, safe).
- image_url http: the download stub returns status 0, so llama.cpp rejects
  it; file:// is rejected without media_path. No network or file access.

## Full audit: follow-up fixes

Each red, then green:
- 1: reader.next() threw (reply not in the chat format) and the request
  ended with no error. Now `other`, as llama-server. Red: a GPT-OSS-like
  jinja_template on Qwen (a cut-off tool call parses leniently, so not that).
- 2: numThreads was not a load-time param. Now n_threads and
  n_threads_batch are; a change reloads, as web's model key does.
- 7: the download stub had 2 stale signatures and 2 stale structs. Now only
  common_remote_get_content (the one symbol linked objects use, from nm),
  with a static_assert on its type. test/download_stub_test.dart compiles it.
- 8: n_batch = min(n_ctx, 2048) made n_ctx 0 fail ("n_batch and n_ubatch
  cannot both be zero"). Now llama-server's defaults. A cancelled waiter
  left the context retiring; now retire_waiters counts waiters.
- 4 (web): chat never sent numGpuLayers to JS; 0 was 99999; contextSize 0
  was 4096. Now as native. Telosnex passes 0 on web: it must pass -1.
- 5 (web): delete matched by substring and unloaded a busy model. Now an
  exact match, after running requests finish. Also: fllamaWebModelDelete
  never completed (JSPromise<JSAny> resolved with undefined).
- hook: publish kept the old library when the cache entry had the same
  size and an older time (Mach-O pads to pages). Found when the old-code
  red run still had the new code. Now compares bytes.
- 3: removed fllamaChatTemplateGet, fllamaBosTokenGet, fllamaEosTokenGet
  (no users; native freed malloc memory with calloc.free).

Not done: 6 (Intel Mac CPU variants). Rosetta here has SSE4.2 only.

## Audit 3

- 2: "Context size has been exceeded." (shared unified context, a server
  error in llama.cpp) is now exceed_context_size, as on web. Red: 4 requests
  in 512 tokens, each with a 400-token grammar: all `other`.
- 3: every request without images is tokenized on its request thread. Red:
  a 1.2M-token plain prompt paused a running request 687 ms; now 12 ms.
  Image prompts stay on the loop thread: llama.cpp keeps its mtmd context
  private (server_context_impl).
- Cleanup: removed fllamaSanitizeChatTemplate, chatMlTemplate,
  DISABLE_SERVER_REQUEST_QUEUE; fllama_tokenize counts with a null buffer
  and returns (size_t)-1 on overflow, not 0; slot waiters remove their abort
  listener; README: no Codemagic badges, no Feb 2024 notes, current
  numGpuLayers/contextSize meanings, no 2024 model list.
- 1: Linux arm64 splits like Android arm64: ggml's 8 Linux armv* variants,
  no GPU backend (usesGpuBackends). GCC 11 (Ubuntu 22.04, the release
  runner) fails on -march=armv9.2-a+sme; clang 14, 15 and 19 build all 8.
  native_toolchain_cmake's aarch64 toolchain file sets GCC and overrides a
  -DCMAKE_C_COMPILER, so the hook passes src/cmake/linux-arm64-clang
  .toolchain.cmake after it. CI installs clang for linux-arm64.
  Checked in an arm64 ubuntu:22.04 container with `native_prebuilt:build
  --target linux-arm64`: 13 files, RUNPATH $ORIGIN, GLIBC <= 2.34 and
  GLIBCXX <= 3.4.30 (as the old release); fllama/llama/ggml/mtmd/armv8.0
  have no sdot/i8mm/SVE/fp16. The VM (dotprod, fp16) loads armv8.2_2:
  prompt 200 -> 490-520 tok/s, generation 89 -> 138-150 tok/s, against the
  armv8.0 variant alone. Size: 19.1 MB (was 11.9 MB). Not run: the Flutter
  integration test on Linux arm64, a real Pi.
- Removed Codemagic: codemagic.yaml, scripts/configure_windows_ci.ps1 (its
  only user). Kept serve_test_models.dart and boot_ios_simulator.dart for
  local mobile runs. GitHub Actions runs only the web runtime tests; the
  native integration tests are local now.
