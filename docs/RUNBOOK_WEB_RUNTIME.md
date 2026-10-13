# Runbook: Rebuilding the fllama Web Runtime

The web runtime is wllama: `wllama/index.js`, `wllama/wasm/wllama.js` and
`wllama/wasm/wllama.wasm`. GitHub Actions builds it in the native release
workflow (native_prebuilt ADR 002). No developer machine makes a released
file.

## Source of truth

- `web_build/wllama.json`: the wllama and llama.cpp commits, the Dawn WebGPU
  package and its SHA-256, the emsdk image digest (Emscripten 4.0.20), and
  Node 22.16.0.
- `web_build/wllama.patch`: all fllama changes to wllama (ADR 003 §3).
- `tool/build_web.dart`: the build. It runs the steps of wllama's
  `build:wasm` (with `SKIP_COMPAT=1`), `build:worker` and `build:tsup`, and
  stops at the first failed step.
- `lib/web/fllama_web_init.js`: the hand-written bridge. It is in git.

All of these are inputs of the source key. A change to any of them makes a
new native release, and the release contains the web files.

## Rebuild

1. Change `web_build/wllama.json` or `web_build/wllama.patch`. If the
   llama.cpp commit changes, refresh `src/llama.cpp` too (ADR 003 §6).
2. Run the release workflow: `git push -f origin HEAD:native-release-dry`,
   then `HEAD:native-release`. The web job builds the files. The web-test
   job runs `scripts/check_web_assets.sh` and loads a model in Chrome
   (`test/web_runtime_test.dart`).
3. Merge the `native-manifest/<tag>` branch. It updates
   `native_artifacts/web.json` and `lib/src/web_runtime.g.dart`.

## Build and test locally

```bash
cd "$FLLAMA_DIR"
docker run --rm -v "$PWD:/src" -v /tmp/fllama_web:/out -w /src \
  "$(python3 -c 'import json;print(json.load(open("web_build/wllama.json"))["emsdkImage"])')" \
  bash -c 'dart tool/build_web.dart --out /out'
dart run native_prebuilt:web install-dev --from /tmp/fllama_web
scripts/check_web_assets.sh

mkdir -p test/web_models
curl -sSfL -o test/web_models/stories15M-q4_0.gguf \
  https://huggingface.co/ggml-org/models/resolve/main/tinyllamas/stories15M-q4_0.gguf
flutter test --platform chrome test/web_runtime_test.dart
```

The image needs Dart on the PATH. Without `--from`, `install-dev` downloads
the released files.

## Smoke test with a real model

```bash
cd "$FLLAMA_DIR/dev/web_smoke"
npm install
HEADLESS=1 npm run smoke:current -- --max-tokens=100 --ctx=4096
```

It serves the built Flutter example, overlays `lib/web/` into
`example/build/web/native_prebuilt/fllama/`, and calls `fllamaChatWebJs()`.
See `dev/web_smoke/README.md`.

## Common pitfalls

- Do not add runtime files to `example/web/` or a script tag to `index.html`; the build hook installs the files, and Dart loads the bridge.
- Do not use legacy JSPI/Asyncify path keys in `fllama_web_init.js`; upstream wllama v3 expects `{ default: '<wasm-url>' }`.
- Do not assume browser requests can run concurrently; the fllama JS bridge serializes them until batching is validated.
