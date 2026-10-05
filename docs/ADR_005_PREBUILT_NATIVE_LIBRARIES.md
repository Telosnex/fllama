# ADR 005 — Prebuilt native libraries, built by the same hook code that builds from source
Status: ACCEPTED (2026-10-05)

ADR 004 depends on this ADR. Its GPU packs (ADR 004 D13) work for every
app only if every app uses the same fllama build.

## 1. Problem

Four Telosnex packages ship native libraries through Dart build hooks. Each
package does it in a different way:

| Package | Library source now | Hook |
|---------|--------------------|------|
| fllama | Compiled by the hook with CMake (llama.cpp, Vulkan SDK) | 1,093 lines |
| webcrypto.dart | Compiled by the hook with `native_toolchain_cmake` (BoringSSL) | 523 lines |
| image_ffmpeg | Copied from binaries in git, checked against `native_artifacts/manifest.json` | 122 lines |
| fonnx | Downloaded from Microsoft, Maven and `Telosnex/fonnx` GitHub Releases, checked against `native_artifacts/manifest.json` | 435 lines |

These facts follow:

1. **Every app build compiles fllama and webcrypto.** A cold fllama build
   for Windows x64 with Vulkan took 16.5 minutes in the ARM64 VM (ADR 004
   risk 9). Each build machine needs CMake, a C++ compiler, and for GPU
   support the pinned Vulkan SDK.
2. **A GPU pack works only for one build.** fllama loads a pack only if its
   SHA-256 is equal to the value inside `fllama.dll` (ADR 004 D13, I5). Two
   machines give different bytes for the same commit. So each app must host
   its own packs.
3. **image_ffmpeg grows its git history with each binary release.** The
   binaries for one version are 36 MB. `.git` is 141 MB.
4. **The binary release scripts are not the hook.** image_ffmpeg builds with
   `tool/build_native_artifact.sh` and Docker. fonnx builds its extensions
   in GitHub workflows. A developer cannot run the release build with the
   hook.
5. **The four hooks repeat the same code:** download, SHA-256 check,
   content-addressed cache, file locks, cache directory, and target names.
   image_ffmpeg and fonnx use the same target names
   (`ios-arm64-iphonesimulator`). Their manifest formats are different.
6. **Apps bundle model files.** Telosnex bundles 57 MB of ONNX models in
   `assets/models` and copies them to disk at first use. fonnx keeps its
   models in Git LFS. Each package that downloads files at runtime (fllama
   GPU packs, fonnx models) needs its own download and check code in the
   app.
7. **webcrypto's build key is local.** It contains the compiler path, size
   and modified time. Two machines never compute the same key.

All four repositories are public on GitHub. fonnx already uploads its own
builds to GitHub Releases on immutable tags.

**Outcome.** Each package has one checked-in manifest that pins prebuilt
files by SHA-256. By default, the hook downloads those files if the package
sources match the manifest, and it compiles otherwise. GitHub Actions makes
the prebuilt files with the same hook code that a developer runs. A shared
package holds the code that is now repeated.

## 2. Requirements

| ID | Requirement | Source | Hardness |
|----|-------------|--------|----------|
| R1 | An app build that uses a released package needs no C or C++ toolchain and no GPU SDK. | founder | hard |
| R2 | A developer can build a package from source with one setting. The source build and the release build run the same hook code. | founder | hard |
| R3 | If the package sources differ from the sources of the prebuilt files, the hook does not use the prebuilt files. | assumed | hard |
| R4 | Every app that uses one fllama commit gets the same fllama build, so one hosted GPU pack works for all of them (ADR 004 D13). | founder | hard |
| R5 | The hook uses a downloaded file only after it checks a SHA-256 value from the package source (ADR 004 R12). | assumed | hard |
| R6 | A hosted file never changes and is never deleted while a commit of the package refers to it. | assumed | hard |
| R7 | New binary releases do not add binaries to git. | assumed | soft |
| R8 | Prebuilt Linux libraries run on glibc 2.39 (Telosnex snap base `core24`). | platform | hard |
| R9 | Prebuilt Linux libraries run on glibc 2.35 (Ubuntu 22.04). | assumed | soft |
| R10 | A release of prebuilt files needs no build on a developer machine. | assumed | soft |
| R11 | webcrypto.dart stays easy to merge with `google/webcrypto.dart`: changes stay in `hook/` and in new files. | assumed | soft |
| R12 | A Telosnex release fails if a package has no prebuilt files for its sources. | assumed | hard |
| R13 | Model files are downloads after install, not app assets (fonnx). | founder | soft |
| R14 | An app uses a downloaded runtime file only after it checks a SHA-256 value from the package source. | assumed | hard |

