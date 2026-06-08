# Gemma 4 MTP (speculative decoding) in fllama

Notes from June 2026 spike. State: **working, modest win on Metal, not shipped as default.**

## TL;DR
- Gemma 4 ships MTP "assistant"/drafter models. Pair a drafter with its matching target → speculative decoding.
- Upstream llama.cpp support **merged** in `ggml-org/llama.cpp#23398` (commit `04eb4c44`). Our vendored tree (b9553, 2026-06-07) already has it.
- We wired it through fllama end-to-end. It works. On Apple Silicon the speedup is real but **highly sensitive to `n_max`**, and fragile (cliffs).

## What we changed in fllama
- `src/fllama.h` — added `draft_model_path`, `draft_n_max` to `fllama_inference_request`.
- `src/fllama.cpp` — sets `params.speculative` (`COMMON_SPECULATIVE_TYPE_DRAFT_MTP`, n_max, draft on GPU) when a drafter is given.
- `src/fllama_inference_queue.{h,cpp}` — `draft_path` added to `ServerResources` + `params_match()` so changing drafter recreates the context.
- Dart: `lib/io/fllama_bindings_generated.dart`, `lib/fllama_universal.dart` (`FllamaInferenceRequest`), `lib/misc/openai.dart` (`OpenAiRequest`), `lib/io/fllama_io_inference.dart` (fill/free). `fllamaChat` forwards the fields.
- `example/lib/main.dart` — "Open drafter .gguf" picker + persistence. **NOTE: hardcoded `draftNMax: 3` — that's near worst-case on Metal (see below). Make it tunable.**

fllama wraps llama.cpp `server_context`, which does all the MTP work — we only populate `common_params`.

## How to convert a drafter to GGUF
Dense drafters (12B/31B/26B-A4B) convert with the standard script; **E2B/E4B do NOT** (sparse; `masked_embedding.centroids.weight` error — needs upstream follow-up).
```bash
python convert_hf_to_gguf.py <hf-assistant-dir> --outfile drafter-f16.gguf --outtype f16
```
- Keep drafter weights F16/Q8. Do **not** use a Q8 *KV cache* (kills acceptance; Metal KV-quant is unoptimized).
- Verify metadata: `general.architecture=gemma4-assistant`, `embedding_length_out` must == target hidden size (e.g. 3840 for 12B).
- Convert venv left at `/Users/jpo/dev/.gguf-venv` (py3.13 + torch/transformers/gguf-py).

## Benchmark (MacBook Pro 2025, M4 Max; 12B-it QAT q4_0 target + f16 drafter, temp 0, 300 tok, code prompt)
Measured via `llama-server` /completion `timings` (= fllama's path).

| n_max | t/s | vs base | accept |
|------:|----:|--------:|-------:|
| baseline | 50.5 | 1.00x | — |
| 3 (our default) | 59.1 | 1.17x | 95% |
| 8 | 73.4 | 1.45x | 89% |
| **12** | **90.4** | **1.79x** | 85% |
| 16 | 42.1 | 0.83x (slower) | 81% |

- Sweet spot ~12 on this machine. Default n_max=3 is barely above noise → explains "tok/s looked identical" in the app.
- Drafter GPU vs CPU placement (`-ngld`) made **zero** difference here.
- A/B recipe: `llama-server -m <target> -ngl 99 -md <drafter> --spec-type draft-mtp -ngld 99 --spec-draft-n-max N`, POST `/completion`, read `timings.predicted_per_second` + `draft_n`/`draft_n_accepted`.

## Why Metal is fragile (community findings, NOT in #23398)
- `#23114` (closed, **unmerged**): Metal `flash_attn_ext_vec` uses 1 query row/threadgroup → verify tokens re-load shared K/V instead of reusing it. The "free batched verify" wasn't free because the kernel wasn't written for it. Q=2 fix = 1.0–1.5x on the FA op.
- `#22941` (closed, **unmerged**): self-MTP / big MoE duplicate the full model into a 2nd Metal buffer → working-set overflow → spilling. Caused a 13x regression on M1 Pro (`#23011`).
- `#23752` (M1 Max): self-MTP net loss at every config, closed "not a bug."
- ggerganov: Metal KV-quant "not optimized… low on my todo list." 
- Our 1.79x worked **because**: separate small drafter (no full-model dup), strong GPU/bandwidth (M4 Max), F16 KV. The M1 Max/M1 Pro regressions were weaker GPUs + self-MTP full-model duplication; an M4 Max likely avoids the worst of it.

## Where to pick up
1. **Make `draftNMax` tunable** in example (slider 2–14) + raise default (~8, ~12 on Apple). Lowest-effort, biggest perceived win.
2. **E2B/E4B drafter conversion** — wait for upstream follow-up to #23398 (sparse arch); track `masked_embedding.centroids.weight`.
3. **Watch Metal fix PRs** `#23114` and `#22941` (both unmerged) — if they land, re-bench; could remove the cliffs and the self-MTP penalty.
4. **Strategic**: this is server/desktop-grade machinery. Confirms MTP is a desktop/CUDA win, marginal+fragile on mobile/Metal. Weigh against continued llama.cpp maintenance burden.

## Key links
- PR #23398 (merged): https://github.com/ggml-org/llama.cpp/pull/23398
- Metal FA fix #23114: https://github.com/ggml-org/llama.cpp/pull/23114
- mmap dup fix #22941: https://github.com/ggml-org/llama.cpp/pull/22941
- Metal regressions: #23752, #23011
- Google MTP docs: https://ai.google.dev/gemma/docs/mtp/mtp
