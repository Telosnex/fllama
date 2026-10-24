# Audit worklog

Audit of 2026-10-23. Each item: a red test, the fix, then the test is green.

## Items

| # | Item | Test | Status |
|---|---|---|---|
| 1 | Android arm64 needs ARMv8.2 dotprod; no fallback | none (needs old-phone hardware) | open: needs a decision on CPU variants |
| 2 | Web `fllamaChat` sends an empty prompt | `test/web_runtime_test.dart` (prompt_n 28 → >70) | done |
| 3 | Web ignores top-level `enable_thinking` | `test/openai_request_test.dart` | done; sends both forms |
| 8 | Web file picker never returns on cancel | `test/web_runtime_test.dart` | done |
| 6 | Two requests can load the same model twice | | open |
| 7 | A busy, broken context gives "Failed to load model" | | open |
| 5 | `Message` has no `tool_call_id` | | open |
| 4 | Native chat parse is hand-written, not llama-server's | | open |
| m | Minor items | | open |

## Notes
- 2: web `fllamaInference` now runs `openAiRequestJsonString` as a chat, as
  native does. `FllamaInferenceRequest.nParallel` added (web only), so
  `fllamaChat` and `fllamaChatWeb` load the model with the same key.
- 3: native ignores `chat_template_kwargs` until item 4.
- Found: `fllamaChatWeb` passes no numThreads/numGpuLayers; web
  `requestGpuLayers` treats 0 as "all layers on GPU", native as CPU only.
