# Audit worklog

Audit of 2026-10-23. Each item: a red test, the fix, then the test is green.

## Items

| # | Item | Test | Status |
|---|---|---|---|
| 1 | Android arm64 needs ARMv8.2 dotprod; no fallback | none (needs old-phone hardware) | open: needs a decision on CPU variants |
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
