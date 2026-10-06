"""Collect per-object nvcc timings and Ninja logs from the hook cache.

Run after a native build, including a failed build. Only diagnostic files are
copied; no libraries or source files. Times are summed compiler work, NOT the
elapsed build time (parallel jobs overlap). No third-party Python dependencies.
"""

import argparse
import csv
import os
from collections import defaultdict
from pathlib import Path
import shutil


def cache_root():
    if os.environ.get("XDG_CACHE_HOME"):
        return Path(os.environ["XDG_CACHE_HOME"]) / "fllama"
    if os.name == "nt":
        return Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData/Local"))) / "fllama/Cache"
    return Path.home() / ".cache/fllama"


def summarize(root, out):
    root, out = Path(root), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    phases = defaultdict(float)
    files = []
    raw = sorted(root.rglob("*.nvcc-timing.csv"))
    for source in raw:
        phase_ms = 0.0
        with source.open(newline="", encoding="utf-8-sig", errors="replace") as stream:
            for row in csv.reader(stream):
                # nvcc --time columns: source, phase, inputs, output, arch,
                # tool, metric, unit. The metric is the second-last column.
                row = [cell.strip() for cell in row]
                if len(row) < 8 or row[-1] != "ms":
                    continue
                try:
                    milliseconds = float(row[-2])
                except ValueError:
                    # Header, or an incomplete row from a failed compiler.
                    continue
                phases[f"{row[1]} [{row[4] or 'all'}]"] += milliseconds
                phase_ms += milliseconds
        wall = source.with_name(source.name.removesuffix(".nvcc-timing.csv") + ".nvcc-wall-seconds")
        seconds = float(wall.read_text().strip()) if wall.exists() else None
        files.append((seconds, phase_ms / 1000, str(source.relative_to(root))))

    # Preserve raw CSVs, launcher wall times, and Ninja's per-command timeline.
    diagnostics = [*raw, *root.rglob("*.nvcc-wall-seconds"), *root.rglob(".ninja_log")]
    for source in diagnostics:
        dest = out / "raw" / source.relative_to(root)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
    lines = [
        "## CUDA compile timings",
        f"Objects with nvcc CSVs: **{len(files)}**",
        "",
        "Summed compiler work below is not elapsed build time: parallel jobs overlap.",
        "Launcher wall times have one-second resolution. Raw CSVs and Ninja timelines are in the artifact.",
        "",
        "### Slowest CUDA objects",
        "| Wall seconds | nvcc phase seconds | Object |",
        "| ---: | ---: | --- |",
    ]
    for seconds, phase_seconds, name in sorted(files, key=lambda item: item[0] if item[0] is not None else item[1], reverse=True)[:20]:
        seconds_text = f"{seconds:.0f}" if seconds is not None else "n/a"
        lines.append(f"| {seconds_text} | {phase_seconds:.2f} | `{name.removesuffix('.nvcc-timing.csv')}` |")
    lines += ["", "### Compiler phases (summed across all objects)", "| Phase | Seconds |", "| --- | ---: |"]
    for phase, milliseconds in sorted(phases.items(), key=lambda item: item[1], reverse=True):
        lines.append(f"| {phase} | {milliseconds / 1000:.2f} |")
    text = "\n".join(lines) + "\n"
    (out / "summary.md").write_text(text, encoding="utf-8")
    return text


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=cache_root())
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    print(summarize(args.cache, args.out), end="")
