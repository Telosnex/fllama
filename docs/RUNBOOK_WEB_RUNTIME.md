# Runbook: Rebuilding the fllama Web Runtime

This runbook documents the operational steps for a web llama.cpp deploy.

## Paths used below

```bash
export FLLAMA_DIR=/path/to/fllama
export WLLAMA_DIR=/path/to/ngxson_wllama
export TELOSNEX_DIR=/path/to/telosnex
```

## Source of truth

- Upstream `ngxson/wllama` builds the browser runtime and wasm artifacts.
- fllama packages those artifacts under `assets/web/wllama`.

Current known-good wllama state:

| Repo | Branch | Commit |
| --- | --- | --- |
| `https://github.com/ngxson/wllama` | `master` | `e8e134f Add support for async file read (#221)` |

## Build prerequisites

- Docker or OrbStack running if rebuilding wasm
- Node/npm dependencies installed in `$WLLAMA_DIR`

Install dependencies if needed:

```bash
cd "$WLLAMA_DIR"
npm install
```

## Rebuild wllama artifacts

From wllama:

```bash
cd "$WLLAMA_DIR"

npm run build:wasm
npm run build:worker
npm run build:tsup
```

wllama v3 uses a single wasm build that can support single-threaded, multi-threaded, and WebGPU execution at runtime. The package bridge should therefore point at `default`, not legacy JSPI/Asyncify-specific asset keys.

## Copy artifacts into fllama

```bash
cd "$FLLAMA_DIR"

mkdir -p assets/web/wllama/wasm

cp "$WLLAMA_DIR/esm/index.js" \
  assets/web/wllama/index.js
cp "$WLLAMA_DIR/src/wasm/wllama.js" \
  assets/web/wllama/wasm/wllama.js
cp "$WLLAMA_DIR/src/wasm/wllama.wasm" \
  assets/web/wllama/wasm/wllama.wasm
```

## Validate with the smoke harness

The Playwright smoke harness lives in its own directory:

```bash
cd "$FLLAMA_DIR/dev/web_smoke"
npm install
HEADLESS=1 npm run smoke:current -- --max-tokens=100 --ctx=4096
```

It serves the built Flutter example, opens Chrome, selects a local GGUF with the browser file picker, calls `fllamaChatWebJs()` directly, and writes `console.log` / `result.json` under `$FLLAMA_DIR/tmp/web_smoke_current`.

See `dev/web_smoke/README.md` for runtime comparison against older packaged wllama refs.

## Validate package consumption

After changing assets, build a consuming Flutter web app and verify assets land under:

```text
build/web/assets/packages/fllama/assets/web/
```

## Common pitfalls
.
- Do not move runtime assets back into `example/web/wllama`; package assets under `assets/web/wllama` are the source of truth.
- Do not use legacy JSPI/Asyncify path keys in `fllama_web_init.js`; upstream wllama v3 expects `{ default: '<wasm-url>' }`.
- Do not assume browser requests can run concurrently; the fllama JS bridge serializes them until batching is validated.
