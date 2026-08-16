# ADR 003 — llama.cpp / wllama provenance

Status: accepted (updated 2026-08-15)

This documents what fllama's native and web llama.cpp runtimes are made of and
how to reproduce them. Keep it current whenever either runtime is refreshed.

---

## 1. Current runtime

fllama runs the same llama.cpp source two ways:

- **Native** compiles the plain vendored copy at `src/llama.cpp`.
- **Web** ships a custom wllama bundle at:
  ```text
  assets/web/wllama/index.js
  assets/web/wllama/wasm/wllama.js
  assets/web/wllama/wasm/wllama.wasm
  ```

The current llama.cpp source is the upstream `master` tip fetched for this
refresh:

```text
ece963f41b0b02d7a0d61436ae365762c073a4c8
ui: mask API Key field in settings and error splash to stop browser a… (#26562)
```

The nearest upstream tag is `b10448`. `git rev-list --count HEAD` is `10450`, so
the generated wllama bundle identifies itself as:

```text
LIBLLAMA_VERSION = "b10450-ece963f"
```

This deliberately overrides wllama 3.5.1's stale llama.cpp submodule pin
`dd4623a74` (`b9637`). Native and web both use `ece963f41`.

---

## 2. Source lineage

### 2a. wllama parent

The latest upstream wllama ref available when this refresh was made was:

```text
ngxson/wllama 3.5.1
766d28e03eeac044fe055327d06b83d3f9b84544
fix compat CDN build (#254)
```

The shipped bundle is `766d28e` plus the fllama patch:

```text
docs/patches/WLLAMA_3_5_1_LLAMA_B10450.patch
```

That patch is the reproducible source of all non-generated wllama changes. It
also changes the llama.cpp gitlink from wllama's `dd4623a74` pin to
`ece963f41`.

The integration checkout used for this drop was:

```text
/Users/jpo/dev/fllama/tmp/wllama-refresh
```

The older `/Users/jpo/dev/ngxson_wllama` checkout was intentionally left
untouched because it contained uncommitted prior-build changes.

### 2b. llama.cpp

```text
upstream: https://github.com/ggerganov/llama.cpp
commit:   ece963f41b0b02d7a0d61436ae365762c073a4c8
nearest tag: b10448
```

There are no Telosnex patches in `src/llama.cpp`. The source tree is an exact
copy of that commit, apart from the fllama-owned provenance file
`src/llama.cpp/FLLAMA_LLAMA_CPP_DROP.txt` and ignored build metadata.

### 2c. Artifact fingerprints

| fllama path | Bytes | SHA-256 |
|-------------|------:|---------|
| `assets/web/wllama/index.js` | 310337 | `4a58f9247ded1b6cfc49a61a94faca709d60cb5d0489ed74ba97aa10190ea583` |
| `assets/web/wllama/wasm/wllama.js` | 138604 | `eb2adba824b0c41ed7c24d19ae91a83de5a08b2145b75355af2502eb497c0baa` |
| `assets/web/wllama/wasm/wllama.wasm` | 8523221 | `c6c13820c090724a6e3ce8defac7af9631e30821e07fd167ccb8c5d7b3e3513c` |

The hashes fingerprint the shipped files. They are not a claim that different
Docker, Emscripten, or Node versions produce byte-identical output.

---

## 3. Required wllama changes

All changes below are captured by
`docs/patches/WLLAMA_3_5_1_LLAMA_B10450.patch`.

### 3a. Request-ID parallel generation

The Telosnex feature originally introduced by wllama commit `afce0be` remains
required:

- multiple active `server_response_reader` instances keyed by request ID;
- `n_parallel` exposed through `LoadModelParams`;
- request IDs returned for completion, embedding, and rerank operations;
- abandoned reader cleanup;
- serialized JSPI worker exports with interleaved `get_result` polling;
- per-request Jinja templates, allowing differently templated requests to share
  one continuously batched server context.

The forward port retains wllama 3.5.1's rerank and backend-test APIs. Rerank now
uses the same request-ID reader lifecycle as completion and embedding.

### 3b. Browser build options

`WLLAMA_LINK_OPTIONS` includes:

```cmake
-sSTACK_SIZE=16MB
-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=_localtime_js
```

The larger stack prevents Gemma4 tool/response-format grammar stack exhaustion.
The libtime option force-includes Emscripten's canonical `_localtime_js` import
for upstream `std::localtime` / `strftime` paths.

### 3c. llama.cpp b10450 API forward port

wllama 3.5.1 predates several llama.cpp APIs used by `ece963f41`. The patch:

- builds and calls `server-schema.cpp` /
  `server_schema::eval_llama_cmpl_schema`;
- maps the old `use_mmap` / `use_mlock` booleans to `llama_load_mode`;
- preserves the newer `allow_video` chat parameter;
- adapts `server_queue::callback_new_task` to its boolean/two-argument API;
- executes `yield_to_queue` work inline and leaves `worker_stop` empty because
  the browser advances one native server-loop iteration per serialized JSPI
  `get_result` call and does not start the native queue worker.

