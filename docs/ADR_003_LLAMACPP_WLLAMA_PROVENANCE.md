# ADR 003 — llama.cpp / wllama provenance

Status: accepted (updated 2026-06-09)

This documents what fllama's native and web llama.cpp builds are made of, where
those sources live, and which custom changes are required. The setup spans fllama,
wllama, and a vendored copy of llama.cpp, so keep this file current when refreshing
runtime artifacts.

---

## 1. The short version

fllama runs llama.cpp two ways:

- **Native** platforms compile the vendored source tree in this repo:
  ```text
  src/llama.cpp
  ```
- **Web** ships prebuilt wllama artifacts in this repo:
  ```text
  assets/web/wllama/index.js
  assets/web/wllama/wasm/wllama.js
  assets/web/wllama/wasm/wllama.wasm
  ```

As of this drop, both native and web use the same upstream llama.cpp commit:

```text
llama.cpp = 9e3b928fd = upstream b9553
```

The previous Telosnex llama.cpp source workaround commits were removed:

```text
cbbe868c0 Avoid iostream crashes in wasm chat and WebGPU preprocessing
b7f7dabed Avoid remaining wasm iostream traps in Jinja and MTMD loading
```

The browser fixes now live in the **wllama parent build/runtime**, not in
`llama.cpp` source:

- `-sSTACK_SIZE=16MB` fixes Gemma4 tool/response-format grammar stack exhaustion.
- `-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=_localtime_js` force-includes Emscripten's
  stock `libtime.js` `_localtime_js` implementation for upstream `std::localtime`
  / `strftime` paths.

---

## 2. Repos / checkouts involved

| Path | What it is | Role |
|------|------------|------|
| `/Users/jpo/dev/fllama` | `github.com/Telosnex/fllama` | Product repo. Vendors `src/llama.cpp` as a plain copy and bundles web wllama artifacts. |
| `/Users/jpo/dev/ngxson_wllama` | wllama checkout, `origin = github.com/ngxson/wllama` | Source of truth for web artifacts and source used to refresh fllama's native vendored tree. Contains `llama.cpp` as a submodule. |
| `/Users/jpo/dev/ngxson_wllama/llama.cpp` | llama.cpp submodule | Current source for both native copy and web build. At upstream `9e3b928fd`. |

---

## 3. Current lineage

### 3a. wllama parent

Branch:

```text
telosnex/request-id-parallel-llamacpp-head-diagnose-wasm-runtime
```

Important history before this refresh:

```text
7faf82a  Fix wasm MTMD and Jinja iostream traps            <- previous fllama drop source
65c71fd  Point llama.cpp submodule at Telosnex fork
090c345  Fix llama.cpp HEAD wasm iostream crashes
5a14145  Rebuild wasm for llama.cpp 9e3b928fd
83e67fe  Update llama.cpp to 9e3b928fd
1798b72  Merge upstream wllama 1bcd8af
afce0be  Add request-id based parallel generation          <- Telosnex feature
1bcd8af  cache: refactor storage impl ... (#247)           <- ngxson/wllama origin/master
```

This refresh changes the wllama working tree to:

- keep the Telosnex request-id/parallel-generation feature;
- rewind the `llama.cpp` submodule from Telosnex `b7f7dabed` to upstream
  `9e3b928fd`;
- add `-sSTACK_SIZE=16MB` in wllama `CMakeLists.txt`;
- add `-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=_localtime_js` so generated glue
  includes Emscripten's stock `_localtime_js` implementation;
- rebuild wasm, generated worker code, and the ESM bundle.

### 3b. llama.cpp source

Current source:

```text
9e3b928fd common : relax sampler name matching (#23744)
```

This is upstream llama.cpp b9553 with no Telosnex source patches.

Previous source:

```text
b7f7dabed = 9e3b928fd + two Telosnex wasm iostream-avoidance commits
```

The previous patches were removed because the Gemma4 failure was proven to be
wasm stack exhaustion/corruption, not a globally broken libc++ iostream runtime.
The missing `_localtime_js` path is handled by providing the import at link time.

---

## 4. Custom changes that remain required

### 4a. Feature: request-id-based parallel generation

- Where: wllama parent commit `afce0be` and later merge/history.
- What: enables concurrent/parallel generation keyed by request id.
- Lives in: wllama parent JS/C++ glue, not `src/llama.cpp`.
- Ships to fllama web through:
  ```text
  assets/web/wllama/index.js
  assets/web/wllama/wasm/wllama.js
  assets/web/wllama/wasm/wllama.wasm
  ```

### 4b. Fix: Gemma4 grammar stack exhaustion

