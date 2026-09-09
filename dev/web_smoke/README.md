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

## Run the basic suite

Run all basic smoke cases sequentially:

```bash
cd dev/web_smoke
HEADLESS=1 npm run smoke:suite
```

Run a subset by id:

```bash
HEADLESS=1 npm run smoke:suite -- --only=bare_hi,image_title
```

Run individual cases directly if needed:

```bash
HEADLESS=1 npm run smoke:bare-hi
HEADLESS=1 npm run smoke:mmproj-hi
HEADLESS=1 npm run smoke:image-title
HEADLESS=1 npm run smoke:multiimage-title
```

Cases:

1. bare model asked to respond to `hi`
2. two concurrent bare-model chat variants
3. bare model + bare mmproj asked to respond to `hi`
4. model + mmproj + a solid-red image; expects `red`
5. model + mmproj + `fllama_header.png` image, prompted: `Do not think. Respond with one word only, the title in the image.` at temperature `0`; expects an OCR-like `FLLAMA` / `FLLLAMA` match
6. model + mmproj + `test/assets/test_apple.png` and `test/assets/test_orange.png`, prompted to read both words in order; expects `apple ... orange`

The mmproj/image scripts use these defaults:

```text
$HOME/Downloads/qwens/Qwen3.5-0.8B-mmproj-F16.gguf
fllama_header.png
test/assets/test_apple.png
test/assets/test_orange.png
```

Override with `FLLAMA_SMOKE_MMPROJ=/path/to/mmproj.gguf` or `--mmproj=/path/to/mmproj.gguf`. Passing `--mmproj=default` uses the default mmproj path above. Override single-image input with `FLLAMA_SMOKE_IMAGE=/path/to/image.png` or `--image=/path/to/image.png`; `--image=default` uses `fllama_header.png`. Override multi-image input with comma-separated `FLLAMA_SMOKE_IMAGES=/path/a.png,/path/b.png` or `--images=/path/a.png,/path/b.png`; `--images=default` uses the apple/orange test assets.

## CI correctness versus local benchmarks

The Codemagic web workflow runs `bare_hi` and `solid_red` through WebGPU on an
Apple-silicon macOS worker, with one inference slot and a bounded ten-minute
request timeout (including model load and image encoding). Both cases disable
thinking through
`chat_template_kwargs.enable_thinking=false` and check actual answer content.
The red-image case must still answer `red` (optional trailing punctuation).

Throughput is recorded but is **not** a correctness assertion because shared CI
performance varies. To opt into the old benchmark floor, use
`--min-tokens-per-second=20` or `FLLAMA_SMOKE_MIN_TOKENS_PER_SECOND=20`.

Additional overrides (environment variables also apply to `smoke:suite`):

- `--timeout-ms=600000` / `FLLAMA_SMOKE_TIMEOUT_MS` (default: 180000)
- `--gpu-layers=0` / `FLLAMA_SMOKE_NUM_GPU_LAYERS` (default: 99999)
- `--no-think` / `FLLAMA_SMOKE_NO_THINK=1`

Run the harness regression tests without models or a browser:

```bash
node --test dev/web_smoke/smoke_checks.test.mjs
```

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

Per-case files:

- `console.log` — browser console/native llama.cpp logs
- `result.json` — request result, timing chunks, support flags, and final text prefix

Suite files:

- `tmp/web_smoke_suite/summary.json` — full per-case results
- `tmp/web_smoke_suite/summary.compact.json` — compact pass/timing summary

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
