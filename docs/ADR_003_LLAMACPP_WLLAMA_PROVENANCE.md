# ADR 003 — llama.cpp / wllama provenance (the "Frankenstein")

Status: accepted (2026-06-07)

This documents **exactly** what fllama's native + web llama.cpp builds are made of,
which repos/branches they come from, what custom changes were required, and where
those changes physically live. Written because the setup spans several local-only
git branches across multiple checkouts and is not obvious from fllama alone.

---

## 1. The short version

fllama runs llama.cpp two ways, and as of this drop **both are the same commit**:

- **Native** (iOS/macOS/Android/Windows): compiles the vendored tree `src/llama.cpp`.
- **Web** (wasm): ships prebuilt artifacts in `assets/web/wllama/` produced by the
  **wllama** project.

Both are now at:

```
llama.cpp = b7f7dabed  =  upstream b9553 (9e3b928fd) + wllama wasm iostream patches
```

The "Frankenstein" = **upstream llama.cpp HEAD** + **a telosnex wllama feature
(request-id parallel)** + **a wasm-only iostream crash fix**, none of which are
published to any public remote yet (all local branches — see §5).

---

## 2. The repos / checkouts involved

| Path | What it is | Role |
|------|-----------|------|
| `/Users/jpo/dev/fllama` | This repo (`github.com/Telosnex/fllama`, branch `main`) | The product. Vendors `src/llama.cpp` (plain copy, **not** a submodule) and bundles web wllama artifacts. |
| `/Users/jpo/dev/ngxson_wllama` | A wllama checkout (`origin = github.com/ngxson/wllama`) | **Source of truth** for BOTH the web wasm artifacts and (now) the native tree. Has telosnex local branches. Contains llama.cpp as a **submodule**. |
| `/Users/jpo/dev/ngxson_wllama/llama.cpp` | llama.cpp submodule (`origin = github.com/ggerganov/llama.cpp`) | Where the wasm iostream patch commit lives. |
| `/Users/jpo/dev/wllama-stock` | An older wllama checkout | **Previous** native source (llama.cpp `f22c8021d`, Apr 2026). Superseded by this drop. |
| `/Users/jpo/dev/wllama` | Another wllama checkout | Not used by this drop. Mentioned only to disambiguate. |

> Before this drop, web tracked `ngxson_wllama` and native tracked `wllama-stock` —
> i.e. web and native were on **different** llama.cpp versions. This drop unifies them.

---

## 3. What lineage / branches make up each piece

### 3a. wllama parent (`/Users/jpo/dev/ngxson_wllama`)

Branch: `telosnex/request-id-parallel-llamacpp-head-diagnose-wasm-runtime` @ `7faf82a`
Pushed to: `https://github.com/Telosnex/wllama` (same branch name).

```
7faf82a  Fix wasm MTMD and Jinja iostream traps      <- HEAD (submodule b7f7dabed + rebuilt wasm)
65c71fd  Point llama.cpp submodule at Telosnex fork    <- .gitmodules -> Telosnex/llama.cpp
090c345  Fix llama.cpp HEAD wasm iostream crashes      <- bumps submodule + rebuilt wasm
5a14145  Rebuild wasm for llama.cpp 9e3b928fd
83e67fe  Update llama.cpp to 9e3b928fd                 <- bump submodule to upstream HEAD (b9553)
1798b72  Merge upstream wllama 1bcd8af
afce0be  Add request-id based parallel generation       <- telosnex custom feature
1bcd8af  cache: refactor storage impl ... (#247)        <- ngxson/wllama origin/master
   |
e8e134f  Add support for async file read (#221)         <- base the feature was branched from
```

> `.gitmodules` was repointed from `ggerganov/llama.cpp` to `Telosnex/llama.cpp`
> so the submodule SHA `b7f7dabed` resolves on a fresh clone.

So the web build = **ngxson/wllama master** + **request-id parallel feature** +
**llama.cpp bumped to upstream HEAD** + **rebuilt wasm**.

### 3b. llama.cpp submodule (`/Users/jpo/dev/ngxson_wllama/llama.cpp`)

Branch: `telosnex/wasm-avoid-iostream-null-function-on-9e3b928fd` @ `b7f7dabed`
Pushed to: `https://github.com/Telosnex/llama.cpp` (same branch name).

```
b7f7dabed  Avoid remaining wasm iostream traps in Jinja and MTMD loading
cbbe868c0  Avoid iostream crashes in wasm chat and WebGPU preprocessing
9e3b928fd  common : relax sampler name matching (#23744)                 <- upstream, tag b9553
```

i.e. **upstream b9553 + two wasm iostream-avoidance patches.**

---

## 4. The custom changes that were required (and why)

### 4a. Feature: request-id-based parallel generation  (wllama JS/C++ glue)
- Where: wllama parent commit `afce0be` (and merge `1798b72`).
- What: enables concurrent/parallel generation keyed by request id.
- Lives in: the wllama parent tree (NOT in `src/llama.cpp`). It ships to fllama web
  **only** via the bundled `assets/web/wllama/index.js` + `wllama.js` + `wllama.wasm`.

### 4b. Patch: wasm iostream crash fixes  (llama.cpp commits `cbbe868c0` and `b7f7dabed`)
- Why: on upstream HEAD, the wasm build crashed with `RuntimeError: null function`
  inside libc++ stream machinery (and a follow-on `_gmtime_js` import error). Root
  cause: several newly-exercised chat-template / WebGPU-preprocessor paths use
  `std::stringstream`/`std::ostringstream`/`std::put_time`/`gmtime`, which trap in
  the wllama Emscripten runtime.
