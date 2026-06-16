# fllama (fork)

> This is a fork of [Telosnex/fllama](https://github.com/Telosnex/fllama)
> with a specific fix for Flutter **Windows standalone** builds.
> All credit goes to the original authors. The upstream `README.md`
> and `LICENSE` are preserved unchanged.

## Why this fork exists

On Flutter Windows **standalone** builds (a built `.exe`, not `flutter
run`) with **native-assets** enabled, fllama hangs silently during the
helper-isolate setup: `await Isolate.spawn(...)` in
`_helperIsolateSendPort` never returns, even though the child isolate
runs correctly and the `SendPort` handshake actually completes.

The `Future<Isolate>` returned by `Isolate.spawn()` never resolves on
this configuration (the VM-level "isolate started" ACK is not
delivered back to the spawner). The `Completer` populated by the
child's `SendPort` handshake is the real synchronization mechanism, so
awaiting the spawn `Future` is unnecessary.

## What's different from upstream

Branch **`fix/windows-isolate-spawn-hang`**, a single commit on top of
upstream `db62c20`:

- `lib/io/fllama_io_inference.dart`: `await Isolate.spawn(...)` →
  `unawaited(Isolate.spawn(...))`

The commit message contains the full diagnosis methodology (cdb dump
+ 5-marker instrumentation discriminating the spawn flow).

## How to use this fork

In your `pubspec.yaml`:

```yaml
fllama:
  git:
    url: https://github.com/<your-username>/fllama.git
    ref: fix/windows-isolate-spawn-hang
```

(Replace `<your-username>` with the actual fork URL once pushed.)

## Known limitation

This fix addresses the **handshake-level** hang only. A separate
**downstream** blocker remains in the inference path on this same
configuration (a hang, not a crash, after the handshake completes).
It is unrelated to this fix and is still under investigation.

## Upstream status

A pull request proposing this fix will be opened against
[Telosnex/fllama](https://github.com/Telosnex/fllama). Once merged
upstream, this fork becomes obsolete — switch back to the original
repository.

## License

Same as upstream: **GPL v2** (a commercial license is also available
from Telosnex Inc. — see `LICENSE`). Any modifications in this fork
are likewise released under **GPL v2**, in compliance with the
original license. The original `LICENSE` file is preserved unchanged.
