# ADR 001: Replace MLC/WebLLM with llama.cpp via wllama on Web

## Status

Accepted.

## Date

2026-05-20

## Context

fllama's native backend is a thin adapter over llama.cpp server/common code. That gives native platforms one implementation for OpenAI-compatible chat parsing, model chat templates, tool-call parsing, streamed response chunks, and GGUF model loading.

Historically, web diverged through a custom fllama Emscripten build and MLC/WebLLM model IDs. That split caused drift:

- Web and native used different model formats/catalogs.
- App code had MLC-specific branches and model IDs.
- Tool/chat semantics did not naturally match llama.cpp native behavior.
- Stale wasm assets were easy to ship accidentally.

Upstream wllama (`https://github.com/ngxson/wllama`) already owns the browser-specific llama.cpp integration: Emscripten flags, JS/worker glue, WebGPU backend selection, OPFS/cache/file loading, OpenAI-compatible chat APIs, and a single wasm artifact that can switch between single-threaded, multi-threaded, and WebGPU execution at runtime.

## Decision

Use **llama.cpp via wllama** as fllama's web runtime. Retire MLC/WebLLM from fllama and Telosnex web local-LLM paths.

fllama owns the packaged web runtime under:

```text
assets/web/fllama_web_init.js
assets/web/wllama/index.js
assets/web/wllama/wasm/wllama.{js,wasm}
```

Consuming Flutter apps import the package bridge from `web/index.html`:

```html
<script type="module">
  import './assets/packages/fllama/assets/web/fllama_web_init.js';
</script>
```

Telosnex deployment stamps this import with `?v=$timestamp` in `dev/ci/build_web.sh`. The query string is only a cache key; the fllama version comes from the package assets and `pubspec.lock`.

## Current web integration

### API

The web API remains fllama-shaped:

```dart
Future<int> fllamaChatWeb(
  OpenAiRequest request,
  FllamaWebLoadCallback loadCallback,
  FllamaInferenceCallback callback,
);

Future<void> fllamaWebModelDelete(String modelPath);
Future<bool> fllamaWebIsModelDownloaded(String modelPath);
Future<String?> fllamaWebPickModel();
```

`OpenAiRequest.modelPath` is a web locator. Supported values are:

- `https://.../model.gguf`
- `blob:...`
- `fllama-local-file://...` returned by `fllamaWebPickModel()`

`fllama-local-file://...` is an opaque in-memory handle to a browser `File`; it is not persistent across page reloads.

### Runtime path

The current generation path is upstream wllama's OpenAI-compatible chat path:

```text
fllamaChatWeb
  -> fllamaChatWebJs
  -> loadModelFromUrl / loadModel
  -> createChatCompletion({ stream: true })
  -> Dart callback with OpenAI-compatible chunk JSON
```

The browser bridge serializes requests. Current browser execution must be treated as single-active-request:

```text
one loaded server context
one active generation at a time
queued concurrent requests
```

Concurrent browser requests were observed to abort the wasm runtime in the previous POC fork. Native fllama may continue to rely on llama.cpp server scheduling; web should not assume native-style batching until upstream wllama proves it safe for our use case.

## Build and packaging

Operational rebuild instructions live in [RUNBOOK_WEB_RUNTIME.md](RUNBOOK_WEB_RUNTIME.md). In short:

1. Rebuild upstream `ngxson/wllama` from master.
2. Copy the generated single wasm runtime into `assets/web/wllama`.
3. Run `scripts/check_web_assets.sh`.

The marker check must show:

```text
old slow markers: 0
fast markers:     non-zero
server/chat markers: non-zero
```

## Telosnex integration

After pushing fllama, Telosnex updates the git dependency:

```bash
flutter pub upgrade fllama
```

Telosnex must serve web with cross-origin isolation so upstream wllama can use wasm threads when available:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

## Consequences

### Positive

- Web and native both use GGUF/llama.cpp concepts.
- Telosnex can use the same local-LLM catalog shape on web and native.
- fllama owns package web assets; apps no longer copy wasm manually.
- The marker check catches stale slow WebGPU wasm before release.

### Negative / risks

- The browser runtime depends on upstream wllama's evolving v3 API.
- Web requests remain serialized until browser-side batching is validated for our use case.
- Rebuilding web artifacts still spans fllama and wllama.
- `fllama-local-file://...` handles are session-only.

## Known lessons

- **Slow wasm:** stale/different llama.cpp WebGPU artifacts produced ~25 tok/s instead of ~130 tok/s. The marker check now detects the old slow backend.
- **Duplicate first token:** relaying `item.rawChunk` duplicated chunks when one raw payload produced multiple parsed chunks. The bridge now relays `JSON.stringify(item.chunk)`.
- **Concurrent request crash:** overlapping title-generation and chat requests aborted wasm in the POC fork. The bridge queues web requests while we validate upstream batching safety.

## Validation before publishing fllama

```bash
node --check assets/web/fllama_web_init.js
scripts/check_web_assets.sh
dart analyze lib/fllama_html.dart lib/fllama_universal.dart
```

If web assets changed, build a consuming Flutter web app and verify package assets land under:

```text
build/web/assets/packages/fllama/assets/web/
```

## Open follow-ups

- Create a first-class fllama script that rebuilds/copies wllama web assets end-to-end.
- Add a small browser smoke harness for fllama web that can run a tiny GGUF request.
- Decide whether to keep the web request queue forever or add upstream-safe server batching later.
- Implement persistent browser local GGUF import instead of session-only `fllama-local-file://...` handles.