## 3. Decisions

```
D1: A shared package, native_prebuilt, holds the target names, the
    manifest format, the source key, download and check, the cache, the
    build mode, and the CI commands. Each package supplies its target list,
    its source build, and its output file names.
    Because: R2, R5, Problem item 5
    Instead of: a copy of the code in each hook, as now. Four copies already
    differ in manifest format and lock code.

D2: The build mode is the user define native_build: auto (default),
    download, or source.
    - auto: download if the manifest has the target and its source key is
      equal to the local source key. Else build from source. If the package
      cannot build from source on this host, fail with a message that names
      the release workflow.
    - download: download, or fail.
    - source: build from source.
    Because: R1, R2, R3
    Instead of: a manual switch only. A local edit or a path dependency then
    uses old prebuilt files without an error (R3).

D3: The source key is the SHA-256 of every file in the package, minus a
    fixed exclude list (§5). The key does not contain host data: no paths,
    no times, no compiler versions. Each package sets
    `* text=auto eol=lf` in .gitattributes.
    Because: R3, Problem item 7
    Instead of: a list of the input files. A file that the list omits
    changes the build but not the key (risk 2).
    Instead of: the git tree hash. A pub.dev package has no .git directory.

D4: The package keeps its local build key for its source build cache. That
    key contains the source key and the host toolchain.
    Because: R2
    Instead of: one key for both uses. A new local compiler must rebuild the
    local cache, but must not change which prebuilt files match.

D5: The prebuilt files are on GitHub Releases of the package repository.
    One release per source key. All targets of one release come from one
    workflow run. Immutable releases are on for each repository. A manifest
    entry can also point to an upstream URL (fonnx: Microsoft, Maven).
    Because: R4, R6, R10
    Instead of: the Backblaze bucket of ADR 004. GitHub Actions builds the
    files in the same repository, with no extra key. Downloads are free.
    Instead of: binaries in git (R7).

D6: The release workflow runs the hook of the package in mode source, with
    native_release = true, once per target. It then uploads every output
    file and writes native_artifacts/prebuilt.json. A pull request carries
    the new manifest. The merge of that pull request is the release.
    Because: R2, R4, R10
    Instead of: separate release scripts, as image_ffmpeg and fonnx use now
    (Problem item 4).

D7: native_release = true changes only what the package needs for hosted
    files. For fllama: GPU backends become GPU packs with SHA-256 values and
    URLs inside fllama.dll (ADR 004 D13). Without native_release, the hook
    publishes the GPU backends as code assets, and fllama loads them at the
    first call (ADR 004 D4).
    Because: R2, ADR 004 R8
    Instead of: GPU packs in every source build. A local build has no host
    for its packs, so a download is not possible.

D8: The workflow builds each target on a fixed GitHub runner (§5). Linux
    targets build on ubuntu-22.04 and ubuntu-22.04-arm. The manifest records
    the runner and the toolchain of each target. A package that needs an
    older glibc builds in a container, as image_ffmpeg does now (Debian 11).
    Because: R8, R9
    Instead of: ubuntu-latest, which moves to a newer glibc without a
    change in the package.

D9: Downloads go to one cache for all packages:
    <user cache>/native_prebuilt/<sha256>/<file name>. A file lock protects
    each entry. The hook checks the SHA-256 after each download, and before
    it publishes a file from the cache.
    Because: R5
    Instead of: one cache per package. Equal files then download twice.

D10: The Telosnex release script runs `dart run native_prebuilt:check` for
     the resolved checkout of each package. The check fails if the source key
     is not equal to the manifest key, or if a manifest URL does not return
     its file.
     Because: R6, R12
     Instead of: native_build: download in the Telosnex pubspec. A developer
     with a local fllama change then gets a build error.

D12: The manifest has a runtimeFiles section for files that do not depend
     on the target and that the hook does not build (fonnx models). Each
     entry has a name, a SHA-256, a size and a URL. The release workflow
     uploads new files to a release named after a hash of the section
     (§5). The hook generates a Dart file with the section, so the package
     can give the list to the app.
     Because: R6, R13, R14
     Instead of: models in the per-target section. Every target then repeats
     the same entries.
     Instead of: models as code assets. Every app then contains every model.

D13: The shared package has a runtime library, native_prebuilt/runtime.dart,
     with no Flutter dependency. Apps use it for GPU packs and models. It
     downloads to a temporary file, gunzips if needed, checks the SHA-256,
     then renames the file into place. A file with the right SHA-256 is not
     downloaded again.
     Because: R14, Problem item 6
     Instead of: download code in each app, as ADR 004 step 5 planned.

D11: Adoption order: webcrypto, fllama, image_ffmpeg, fonnx.
     Because: R11, ADR 004
     webcrypto has one library and one CMake build, so it tests the full
     flow with the least risk. fllama is next because ADR 004 depends on it.
     image_ffmpeg changes only where its files come from. fonnx works now,
     so it is last.
```

