# ADR 003 — llama.cpp / wllama provenance

Status: accepted (updated 2026-10-26)

This documents what fllama's native and web llama.cpp runtimes are made of and
how to reproduce them. Keep it current whenever either runtime is refreshed.

---

## 1. Current runtime

fllama runs the same llama.cpp source two ways:

- **Native** compiles the vendored copy at `src/llama.cpp`.
- **Web** ships a wllama bundle: `wllama/index.js`, `wllama/wasm/wllama.js`,
  `wllama/wasm/wllama.wasm` and the compat build (`wllama/compat/`). The
  native release workflow builds it with `tool/kiln/build_web.dart` from
  `web_build/wllama.json` and `web_build/wllama.patch`, and publishes it in
  the same release as the native libraries (ADR 002).
  `native_artifacts/web.json` pins the files.

Both use upstream llama.cpp

```text
5aeac37a35b44fde4bdffaec9159f2fcb253b622  (2026-10-18, b11719)
ggml-cuda: fattn do not check oob if k_VKQ_max = (k_VKQ_max - nbatch_fa) (#30572)
```

with the patches in `patches/llama.cpp`. It is the llama.cpp pin of wllama
`3bb2a46`, so wllama has been built and run with it upstream. The web bundle
names itself `b11719-5aeac37`.

---

## 2. Source lineage

### 2a. wllama

```text
ngxson/wllama 3bb2a46f0dab0b924e8cd992b85e8881c3d3a859 (2026-10-20)
sync latest llama.cpp (#293)
```

plus `web_build/wllama.patch`, the reproducible source of every fllama change
to wllama. The patch does not move the llama.cpp gitlink.

### 2b. llama.cpp

```text
upstream: https://github.com/ggml-org/llama.cpp
commit:   5aeac37a35b44fde4bdffaec9159f2fcb253b622
build:    b11719 (git rev-list --count)
```

`src/llama.cpp` is an exact copy of that commit, with the patches in
`patches/llama.cpp` applied, plus the fllama-owned provenance file
`src/llama.cpp/FLLAMA_LLAMA_CPP_DROP.txt`. The web build applies the same
patch files to its llama.cpp clone. `test/llama_cpp_pin_test.dart` checks
that native and web pin one commit and that every patch is applied.

Patches (2026-10-26):

- `0001-mtmd-check-sched-reserve.patch`: llama.cpp PR 29150 (open). Without
  it, an mmproj load without memory for its compute buffer reports success
  and every image request aborts. Drop it when llama.cpp has the PR.

### 2c. Artifact fingerprints

`native_artifacts/web.json` has the SHA-256 of each released file; the
release workflow writes it. The build is reproducible: built with
`--work /tmp/fllama_web_build` in the linux/amd64 image, all files are
byte-identical to the release. On arm64 the default (JSPI, Memory64)
`wllama.wasm` differs in a few bytes of code generation.

---

## 3. fllama's wllama changes

All are in `web_build/wllama.patch`. Upstream wllama has had request IDs,
`n_parallel`, `kv_unified`, cancel and one-call-at-a-time wasm calls since
`a3d9da2` (PR 270), so fllama no longer patches those.

- **Per-request Jinja template.** A chat request can carry
  `jinja_template`, as in native fllama, without the template being part of
  the loaded model: requests with and without tools share one server
  context. A template that does not render falls back to ChatML.
- **Load in the same worker.** `wllama_unload` (a JSPI / Asyncify export)
  frees the model and its context; with `Wllama.reuseWorker`, a second
  `loadModel()` unloads and loads in the same worker
  (`ProxyToWorker.replaceFiles`, async file reads). It refuses, before
  unloading, more threads, another build, or another WebGPU setup. On iOS
  Safari 26.3 a new worker does not get the memory of an ended one back.
- **pthread pool of 2 × n_threads.** The text model and the mtmd image
  encoder each start n_threads − 1 pthreads; in Safari a pthread beyond the
  pool never starts, and image encoding waits forever.
- **Memory64 detection** with `WebAssembly.validate` of a Memory64 module.
  WebKit accepts `new WebAssembly.Memory({address: 'i64'})` but cannot
  compile a Memory64 module.
- **Worker errors**: `String()` around Emscripten's error message, which is
  an `Error` when the wasm does not compile.