- Files changed (5):
  ```
  common/chat-diff-analyzer.cpp      string concat instead of stringstream
  common/chat.cpp                    #ifdef __EMSCRIPTEN__ -> "Jan 01 1970"
  common/jinja/string.cpp            plain std::string concat (all platforms), drop <sstream>
  common/jinja/value.cpp             #ifdef __EMSCRIPTEN__ -> "Jan 01 1970"
  ggml/src/ggml-webgpu/pre_wgsl.hpp  stream-free string/token parsing; drop dead trim_value
  ```
- Native impact: **none functional.** The `#ifdef __EMSCRIPTEN__` branches compile
  the normal path on native; the other two files are behavior-neutral cleanups.
  (Verified: rebuilt wasm was byte-identical, proving the cleanup doesn't change
  codegen for wasm either.)
- Date behavior in wasm: chat-template `strftime_now` / template date returns the
  constant `"Jan 01 1970"`. This is cosmetic (template probing/example rendering),
  not model correctness. Deliberately NOT reimplemented as calendar math.

Additional production hotfix (`b7f7dabed`):
- `tools/mtmd/clip.cpp`: replace `std::ifstream` in `clip_model_loader::load_tensors`
  with `FILE*` + `fseeko`/`_fseeki64`. This fixes production crashes while loading
  Qwen3.5 mmproj, where the stack ended in `clip_model_loader::load_tensors`.
- `common/jinja/value.cpp`: rewrite `value_to_json` serialization from
  `std::ostringstream` to `std::string` append. This fixes Qwen chat templates that
  use `tojson`.
- `common/jinja/runtime.cpp`: rewrite rethrown error formatting from
  `std::ostringstream` to `std::string` append so Jinja errors do not themselves
  trap in wasm.

Validated hotfix cases:
- HF text URL: `https://huggingface.co/telosnex/fllama/resolve/main/Qwen3.5-0.8B-Q4_K_M.gguf`
- Local mmproj pair:
  `/Users/jpo/Documents/Telosnex/models/Qwen3.5-0.8B-Q4_K_M.gguf`
  + `/Users/jpo/Documents/Telosnex/models/Qwen3.5-0.8B-mmproj-F16.gguf`

### 4c. fllama-side glue that makes the new `common` link
- Upstream made `common` link `cpp-httplib` unconditionally (old `LLAMA_HTTPLIB` /
  `LLAMA_CURL` flags are now deprecated no-ops). fllama neutralizes this with its
  own `cpp-httplib` INTERFACE shim + `src/fllama_download_stub.cpp` (already present
  in `src/CMakeLists.txt`). No new fllama glue was needed for this drop.
- Consequence: a full `cmake --build <dir>` (target `all`) FAILS linking llama.cpp's
  CLI tool executables (`llama-mtmd-cli` etc.) due to unresolved httplib symbols.
  This is irrelevant: the Dart build hook (`hook/build.dart`) builds only
  `targets: ['fllama']`, which links cleanly.

### 4d. No fllama-local patches inside `src/llama.cpp`
- The previous native source (`wllama-stock` @ `f22c8021d`, branch
  "file-loader-changes") carried exactly one source patch: 64-bit file offsets in
  `src/llama-mmap.cpp` (`llama_mmap_ftell`/`llama_mmap_fseek`). That patch is
  **already upstream in b9553**, so refreshing lost nothing and re-applied nothing.

---

## 5. Where the changes are stored  ⚠️ (the important part)

- **fllama** (this repo): the drop is **committed-able but currently UNCOMMITTED**
  in the working tree as of writing — web artifacts, `src/CMakeLists.txt`
  (`LLAMA_BUILD_COMMIT b7f7dabed`), `FLLAMA_LLAMA_CPP_DROP.txt`, and ~1,966 vendored
  `src/llama.cpp` path changes. Once committed to `main`, the **entire** native tree
  (including the iostream patch) is permanently captured here, because `src/llama.cpp`
  is a plain vendored copy, not a submodule.

- **wllama parent** branch `telosnex/request-id-parallel-llamacpp-head-diagnose-wasm-runtime`
  @ `7faf82a`: **PUSHED** to `github.com/Telosnex/wllama` (remote `telosnex`). The
  request-id feature + wasm rebuild source is preserved there. (`origin` remains
  `ngxson/wllama` upstream.)

- **llama.cpp patch** branch `telosnex/wasm-avoid-iostream-null-function-on-9e3b928fd`
  @ `b7f7dabed`: **PUSHED** to `github.com/Telosnex/llama.cpp` (remote `telosnex`).
  Also baked into fllama's vendored `src/llama.cpp` at drop time. (`origin` remains
  `ggerganov/llama.cpp` upstream.)

> Both Telosnex forks were treated as overwritable; branches were force-pushed.

### Risk (residual)
The Telosnex forks now hold the source. If both those forks AND the local
`ngxson_wllama` checkout were lost, the request-id-parallel feature would survive
only as the opaque prebuilt `assets/web/wllama/*` blobs, and the wasm patch only as
fllama's vendored `src/llama.cpp` tree (source preserved, but detached from the
llama.cpp branch).

### Follow-ups
1. ~~Push the two telosnex branches to a telosnex-owned fork.~~ **DONE** — see above.
2. ~~Commit this drop to fllama `main`.~~ **DONE** in the same commit that adds this doc.
3. Consider upstreaming the behavior-neutral half of the iostream patch
   (`string.cpp`, `pre_wgsl.hpp`) to llama.cpp.
4. iOS / Android / Windows native builds were NOT validated (only macOS).

---

## 6. How to reproduce / refresh
See `README.md` → "Refresh native llama.cpp from wllama" and the web-artifact copy
steps. Source checkout is `/Users/jpo/dev/ngxson_wllama`. Validate native with a
`fllama` target build or `flutter build macos --debug` (NOT `cmake --build all`).
Validate web with `scripts/check_web_assets.sh`.