## 4. Invariants

```
I1: The hook publishes a prebuilt file only if its SHA-256 is equal to the
    manifest value.
    If violated: an app ships a file that its package source did not pin.
    Pinned by: planned unit test with a changed cache entry and with a
    changed download.

I2: The source key is equal on macOS, Linux and Windows for the same
    commit, from a git checkout and from the pub cache.
    If violated: auto builds from source on some hosts, and download fails
    there.
    Pinned by: planned release workflow job that computes the key on the
    three runner types and compares it to the manifest.

I3: In mode auto, a change to a file that is not excluded (§5) makes the
    hook build from source.
    If violated: a local change has no effect, with no error (R3).
    Pinned by: planned unit test that changes one source file.

I4: Each manifest at a commit on the main branch refers only to files that
    exist and have the manifest SHA-256.
    If violated: builds from that commit fail in mode download, and
    released apps cannot download a GPU pack (ADR 004 I1 then applies).
    Pinned by: native_prebuilt:check on each pull request that changes a
    manifest, and once a day on main.

I5: The source build and the prebuilt build of one package give the same
    code asset IDs and the same file names, except the GPU pack files of D7.
    If violated: Dart code finds a library in one mode and not in the other.
    Pinned by: planned check in the release workflow that compares the asset
    list of mode source with the manifest.

I6: All files of one target come from one hook run (ADR 004 I5).
    If violated: files from two builds load in one process.
    Pinned by: the workflow writes all entries of a target from one job.

I7: The runtime library never leaves a file at its final path unless the
    file has the expected SHA-256.
    If violated: an app loads a partial or changed model or GPU pack.
    Pinned by: planned unit tests with a cut download and a changed
    download.
```

## 5. Formats & names

User defines, in the `hooks: user_defines: <package>:` section of the app
pubspec:

```
native_build: auto | download | source   # default auto
native_release: true                     # set only by the release workflow
```

Target names (`<os>-<arch>`, iOS with the SDK):

```
android-arm  android-arm64  android-x64
ios-arm64-iphoneos  ios-arm64-iphonesimulator  ios-x64-iphonesimulator
linux-arm64  linux-x64
macos-arm64  macos-x64
windows-arm64  windows-x64
```

Manifest: `native_artifacts/prebuilt.json` in each package.

```json
{
  "schema": 1,
  "sourceKey": "<64 hex>",
  "release": "https://github.com/Telosnex/fllama/releases/tag/native-<16 hex>",
  "targets": {
    "windows-x64": {
      "runner": "windows-2022",
      "toolchain": "MSVC 19.44, Vulkan SDK 1.4.357.0",
      "files": [
        {
          "name": "fllama.dll",
          "sha256": "<64 hex>",
          "url": "https://github.com/Telosnex/fllama/releases/download/native-<16 hex>/windows-x64-fllama.dll.gz",
          "downloadSha256": "<64 hex>",
          "delivery": "bundle"
        },
        {
          "name": "ggml-vulkan.dll",
          "sha256": "<64 hex>",
          "url": "…/windows-x64-ggml-vulkan.dll.gz",
          "downloadSha256": "<64 hex>",
          "delivery": "runtime",
          "pack": "vulkan"
        }
      ]
    }
  },
  "runtimeFiles": {
    "release": "https://github.com/Telosnex/fonnx/releases/tag/runtime-<16 hex>",
    "files": [
      {
        "name": "pyannote_seg3.onnx",
        "sha256": "<64 hex>",
        "bytes": 5986908,
        "url": "…/releases/download/runtime-<16 hex>/pyannote_seg3.onnx.gz",
        "downloadSha256": "<64 hex>"
      }
    ]
  }
}
```