- **Link options**: `-sSTACK_SIZE=16MB` (Gemma tool / response-format
  grammars exhaust 5 MB) and `-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=_localtime_js`
  (`std::localtime` / `strftime`).

Toolchain (wllama's pins, unchanged): Emscripten SDK 4.0.20, Dawn
`v20260317.182325`, Node 22.16.0.

---

## 4. fllama native adaptations

fllama's own C++ (`src/fllama.cpp`, `src/CMakeLists.txt`) for `5aeac37`:

- the `server-context` target builds `server-task`, `-queue`, `-common`,
  `-chat`, `-context`, `-stream`, `-tools`, `-mcp`, `-schema` and
  `-decision`; it cannot use `tools/server`'s CMake (the `llama-server`
  executable needs cpp-httplib);
- JSON is `common_json` (`common/json.h`); `json_text` uses
  `safe_json_to_str`;
- `oaicompat_chat_params_parse` takes the vocab and a `common_chat_session`;
  the task gets it with `apply_chat_session` and the reader with
  `post_tasks(tasks, session)`, which parses tool calls from the stream;
- the per-request template sets `server_chat_params` by field name;
- tokenizer-only loads use `LLAMA_LOAD_MODE_MMAP`; directly made
  `common_params` are CPU-postprocessed so batch and speculative thread
  counts do not keep the `-1` CLI sentinel.

fllama disables HTTP/CURL model downloads (a `cpp-httplib` INTERFACE shim and
`fllama_download_stub.cpp`). Builds target `fllama`, not llama.cpp's
executables.

---

## 5. Reproduce the web runtime

The native release workflow builds it: the `web` job runs
`tool/kiln/build_web.dart` in the image of `web_build/wllama.json`, and
`web-test` loads a model with the result in Chrome. `integration.yml`'s `web-files`
job builds the same files for each commit. The steps:

1. Check out wllama at the pinned commit and apply `web_build/wllama.patch`.
2. Clone llama.cpp with its history at the pinned commit and apply
   `patches/llama.cpp`. `build:worker` names the build
   `b<commit count>-<short hash>`.
3. Download the Dawn WebGPU package and check its SHA-256.
4. Build the JSPI and compat Wasm, then `build:glue`, `npm ci`,
   `build:worker`, `tsc --noEmit` and `build:tsup`.

Locally, with Docker:

```sh
docker run --rm -v "$PWD:/src" -v /tmp/fllama_web:/out -w /src \
  <emsdkImage with Dart> bash -c \
  'dart tool/kiln/build_web.dart --out /out --work /tmp/fllama_web_build'
```

---

## 6. Refresh llama.cpp and wllama

1. Pick the llama.cpp commit: the pin of the wllama commit you move to is the
   safe choice.
2. Apply `web_build/wllama.patch` to the new wllama
   (`git apply --3way --exclude=llama.cpp`), resolve, and write the patch
   again (`git diff --cached`). Drop what upstream now has.
3. Copy llama.cpp into `src/llama.cpp`:

   ```sh
   rsync -a --delete --exclude='.git' --exclude='build/' \
     --exclude='.DS_Store' --exclude='FLLAMA_LLAMA_CPP_DROP.txt' \
     "$LLAMA_CPP/" src/llama.cpp/
   git apply --directory=src/llama.cpp patches/llama.cpp/*.patch
   ```

4. Update `web_build/wllama.json`, `src/CMakeLists.txt`
   (`LLAMA_BUILD_COMMIT`), `src/llama.cpp/FLLAMA_LLAMA_CPP_DROP.txt`, this
   ADR, and fllama's C++ for API changes.
5. Run `flutter test test`, the native integration test, and the web test in
   Chrome and iOS Safari; then push a `ci/**` branch and let `integration.yml` run
   every job. A change under `src/llama.cpp/ggml` starts `cuda_pack.yml`; publish
   the CUDA pack before the native release.

---

## 7. Validation for this drop (2026-10-26)

- web: Chrome (dart2js) and the iOS 26.3.1 simulator's Safari, 7 threads:
  the web integration test passes (same-worker loads, no retries);
- native: macOS arm64 builds from source, and the native integration test
  passes (32 tests);
- `flutter test test` passes, including the llama.cpp pin test;
- then every `test.yml` job on CI.
