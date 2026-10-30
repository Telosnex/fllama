# Gemma 4 MTP in fllama

State as of **2026-06-08**: fllama supports Gemma 4 MTP / speculative decoding end-to-end. The recommended safe example default is:

```text
draftNMax = 12
draftPMin = 0.99
```

This is a conservative product/app default for the tested Gemma 4 12B setup: it preserves upside on predictable prompts and avoids the severe regressions seen with llama.cpp's default `p_min=0.0`.

## Recommendation

For apps that already have a matching Gemma 4 assistant/drafter model on disk, it is reasonable to enable MTP for the known-good local desktop configuration:

```text
target: Gemma 4 12B IT QAT q4_0
draft:  matching Gemma 4 12B assistant/drafter f16
path:   fllamaChat / llama.cpp OpenAI chat
hw:     MacBook Pro M4 Max / Apple Silicon desktop
draftNMax: 12
draftPMin: 0.99
```

Expected shape:

- short deterministic reasoning/math: material speedup;
- story / creative / long instruction / code-ish prompts: roughly baseline, not reliably faster;
- catastrophic slowdowns from high `n_max` are avoided by `draftPMin=0.99`.

Do **not** present this as a universal “turbo mode.” It is a safe speculative-decoding mode for a tested model/hardware class. This doc intentionally does **not** recommend live rollback/adaptive disable logic; the choice is simply to use a conservative static default.

## What fllama exposes

- `OpenAiRequest.draftModelPath`
- `OpenAiRequest.draftNMax`
- `OpenAiRequest.draftPMin`
- `FllamaInferenceRequest.draftModelPath`
- `FllamaInferenceRequest.draftNMax`
- `FllamaInferenceRequest.draftPMin`

Native plumbing:

- `src/fllama.h`: `draft_model_path`, `draft_n_max`, `draft_p_min`
- `src/fllama.cpp`: fills `params.speculative` with `COMMON_SPECULATIVE_TYPE_DRAFT_MTP`
- `src/fllama_inference_queue.*`: native context cache key includes drafter path, `n_max`, and `p_min`
- example app: drafter picker, `draftNMax` slider, safe `draftPMin=0.99`, server timing display

## Why `draftNMax=12`, `draftPMin=0.99`

The initial raw `/completion` benchmark made MTP look universally great:

| path | result |
|---|---:|
| raw `/completion`, `n_max=12` | ~1.7–1.8x, ~80% acceptance |

But that was not app-realistic. Raw completion produced degenerate/easy continuation text (`1.0000...`). It proved the native MTP plumbing worked, but not that chat usage got faster.

The real app path is `fllamaChat`, which uses llama.cpp's OpenAI/chat handling and Gemma's chat template. There, prompt class matters.

With `draftNMax=12`, `draftPMin=0.0`:

| prompt class | example | result |
|---|---|---|
| deterministic math | `What is 1048576^0.05` | faster, ~65–67% acceptance |
| creative/story | eggs + Palpatine | much slower, ~20% acceptance |
| long instruction/code | quicksort explanation | slower, ~30% acceptance |

The problem is over-drafting: with `p_min=0.0`, llama.cpp keeps drafting low-confidence future tokens up to `n_max`. For creative/story/code prompts those far-future draft tokens are often rejected, so drafter work dominates.

`draftPMin=0.99` stops drafting unless the drafter is very confident. That keeps the good math case while turning bad story/code cases into roughly baseline.

## Known-state integration test

See:

```text
example/integration_test/gemma4_mtp_integration_test.dart
```

Known-state matrix, recorded on **2026-06-08**, **MacBook Pro M4 Max**, Gemma 4 12B target + matching f16 assistant drafter:

```text
context = 16000
temp = 0
top_p = 1.0
presence_penalty = 1.1
draftNMax = 12
draftPMin = 0.99
```

Representative passing run:

| scenario | prompt | baseline | MTP | speedup | draft |
|---|---|---:|---:|---:|---:|
| math | `What is 1048576^0.05` | 50.7 t/s | 72.3 t/s | 1.43x | 84/93 = 90% |
| eggs-story | `Write a fun story about eggs and Palpatine` | 50.6 t/s | 50.0 t/s | 0.99x | 45/51 = 88% |
| quicksort-instruction | quicksort explanation/code | 50.4 t/s | 50.8 t/s | 1.01x | 67/79 = 85% |

The important point is not exact numbers. It is the shape:

```text
math wins
story/code do not regress badly
```

## Sweeps that drove the choice

### `n_max`

With `p_min=0.0`, larger `n_max` increased upside on predictable prompts but made bad prompts much worse.

- `n_max=1`: high acceptance, little speedup; overhead eats most gains.
- `n_max=3`: less bad on story prompts, but gives up most upside.
- `n_max=12`: best upside on predictable prompts, catastrophic on story/code unless gated.

So `n_max=12` is kept for upside, but only with high `p_min`.

### `p_min`

For `Write a fun story about eggs and Palpatine`, 100 tokens, `n_max=12`:

| `p_min` | result |
|---:|---|
| 0.00 | ~27 t/s, 69/348 accepted; severe over-drafting |
| 0.80 | less bad |
| 0.99 | ~50 t/s, 45/51 accepted; near baseline |

For math, `p_min=0.99` still preserved a strong speedup.

### Other things checked

- `/v1/chat/completions` was not uniquely broken; `/completion` with the rendered chat prompt reproduced the same behavior.
- `--reasoning off` did not fix story/code regressions.
- `presence_penalty=0.0` vs `1.1` changed details but was not the main driver.
- Drafter CPU vs GPU placement was not the main driver in these sweeps.
- The vendored llama.cpp already effectively has the upstream KV-cell no-copy fix from #24277.

## Interpreting timings

Aggregate acceptance is useful but incomplete:

```text
draft_n_accepted / draft_n
```

High acceptance can still be near-baseline if few total draft tokens are accepted. Example: eggs with `p_min=0.99` has high acceptance but only 45 accepted draft tokens over 100 output tokens, so speed is roughly baseline.

Better future diagnostics would include accepted run length or per-position acceptance.

## Drafter conversion notes

Dense Gemma 4 drafters convert with the standard llama.cpp converter:

```bash
python convert_hf_to_gguf.py <hf-assistant-dir> --outfile drafter-f16.gguf --outtype f16
```

Notes:

- Keep drafter weights F16/Q8.
- Avoid Q8 KV cache for this path; it hurts acceptance and Metal KV quant is not optimized.
- Verify metadata:
  - `general.architecture = gemma4-assistant`
  - `embedding_length_out` equals target hidden size, e.g. 3840 for 12B.
- Sparse E2B/E4B assistant conversion was not working in this spike (`masked_embedding.centroids.weight` issue).

## Key links

- Gemma 4 MTP support: https://github.com/ggml-org/llama.cpp/pull/23398
- Google MTP docs: https://ai.google.dev/gemma/docs/mtp/mtp
- KV-cache copy fix: https://github.com/ggml-org/llama.cpp/pull/24277
