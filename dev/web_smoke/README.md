# fllama Web Smoke Harness

Playwright smoke tests for the packaged fllama web runtime. The harness serves the built Flutter example, opens Chrome, picks a local GGUF through `fllamaWebPickModelJs()`, calls `fllamaChatWebJs()` directly, and writes console/result artifacts.

Default model:

```text
$HOME/Downloads/qwens/Qwen3.5-0.8B-Q4_K_M.gguf
```

Override with `FLLAMA_SMOKE_MODEL=/path/to/model.gguf` or `--model=/path/to/model.gguf`.

## Setup

```bash
cd dev/web_smoke
npm install
```

Build the example once, or pass `--build` to the smoke command:

```bash
cd example
flutter build web --debug
```

## Run current working-tree runtime

```bash
cd dev/web_smoke
HEADLESS=1 npm run smoke:current -- --max-tokens=100 --ctx=4096
```

This overlays the current `assets/web/fllama_web_init.js` and `assets/web/wllama` into `example/build/web/assets/packages/fllama/assets/web` before serving the app.

## Compare against legacy packaged runtime

```bash
HEADLESS=1 npm run smoke:legacy -- \
  --legacy-ref=cdebf09 \
  --max-tokens=500 \
  --ctx=4096 \
  --out=../../tmp/web_smoke_cdebf09_500
```

`--legacy-ref` can be any git ref that contains the old packaged web assets.

## Outputs

By default, outputs are written under:

```text
tmp/web_smoke_<runtime>/
```

Files:

- `console.log` — browser console/native llama.cpp logs
- `result.json` — request result, timing chunks, support flags, and final text prefix

Useful result fields:

- `finalTimings.predicted_per_second`
- `finalTimings.prompt_per_second`
- `support.hasWebGpu`
- `support.crossOriginIsolated`
- `chunkCount`
- `finalTextLength`

## Notes

- Run commands from the fllama repository root unless a command explicitly changes directories.
- The harness mutates `example/build/web/assets/packages/fllama/assets/web` by overlaying runtime assets. Rebuild the example or rerun the desired runtime before manual browser testing.
- `HEADLESS=0` opens a visible browser.
- Use `--model=/path/to/model.gguf` to test a different local GGUF.
- 100 tokens/sec with Qwen3.5-0.8B-Q4_K_M.gguf is baseline (26-05-20, MacBook Pro M4 Max)
