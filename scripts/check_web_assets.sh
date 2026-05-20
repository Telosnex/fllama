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
require_file assets/web/wllama/wasm/wllama.js
require_file assets/web/wllama/wasm/wllama.wasm

require_absent example/web/fllama_web_init.js
require_absent example/web/wllama
require_absent assets/web/wllama/jspi-single-thread
require_absent assets/web/wllama/asyncify-single-thread
require_absent assets/web/wllama/asyncify-multi-thread

require_grep 'assets/web/fllama_web_init\.js' pubspec.yaml
require_grep 'assets/web/wllama/wasm/' pubspec.yaml
require_grep "import './assets/packages/fllama/assets/web/fllama_web_init\.js';" example/web/index.html
require_grep 'ngxson-v3-webgpu' assets/web/fllama_web_init.js
require_grep 'default:' assets/web/fllama_web_init.js

wasm="assets/web/wllama/wasm/wllama.wasm"
old_markers="$(count_markers "$wasm" 'WaitAny returned|Failed to submit commands')"
fast_markers="$(count_markers "$wasm" 'ggml_webgpu_flash_attn_decisions|parameter arena exhausted|event_synchronize timed out')"
server_markers="$(count_markers "$wasm" 'server_context|server_task|chat_completion|cmpl_req')"

echo "$wasm"
echo "  old slow markers:     $old_markers"
echo "  fast markers:         $fast_markers"
echo "  server/chat markers:  $server_markers"

[[ "$old_markers" == "0" ]] || fail "$wasm contains old slow WebGPU markers"
[[ "$fast_markers" != "0" ]] || fail "$wasm is missing fast WebGPU markers"
[[ "$server_markers" != "0" ]] || fail "$wasm is missing server/chat markers"

echo "✅ fllama web package assets look good"