### 3d. Build toolchain

The shipped WASM was built with the versions pinned by wllama 3.5.1:

```text
Emscripten SDK image: 4.0.20-arm64
Dawn WebGPU package:  v20260317.182325
Node:                 22.16.0
```

Only the default JSPI runtime was built for fllama (`SKIP_COMPAT=1`). fllama does
not bundle wllama's compatibility package.

---

## 4. fllama native adaptations

The native vendored source is upstream-only. fllama's own build glue was updated
to accommodate b10450:

- `src/CMakeLists.txt` records `LLAMA_BUILD_COMMIT = ece963f41`;
- the local `server-context` target now includes upstream `server-stream.cpp`,
  `server-tools.cpp`, `server-mcp.cpp`, and `server-schema.cpp`;
- tokenizer-only model loading uses `LLAMA_LOAD_MODE_MMAP`,
  `llama_model_load_from_file`, and `llama_model_free`;
- directly constructed `common_params` are CPU-postprocessed before model load,
  initializing the batch and speculative thread counts that otherwise retain
  the `-1` CLI sentinel and overflow b10450's threadpool allocation.

fllama still disables HTTP/CURL model downloads and supplies its existing
`cpp-httplib` INTERFACE shim plus `fllama_download_stub.cpp`. Production builds
target `fllama`, not llama.cpp's CLI/server executables.

---

## 5. Reproduce the web runtime

Start with a clean wllama 3.5.1 checkout. The patch requires exactly `766d28e`.

```sh
export FLLAMA=/Users/jpo/dev/fllama
export WLLAMA=/path/to/clean/wllama

cd "$WLLAMA"
git checkout --detach 766d28e03eeac044fe055327d06b83d3f9b84544
git submodule update --init

git apply --index \
  "$FLLAMA/docs/patches/WLLAMA_3_5_1_LLAMA_B10450.patch"
git -C llama.cpp fetch origin
git -C llama.cpp checkout ece963f41b0b02d7a0d61436ae365762c073a4c8
git add llama.cpp

grep -F -- '-sSTACK_SIZE=16MB' CMakeLists.txt
grep -F -- '-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=_localtime_js' CMakeLists.txt

npm ci
SKIP_COMPAT=1 npm run build:wasm
npm run build:worker
npx tsc --noEmit -p tsconfig.build.json
npm run build:tsup
```

Copy the generated runtime:

```sh
cd "$FLLAMA"
cp "$WLLAMA/esm/index.js" assets/web/wllama/index.js
cp "$WLLAMA/src/wasm/wllama.js" assets/web/wllama/wasm/wllama.js
cp "$WLLAMA/src/wasm/wllama.wasm" assets/web/wllama/wasm/wllama.wasm
```

Update the asset-version string in `assets/web/fllama_web_init.js` and its check
in `scripts/check_web_assets.sh` whenever the runtime files change.

---

## 6. Refresh native llama.cpp

Use the same submodule source used for the web build:

```sh
cd "$FLLAMA"
rsync -a --delete \
  --exclude='.git/' \
  --exclude='build/' \
  --exclude='.DS_Store' \
  --exclude='FLLAMA_LLAMA_CPP_DROP.txt' \
  "$WLLAMA/llama.cpp/" \
  "$FLLAMA/src/llama.cpp/"
```

Then update:

- `src/CMakeLists.txt` → `LLAMA_BUILD_COMMIT`;
- `src/llama.cpp/FLLAMA_LLAMA_CPP_DROP.txt`;
- this ADR and the wllama patch if the integration changes.

---

## 7. Validation for this drop

Completed on 2026-08-15:

```text
PASS  wllama WASM compile against ece963f41
PASS  wllama TypeScript no-emit check and ESM build
PASS  fllama native CMake target build on macOS arm64
PASS  packaged web asset checks
PASS  browser WebGPU single-request inference
PASS  browser WebGPU two-request interleaved streaming, n_parallel=2
PASS  browser WebGPU mixed per-request Jinja streaming
PASS  native Qwen3.5 27B Q4_K_M inference, reported 16K/2-thread request, Metal
```

Commands:

```sh
node --check assets/web/fllama_web_init.js
scripts/check_web_assets.sh
cmake -S src -B tmp/fllama-validate -DCMAKE_BUILD_TYPE=Release
cmake --build tmp/fllama-validate --target fllama -j

node dev/web_smoke/fllama_web_smoke.mjs \
  --build --runtime current --model /path/to/model.gguf

node dev/web_smoke/fllama_web_smoke.mjs \
  --runtime current --model /path/to/model.gguf \
  --concurrent 2 --n-parallel 2 --mixed-jinja
```

The full vendored upstream diff contains three trailing-blank-line warnings from
llama.cpp itself. Use `git diff --check -- . ':!src/llama.cpp'` for fllama-owned
files rather than editing the vendored source away from `ece963f41`.