- `sha256`: the file after gunzip or after extraction from the archive.
- `downloadSha256`: the bytes at `url`.
- `archiveEntry`: optional. The path of the file inside a zip or AAR
  archive (fonnx upstream files).
- `delivery`: `bundle` (a code asset in the app) or `runtime` (the app
  downloads it after install, ADR 004 D14).
- A manifest without a target means: no prebuilt files for that target.

Release tag: `native-<first 16 hex of the source key>`. Asset name:
`<target>-<file name>.gz`.

Runtime file release tag: `runtime-<first 16 hex>` of the SHA-256 over the
lines `<name>\t<sha256>\n`, sorted by name. Asset name: `<name>.gz`. A new
release has every file of the section, so an old app keeps its URLs.

Generated Dart file: `lib/src/native_prebuilt.g.dart` with the
`runtimeFiles` section as constants. It is in the exclude list of the
source key.

Source key: SHA-256 over the lines `<path>\t<SHA-256 of the file>\n`, sorted
by path, for every file in the package root. Paths use `/`. Excluded:

```
.git/  .dart_tool/  build/  example/  test/  integration_test/  docs/
native_artifacts/prebuilt.json  lib/src/native_prebuilt.g.dart
*.md  pubspec.lock
```

A package can add excludes in its hook. It cannot remove these.

Cache: `<user cache>/native_prebuilt/<sha256>/<file name>`. `<user cache>`
is `%LOCALAPPDATA%` on Windows, `~/Library/Caches` on macOS, and
`$XDG_CACHE_HOME` or `~/.cache` on Linux.

Release workflow runners:

| Targets | Runner |
|---------|--------|
| windows-x64 | windows-2022 |
| windows-arm64 | windows-11-arm |
| linux-x64 | ubuntu-22.04 |
| linux-arm64 | ubuntu-22.04-arm |
| macos-*, ios-* | macos-15 |
| android-* | ubuntu-22.04 with the NDK version of the package |

Commands of the shared package:

```
dart run native_prebuilt:build --target <target> --out <dir>   # hook, mode source, native_release
dart run native_prebuilt:release --tag native-<16 hex> <dirs…> # upload, write prebuilt.json
dart run native_prebuilt:check [--download]                    # D10, I2, I4
dart run native_prebuilt:runtime_release <files…>              # D12
```

Shared package: `Telosnex/native_prebuilt` on GitHub, a git dependency of
each package, pinned to a commit.

## 6. Non-goals

```
NG1: Remove the old binaries from the image_ffmpeg git history.
     Reopens when: a clone of image_ffmpeg takes more than one minute on
     the Telosnex release runner.

NG2: Web files (fllama wasm, fonnx web assets).
     Reopens when: a web build needs a toolchain that a web developer does
     not have.

NG3: Reproducible builds.
     Reopens when: a user needs to prove that a prebuilt file comes from
     its source.

NG4: Packages on pub.dev.
     Reopens when: one of the four packages publishes to pub.dev.

NG5: Other hosts and mirrors for prebuilt files.
     Reopens when: GitHub Releases is not available for a Telosnex release
     build, or a user needs an offline mirror. Mode source works offline.
```

## 7. Risks

Ranked by irreversibility.

1. **A hosted file is deleted or changed.** Shipped apps then cannot
   download a GPU pack and run on the CPU (ADR 004 I1). Builds from old
   commits fall back to source in mode auto. Immutable releases stop a
   change. A repository owner can still delete a release. I4 finds it within
   one day. Recovery: upload the file again from the workflow artifacts,
   under the same tag.
2. **The source key does not cover a build input.** Examples: a file outside
   the package, or an environment variable that the hook reads. Prebuilt
   files and local source builds can then differ with no error. D3 uses an
   exclude list to make this less likely. The hook must not read inputs
   from outside the package, except the toolchain.
3. **Every hook change makes a new release.** The hook file is in the
   source key, so a change to download code also changes the key. Mode auto
   then builds from source until the release pull request merges. Cost:
   one workflow run.
4. **The CI toolchain is not the local toolchain.** A defect can occur in
   only one mode. The manifest records the toolchain of each target.
5. **Runner images change.** A runner update can change the compiler
   inside a fixed runner label. A key that does not change can then get
   different bytes on the next release. This is not a problem, because each
   release records its own file hashes.
