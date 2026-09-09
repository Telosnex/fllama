# fllama integration tests

These tests exercise the native library through the public Dart API. The main
suite verifies GGUF metadata/tokenization, streaming chat plus OpenAI-compatible
JSON, multimodal image recognition, and native error callbacks.

## Model

The CI suite uses the 508 MiB `Qwen3.5-0.8B-Q4_K_M.gguf` from the
[`telosnex/fllama`](https://huggingface.co/telosnex/fllama) Hugging Face repo.
Its 196 MiB multimodal projector is downloaded for the image test. The revision
and expected file sizes are pinned in `test/test_model_manager.dart`. Downloads
are written to temporary files and only promoted into the cache after their
sizes are validated.

The default cache is `example/.model_cache`. Override it with
`MODEL_CACHE_DIR`. Local files can seed an empty cache with
`QWEN_0_8B_MODEL_PATH` and `QWEN_0_8B_MMPROJ_PATH`; the corresponding
`QWEN_0_8B_MODEL_URL` and `QWEN_0_8B_MMPROJ_URL` variables override download
URLs.

## Run

From `example/`:

```bash
flutter pub get
flutter test -d macos integration_test/local_llm_integration_test.dart
```

Linux is also supported:

```bash
flutter test -d linux integration_test/local_llm_integration_test.dart
```

The Gemma 4 MTP suite is a separate, opt-in benchmark that requires the local
model paths documented in that test file.

## Codemagic

The integration coverage runs inside the existing Android, iOS, Linux, macOS,
web, and Windows workflows, before each workflow's app build. There is no
separate integration-test workflow.

All platform workflows cache `$CM_BUILD_DIR/.model_cache` and
`$HOME/.cache/fllama`. A small Dart setup command validates/downloads Qwen and
its projector into the host cache. Desktop tests read those files directly;
mobile tests copy them over localhost into their app sandboxes; the Playwright
web smoke test selects the cached host files in Chrome.
