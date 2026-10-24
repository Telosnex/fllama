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

## Mobile devices

Mobile apps cannot read the host's files. Serve the cached models with the
Dart-only `scripts/serve_test_models.dart` HTTP server, and pass its URL:

```sh
dart scripts/serve_test_models.dart example/.model_cache 127.0.0.1 8765
cd example
flutter test integration_test/local_llm_integration_test.dart -d emulator-5554 \
  --dart-define=FLLAMA_TEST_MODEL_BASE_URL=http://10.0.2.2:8765 \
  --dart-define=FLLAMA_TEST_NUM_GPU_LAYERS=0
```

An Android emulator reaches the host at `10.0.2.2`; an iOS simulator at
`127.0.0.1`. Give the emulator 4 GB of RAM: with 2 GB, Android stops the app
during the whole-context test. For iOS, `scripts/boot_ios_simulator.dart
--fresh` creates a new temporary iPhone, waits until it has booted, and deletes
it afterward.

The web smoke suite checks correctness rather than imposing a throughput floor.
It runs through WebGPU on an Apple-silicon macOS worker and allows up to ten
minutes per request. See `dev/web_smoke/README.md` for optional benchmark
settings.