6. **The hooks API changes.** `native_prebuilt:build` calls the hook of the
   package outside a Flutter build. A new `hooks` version can break that
   call. Workplan step 1 decides the method.
7. **Windows ARM64 GPU SDKs on the runner.** ADR 004 D12 is not decided.
   The Vulkan SDK and the OpenCL headers must install on `windows-11-arm`.

## 8. Workplan

1. **Shared package.** Create `Telosnex/native_prebuilt`. Move the
   download, lock and cache code from the fonnx hook. Add the manifest
   model, the source key, the mode resolution (D2), and the three commands
   (§5). Spike first: run the webcrypto hook for one target from
   `native_prebuilt:build`, with no Flutter app. Record the method in §A.
   Add unit tests for I1 and I3, and for the D2 modes.
2. **webcrypto.dart.** Add `.gitattributes`. Add mode resolution in front
   of the source build, with changes only in `hook/` (R11). Split its key
   into the source key and the local key (D4). Add the release workflow for
   all targets. Make the first release. Done when Telosnex builds webcrypto
   in mode download on the Windows ARM64 VM with no CMake on `PATH`.
3. **fllama.** Do step 2 for fllama. Then change ADR 004 step 4b code:
   - Generate the GPU pack hashes only with `native_release` (D7).
   - Without `native_release`, publish the GPU backends as code assets.
   - Replace the `gpu_pack_dir` user define with the release asset names.
   - `fllama_get_gpu_pack_files` returns `url`. Remove `relativePath` and
     `fllamaGpuPackObjectPrefix` from Dart.
   - Install the pinned Vulkan SDK in the Windows and Linux jobs.

   Done when the Windows x64 integration test passes in mode download with
   the pack from the release, and in mode source with the bundled backend.
4. **Telosnex check.** Add `native_prebuilt:check` for all four packages to
   `dev/ci/releases/release.dart` (D10). Remove the Vulkan SDK and CMake
   requirements from the Telosnex release runners after step 6.
5. **image_ffmpeg.** Move its build scripts into the hook source build
   where the host can run them. Keep the Docker build for Linux targets.
   Make the first release. Delete the binaries from the working tree (NG1).
6. **fonnx.** Replace the download code in its hook with the shared code.
   Convert its manifest. Keep the upstream URLs. Its extension workflows
   become the release workflow. Move its models to `runtimeFiles`. Then
   Telosnex downloads them with the runtime library and stops bundling
   them (a Telosnex ADR).

---

## ──────── non-normative ────────

### A. Alternatives & notes

- **Sign the files instead of a pinned SHA-256.** Builds from other
  machines can then use the official GPU packs. The check of the llama.cpp
  commit and the build options moves into metadata, so ADR 004 I5 becomes
  weaker. Not needed when every app uses the same build (R4).
- **Reproducible builds.** Every machine gives the same bytes, so no host is
  needed for the libraries. MSVC and the Vulkan shader build are hard to
  make reproducible. NG3.
- **Backblaze B2.** It needs a key in CI and a separate upload step. GitHub
  Releases is in the same repository as the workflow (D5).
- **One manifest format per package**, as now. Lost to D1. The fonnx
  `webAssets` and `runtimeConstraints` fields stay in its own
  `native_artifacts/manifest.json`.
- **Step 1 spike (2026-10-05).** `native_prebuilt:build` can run a hook with
  no Flutter app. It builds a `BuildInput` with `BuildInputBuilder` and
  `CodeAssetExtension` from `hooks` 1.0.3 and `code_assets` 1.0.0, writes it
  to JSON, and runs `dart run hook/build.dart --config=<file>` in the package
  root. `ProtocolBase.validateBuildOutput` then checks the output. User
  defines go through `PackageUserDefines.workspacePubspec`. Results for
  webcrypto: macOS arm64, iOS arm64 and macOS x64 build in 10 s each with
  no validation errors. macOS x64 first failed at link time: the BoringSSL
  source list omitted the fiat ADX assembly for Apple x86_64 (fixed in
  webcrypto.dart `telosnex_main`). Risk 6 remains: these builder classes are
  public API, but a new `hooks` major version can change them.
- **The sqlite3 Dart package** has a similar design: its hook downloads
  prebuilt libraries by default, and a user define selects a source build.

### B. Revision history

- 2026-10-05: First draft.
- 2026-10-05: Approved. fonnx runtime files are models: R13, R14, D12, D13,
  I7.