- Where: wllama `CMakeLists.txt`.
- What:
  ```cmake
  -sSTACK_SIZE=16MB
  ```
- Why: Gemma4 tool/response-format grammar generation can exceed Emscripten's
  default wasm stack. The observable symptom was misleading:
  `RuntimeError: null function` inside libc++ ostream/string-join frames.
- Validation: upstream `llama.cpp` `9e3b928fd` + this stack setting passed the
  tiny-model Gemma4-like template + tools repro.

### 4c. Fix: force-include Emscripten `_localtime_js`

- Where: wllama `CMakeLists.txt`:
  ```cmake
  -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=_localtime_js
  ```
- Why: upstream llama.cpp can use `std::localtime` / `strftime` in diagnostics.
  The wasm imports `_localtime_js`. Emscripten ships the implementation in
  `src/lib/libtime.js`; this flag forces generated glue to include that canonical
  implementation instead of relying on auto-inclusion.
- Validation: direct wllama wasm instantiation smoke test passed with upstream
  `llama.cpp` after the stock Emscripten libtime implementation was included.

### 4d. fllama-side native build glue

fllama still neutralizes llama.cpp's unconditional `cpp-httplib` linkage with its
existing INTERFACE shim and `src/fllama_download_stub.cpp`.

A full CMake `all` build may still fail linking llama.cpp CLI tools due to httplib
symbols. This is not the production path. The Dart native-assets hook builds the
`fllama` target.

---

## 5. What was removed

The previous fllama drop recorded these wasm iostream workaround patches in the
llama.cpp source tree:

- stream-free rewrites in chat/Jinja/WebGPU preprocessing;
- constant wasm date formatting for `strftime_now` paths;
- `FILE*`-based MTMD/CLIP tensor loading instead of `std::ifstream`.

Those patches are no longer in `src/llama.cpp`.

Risk note: the Gemma4/Jinja/tool-grammar path and wasm instantiation were
validated after removing the patches. A separate browser MTMD/mmproj loading
regression was not revalidated as part of this specific stack/import fix. If an
MTMD-specific issue reappears, test it independently rather than assuming it is
the same Gemma4 stack bug.

---

## 6. How to reproduce / refresh fllama

Use `/Users/jpo/dev/ngxson_wllama` as the source.

### 6a. Prepare wllama

```sh
cd /Users/jpo/dev/ngxson_wllama

git -C llama.cpp checkout 9e3b928fd8c9d14dbf15a8768b9fdd7e5c721d66

npm run build:wasm
npm run build:worker
npm run build:tsup
```

`build:wasm` must include the wllama build/runtime fixes described above.
`build:worker` is required because fllama's high-level web path uses the embedded
worker bundle; otherwise stale worker code can hide/import the wrong glue.

### 6b. Refresh native llama.cpp in fllama

```sh
export FLLAMA=/Users/jpo/dev/fllama
export WLLAMA=/Users/jpo/dev/ngxson_wllama

cd "$FLLAMA"
rsync -a --delete \
  --exclude='.git/' \
  --exclude='build/' \
  --exclude='FLLAMA_LLAMA_CPP_DROP.txt' \
  "$WLLAMA/llama.cpp/" \
  "$FLLAMA/src/llama.cpp/"
```

Then update:

- `src/CMakeLists.txt` → `LLAMA_BUILD_COMMIT`;
- `src/llama.cpp/FLLAMA_LLAMA_CPP_DROP.txt`;
- this ADR if provenance changed.

### 6c. Refresh fllama web artifacts

```sh
cd /Users/jpo/dev/fllama
cp /Users/jpo/dev/ngxson_wllama/esm/index.js assets/web/wllama/index.js
cp /Users/jpo/dev/ngxson_wllama/src/wasm/wllama.js assets/web/wllama/wasm/wllama.js
cp /Users/jpo/dev/ngxson_wllama/src/wasm/wllama.wasm assets/web/wllama/wasm/wllama.wasm
```

Update `assets/web/fllama_web_init.js` asset-version query string when replacing
runtime assets, and keep `scripts/check_web_assets.sh` aligned.

### 6d. Validate

Cheap checks:

```sh
cd /Users/jpo/dev/fllama
node --check assets/web/fllama_web_init.js
scripts/check_web_assets.sh
cmake -S src -B tmp/fllama-validate -DCMAKE_BUILD_TYPE=Release
cmake --build tmp/fllama-validate --target fllama -j
```

Optional web smoke, if local model files are available:

```sh
cd /Users/jpo/dev/fllama
node dev/web_smoke/fllama_web_smoke.mjs --build --runtime current --model /path/to/model.gguf
```
