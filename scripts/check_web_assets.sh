#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "❌ $*" >&2
  exit 1
}

count_markers() {
  local file="$1"
  local pattern="$2"
  (strings "$file" | grep -E "$pattern" || true) | wc -l | tr -d ' '
}

require_file() {
  local file="$1"
  [[ -f "$file" ]] || fail "missing $file"
}

require_absent() {
  local path="$1"
  [[ ! -e "$path" ]] || fail "$path should not exist; web runtime must come from package assets"
}

require_grep() {
  local pattern="$1"
  local file="$2"
  grep -qE "$pattern" "$file" || fail "$file does not contain required pattern: $pattern"
}

require_file assets/web/fllama_web_init.js
require_file assets/web/wllama/index.js
require_file assets/web/wllama/jspi-single-thread/wllama.js
require_file assets/web/wllama/jspi-single-thread/wllama.wasm
require_file assets/web/wllama/asyncify-single-thread/wllama.js
require_file assets/web/wllama/asyncify-single-thread/wllama.wasm
require_file assets/web/wllama/asyncify-multi-thread/wllama.js
require_file assets/web/wllama/asyncify-multi-thread/wllama.wasm

require_absent example/web/fllama_web_init.js
require_absent example/web/wllama

require_grep 'assets/web/fllama_web_init\.js' pubspec.yaml
require_grep 'assets/web/wllama/asyncify-multi-thread/' pubspec.yaml
require_grep "import './assets/packages/fllama/assets/web/fllama_web_init\.js';" example/web/index.html
require_grep 'f22c8021d-fast-webgpu' assets/web/fllama_web_init.js

for wasm in \
  assets/web/wllama/jspi-single-thread/wllama.wasm \
  assets/web/wllama/asyncify-single-thread/wllama.wasm \
  assets/web/wllama/asyncify-multi-thread/wllama.wasm; do
  old_markers="$(count_markers "$wasm" 'WaitAny returned|Failed to submit commands')"
  fast_markers="$(count_markers "$wasm" 'ggml_webgpu_flash_attn_decisions|parameter arena exhausted|event_synchronize timed out')"
  echo "$wasm"
  echo "  old slow markers: $old_markers"
  echo "  fast markers:     $fast_markers"
  [[ "$old_markers" == "0" ]] || fail "$wasm contains old slow WebGPU markers"
  [[ "$fast_markers" != "0" ]] || fail "$wasm is missing fast WebGPU markers"
done

poc_markers="$(count_markers assets/web/wllama/asyncify-multi-thread/wllama.wasm 'server_context_poc|server_context|mtmd')"
echo "assets/web/wllama/asyncify-multi-thread/wllama.wasm"
echo "  server-context markers: $poc_markers"
[[ "$poc_markers" != "0" ]] || fail "asyncify multi-thread wasm is missing server-context POC markers"

echo "✅ fllama web package assets look good"
