# ADR 004 — One desktop build per CPU architecture that selects the GPU and CPU code at run time
Status: DRAFT, partly implemented (first draft 2026-10-04, updated 2026-10-06)
Depends on: ADR 005 (prebuilt native libraries). A GPU pack works for every
app only if every app uses the same fllama build.

## 0. Implementation status (2026-10-06)

fllama release `native-580a44799cc1e0f1` contains the fllama part of this
ADR for Windows x64, Windows ARM64 (CPU only) and Linux x64. Telosnex uses
Auto GPU layers. Telosnex does not download GPU packs yet. Thus Windows and
Linux users of Telosnex still run local AI on the CPU.

fllama branch `cuda-pack` builds the CUDA pack in its own workflow (D16).
No CUDA pack is published yet, and no fllama release contains one. The
CUDA gate (step 12) has not run.

| Area | State | Evidence |
|------|-------|----------|
| No OpenMP on Windows (D6) | Done | fllama `d97bd7a` |
| Split libraries, CPU variants, loader (D1, D2, D4, D11) | Done | fllama `832cf2b` |
| Vulkan from the pinned SDK (D3) | Done | fllama `ce2e308` |
| GPU packs in fllama (D13) | Done | fllama `515b45e`, ADR 005 step 3 |
| Release workflow and pack hosting (D7) | Done | ADR 005 steps 1 to 4 |
| Device keys and `gpu_device_key` in fllama (D9) | Done | fllama `832cf2b` |
| Auto layers and draft check in Telosnex (D5, R17) | Done | Telosnex `b37eef6417` |
| GPU pack download in Telosnex (D14) | Not started | |
| Crash recovery for inference | Done | Telosnex crash flags and startup recovery |
| Crash recovery for GPU discovery, memory queries and pack loading (D15) | Not started | Existing recovery does not cover these calls |
| GPU picker in Telosnex (D9) | Not started | |
| Windows ARM64 GPU backend (D12) | Not decided | Needs step 9 benchmark |
| ARM64 MSIX (D10) | Not started | |
| I3 and I4 checks in `release.dart` | Not started | |
| Hardware tests and Apple measurements (steps 6, 9) | Not started | |
| Linux snap GPU plug (step 10) | Not started | |
| CUDA pack build, key and release check (D8, D16) | Implemented on branch `cuda-pack`, no pack published | §5 CUDA pack; `test/cuda_pack_test.dart` |
| CUDA runtime loading and NVIDIA GPU probe (D8, D13, D14) | Done on branch `cuda-pack`, not tested on NVIDIA hardware | `load_dependency_file`, `fllama_has_cuda_gpu` |
| First published CUDA pack and fllama release with it (D16) | Not done | First `cuda_pack.yml` run in progress |
| CUDA gate and hardware test (steps 12, 13) | Not started | Gate not run; no Nvidia test machine |

## 1. Problem

Telosnex ships one Windows x64 package through the Microsoft Store. fllama
runs llama.cpp inside that package. At fllama `d4e262e` and llama.cpp
`ece963f41`, the native build had the properties below. Each item gives its
current state in brackets.

1. **Windows has no GPU acceleration.** `hook/build.dart` and
   `src/CMakeLists.txt` set `LLAMA_VULKAN=ON`. llama.cpp does not read this
   name. Only `GGML_VULKAN` enables Vulkan. The CMake caches of all six Windows
   builds in the test VM contain `GGML_VULKAN:BOOL=OFF`. (Observed.)
   [Fixed in fllama. The release has a Vulkan pack for Windows x64. Telosnex
   does not download it yet (D14).]
2. **Windows x64 CPU code does not use AVX.** `native_toolchain_cmake` 0.2.7
   always passes `CMAKE_SYSTEM_NAME`, so CMake marks each build as a cross
   build. ggml then disables SSE4.2, AVX, AVX2, BMI2, FMA and F16C. The x64
   cache `d11d429c115fb668` contains `GGML_AVX2:BOOL=OFF`. The CPU code uses
   only SSE2. (Observed in the VM. The release runner uses the same code path.
   Inferred.) [Fixed by D2. The emulated x64 build in the ARM64 VM selects
   `ggml-cpu-haswell.dll`.]
3. **The package does not contain a runtime file that fllama needs.** The x64
   `fllama.dll` imports `VCOMP140.DLL`, which is the Microsoft OpenMP runtime.
   `msix` 3.18.0 copies only the C++ runtime DLLs into the package. It does not
   copy `vcomp140.dll`. On a PC without the Visual C++ Redistributable,
   Windows cannot load `fllama.dll`, and local AI fails. (Imports and package
   list observed. The load failure is inferred and not reproduced.)
   [Fixed by D6 in `d97bd7a`.]
4. **The GPU layer count disables memory fitting.** Telosnex sends
   `n_gpu_layers = 99` on Windows, macOS and iOS
   (`lib/features/local_llm/fllama_process.dart`). llama.cpp fits the layers to
   free GPU memory only when `n_gpu_layers` is −1 (`common/fit.cpp:377`). With
   99, a model that is larger than the GPU memory does not get a partial
   offload. The same file enables the draft model only when the layer count
   is greater than 0. The user cannot change the layer count. (Source
   observed. The failure on discrete GPUs is inferred.) [Fixed by D5 in
   Telosnex `b37eef6417`.]
5. **Linux uses only the CPU.** Telosnex sends `n_gpu_layers = 0` on Linux and
   Android. The Linux x64 build has the same cross-build defaults as item 2.
   (Telosnex source observed. Linux CPU flags inferred.) [Partly fixed.
   Linux x64 has all 14 CPU variants and a Vulkan pack. Telosnex sends -1.
   Telosnex does not download the pack yet (D14).]
6. **Windows ARM PCs run the x64 package in emulation.** Telosnex does not
   ship an ARM64 package, so Snapdragon PCs run x64 code through Windows
   emulation. The fllama ARM64 build exists, but it uses the ClangCL toolset
   with no `-march`, so its CPU code is plain ARMv8.0 without the dot-product
   instructions. (Toolset observed. CPU flags inferred from the clang default
   target.) [Partly fixed. fllama has the D11 CPU variants, and the ARM64
   VM selects the dot-product variant. Telosnex has no ARM64 package yet.]

**Outcome.** One Telosnex Store listing contains an x64 package and an ARM64
package. Each package uses the GPU with no user setup. If no GPU works, it uses
the fastest CPU code that the CPU supports. On all GPU platforms, llama.cpp
fits the model to free GPU memory. Users who know llama.cpp can turn off the
GPU, set the layer count, and later add CUDA. Android is out of scope (§6).

Item 3 was independent of this ADR. Workplan step 1 fixed it first.

## 2. Requirements

| ID | Requirement | Source | Hardness |
|----|-------------|--------|----------|
| R1 | Windows users install one Telosnex app from one Store listing. There is no separate GPU edition. | founder | hard |
| R2 | GPU acceleration needs no user action other than a normal GPU driver. | founder | hard |
| R3 | Nvidia, AMD and Intel GPUs get GPU acceleration. | founder | hard |
| R4 | If a PC has no usable GPU or GPU driver, local AI runs on the CPU. | founder | hard |
| R5 | The CPU code never uses an instruction that the CPU does not have. | physics | hard |
| R6 | The CPU code uses the newer vector instructions of the CPU when the CPU has them (x64: AVX2 and later. ARM64: dot product and later). | assumed | soft |
| R7 | Every native library in a package loads on a clean Windows install with only the files in the package. | platform | hard |
| R8 | A backend library that adds 10 MB or more to a package, and that some users of the package cannot use, is not in the package. The app downloads it when the PC needs it. | founder | hard |
| R9 | A release build cannot ship without its GPU backend. | assumed | hard |
| R10 | A user can turn off the GPU, select one GPU, and set the GPU layer count. | founder | soft |
| R11 | Nvidia users can use CUDA. | founder | soft |
| R12 | The app loads downloaded native code only after it checks a SHA-256 value that ships inside the app. | assumed | hard |
| R13 | A developer machine without GPU SDKs can still build fllama. | assumed | soft |
| R14 | `src/llama.cpp` stays an unpatched upstream copy (ADR 003 §2b). | assumed | hard |
| R15 | Windows ARM64 PCs run native ARM64 Telosnex code. | founder | hard |
| R16 | Snapdragon GPUs get GPU acceleration. | founder | soft |
| R17 | The user can set the GPU layer count on every native platform. | founder | hard |

R8 applies to every backend, for example Vulkan and CUDA. The x64
`ggml-vulkan.dll` is 51.8 MB (16.0 MB gzip), and PCs without a Vulkan GPU
cannot use it. The CPU variants stay in the package: they are 8.0 MB
together, and every PC uses one of them.

R10 and R17: on 2026-10-05 the founder chose one Telosnex control, "GPU
layers: Auto / number". `0` turns off GPU offload. Telosnex has no separate
GPU on/off setting and no GPU picker. D15 extends the existing crash recovery.

R11 is soft because the founder asked whether CUDA is possible. The founder
did not require it. R16 is soft because the Windows ARM64 GPU backends have
less upstream test coverage than the x64 backends.

## 3. Decisions

```
D1: On Windows x64, Windows ARM64 and Linux x64, build ggml with
    GGML_BACKEND_DL=ON. Ship each backend as a separate library.
    Because: R1, R4, R5
    Instead of: a GPU backend linked into fllama.dll. If the GPU loader DLL
    is missing, Windows cannot load fllama.dll, and the CPU path is also
    lost (R4).

D2: x64: build all CPU variants (GGML_CPU_ALL_VARIANTS=ON). At load time,
    fllama loads the variant with the highest ggml_backend_score.
    Because: R5, R6
    Instead of: one AVX2 build, which crashes on CPUs without AVX2 (R5). The
    current SSE2 build does not satisfy R6.

D3: Vulkan is the x64 GPU backend. It is a GPU pack (D13), not a file in
    the package.
    Because: R2, R3, R8
    Instead of: Vulkan inside the package (R8).
    Instead of: CUDA as the main backend. CUDA works only on Nvidia, and its
    files are about 700 MB unpacked at upstream b11396 (R3). ROCm/HIP works
    only on AMD, and its archive is 257 MB.

D4: fllama loads the backends itself. At the first fllama call, it loads
    the GPU backends in the fllama library directory (if the GPU is
    allowed), then the selected CPU variant from that directory. It loads
    GPU packs (D13) when the app calls fllama_load_gpu_pack, before or after
    the first call. The app loads the CUDA pack before the Vulkan pack.
    Because: R4, R10, R11
    Instead of: ggml_backend_load_all(). It searches only the executable
    directory and the working directory. flutter test and the Linux bundle
    put the libraries in other directories. It also cannot skip the GPU
    backends or load from a second directory.

D5: On every native platform, Telosnex sends n_gpu_layers = -1 (auto),
    unless the user sets a number. Only web and test runs keep 0. The draft
    model is enabled when the layer count is not 0.
    Because: R2, R10, R17
    Instead of: 99, which disables llama.cpp memory fitting (Problem item 4).
    Instead of: per-platform defaults. One rule is simpler. On a platform
    without a GPU backend, -1 gives the same result as 0.
    Instead of: keeping the draft check at "greater than 0", which turns off
    the draft model for -1.
    State: done in Telosnex `b37eef6417`, on every native platform. Invalid
    saved values become -1.
    The test request in the custom-model setup dialog still sends 0, so
    that test runs on the CPU.

D6: Build all Windows targets with GGML_OPENMP=OFF.
    Because: R7
    Instead of: bundle vcomp140.dll (x64) and libomp140.aarch64.dll (ARM64).
    Upstream llama.cpp copies libomp140 from the Visual Studio folder
    debug_nonredist, so that file is not redistributable. One policy for all
    Windows targets is less to maintain.

D7: Apps use the prebuilt fllama build of ADR 005. Its release workflow
    installs the pinned GPU SDKs and compiles every GPU backend. A local
    source build compiles a GPU backend when it finds the pinned SDK. If it
    does not find the SDK, it builds the CPU backends only and logs a
    warning. The fllama release workflow fails if a Windows x64 or Linux x64
    build has no GPU pack (I4).
    Because: R9, R13, R14
    Instead of: a GPU build on each app build machine. Each machine then
    needs the SDK, and each app must host its own packs (ADR 005 §1).
    Instead of: upstream prebuilt libraries (the fonnx pattern). They must
    match the local ggml-base exactly (I5).

D8: CUDA is a GPU pack (D13) for x64 PCs that have an Nvidia GPU. Work
    starts only after a benchmark shows that CUDA is materially faster than
    Vulkan with Telosnex models.
    Because: R1, R8, R11
    Instead of: a separate CUDA edition (R1), or CUDA inside the package (R8).
    State: the pack build exists for Windows x64 and Linux x64 (D16). The
    step 12 gate has not run. The founder chose to build the pipeline
    first.

D9: fllama reports every GPU, discrete and integrated, with its backend
    name, type and device key (§5). A request that names a device key gives
    llama.cpp only that device. If no device has the key, fllama uses Auto
    and logs a warning. Telosnex settings show one GPU control, "GPU
    layers: Auto / number", on every native platform. `0` means CPU only.
    The layer setting does not require an app restart. Crash recovery uses
    D15, not a startup call to fllama_set_gpu_allowed(false).
    Because: R10
    Instead of: the GGML_VK_VISIBLE_DEVICES environment variable. The user
    must set it outside the app and must know the Vulkan device number.
    Instead of: the device number as the saved value. The order of devices
    can change after a driver update or when a GPU is added.
    State: the fllama part is done (`832cf2b`). Telosnex sends no device key
    and does not call fllama_set_gpu_allowed. With `0`, Telosnex does not
    offload layers, but fllama still loads the GPU backends.

D10: The Telosnex Store submission contains an x64 MSIX and an ARM64 MSIX.
     The ARM64 MSIX is built on a Windows ARM64 runner.
     Because: R1, R15
     Instead of: an x64-only package. Emulated x64 code is slower, and the
     x64 GPU backend depends on the x64 emulation of the Adreno driver.
     Instead of: cross-building ARM64 on the x64 runner. Every native
     package in Telosnex must then support the cross build. The ARM64 VM
     already builds Telosnex natively.

D11: ARM64 CPU: build two CPU variants, an ARMv8.0 baseline and an
     ARMv8.2 + dot-product variant. fllama selects the variant with
     IsProcessorFeaturePresent(PF_ARM_V82_DP_INSTRUCTIONS_AVAILABLE).
     Because: R5, R6, R14
     Instead of: GGML_CPU_ALL_VARIANTS. llama.cpp stops with "Unsupported
     ARM target OS" for Windows ARM, and its ARM feature detection does not
     support Windows.
     Instead of: one -march=armv8.7-a build, as in upstream
     cmake/arm64-windows-llvm.cmake. It uses i8mm, and Snapdragon 8cx CPUs
     before Snapdragon X do not have i8mm (inferred).
     State: done (`832cf2b`). The main build makes the baseline. A second
     CMake build in `cpu-armv8.2-dotprod/` builds only `ggml-cpu`. The
     release contains both variants.

D12: ARM64 GPU: the package contains the backend that wins the step 9
     benchmark on a Snapdragon X PC. The candidates are OpenCL with the
     Adreno kernels and Vulkan.
     Because: R2, R8, R16
     Upstream releases ship the OpenCL Adreno backend for Windows ARM64.
     They ship no Windows ARM64 Vulkan backend. Qualcomm maintains the
     OpenCL backend. Vulkan is one less build path, because x64 already
     uses it. Every Windows ARM64 PC has an Adreno GPU, so the selected
     backend stays in the package. If it is Vulkan and some Adreno drivers
     cannot run it, R8 applies.
     State: not decided. `findVulkanSdk` returns null for Windows ARM64, and
     the hook does not build OpenCL. The ARM64 release has no GPU backend.

D13: A GPU pack is a set of backend libraries that the ADR 005 release
     build (native_release) builds in the same CMake build as fllama, but
     does not publish as code assets. The build writes the SHA-256 and the
     URL of each pack file into fllama (`src/cmake/gpu_packs.cmake`
     generates a source file, and a `gpu_packs.json` that tells the hook
     which libraries are pack files). The fllama release workflow uploads
     each file to the fllama GitHub release (ADR 005 §5).
     fllama_load_gpu_pack loads a file only if its SHA-256 is equal to the
     value inside fllama. A local source build has no GPU packs. It
     publishes the GPU backends as code assets (ADR 005 D7).
     Because: R8, R12, I5
     Instead of: hashes in a manifest that the app downloads with the pack.
     The download can change both the file and the manifest (R12).
     Instead of: hashes in Telosnex assets. Flutter bundles the assets
     before the release script can read the hook output, so the release
     needs two builds.
     Instead of: a check of the fllama build key. An equal file hash also
     proves the same build (I5), and it is one check instead of two.
     State: done for the `vulkan` pack on Windows x64 and Linux x64. For
     the `cuda` pack, fllama_load_gpu_pack first loads the files that are
     not ggml backends (the CUDA runtime and cuBLAS libraries), then
     `ggml-cuda` (I6). Branch `cuda-pack`; not tested on NVIDIA hardware.

D14: Telosnex downloads a GPU pack when all of these are true: the
     platform has a pack, the GPU is allowed, fllama_has_vulkan_gpu (or
     fllama_has_cuda_gpu for the `cuda` pack, D8) finds a device, and the user starts a local model
     download or load. The model download screen states that GPU support is
     part of the download, with its size. Starting the download is the
     user consent. Telosnex then calls fllama_load_gpu_pack. If the download
     or the check fails, local AI runs on the CPU, and Telosnex tries the
     download again at the next model load.
     Because: R2, R4, R8, Store Policy 10.1.5 (risk 3)
     Instead of: a download at app start. Users who never use local AI do not
     need the pack, and 10.1.5 requires user consent.
     Instead of: a separate prompt or setting. R2 requires no extra user
     action. Recovery if Store review asks for one: a prompt before the
     first pack download.
     State: not started. native_prebuilt `runtime.dart` provides
     `ensureRuntimeFile`, which downloads, gunzips and checks one file.
     fllama provides both probes: `fllamaHasVulkanGpu()` and
     `fllamaHasCudaGpu()`. The CUDA probe uses only the NVIDIA driver,
     not the pack.

D15: Telosnex uses its existing fllama crash flags and startup recovery
     for GPU discovery, GPU memory queries, GPU probes and pack loading.
     It sets a flag before a native call that can initialize the driver.
     It clears the flag when the call finishes without a process crash.
     On the next launch after a crash, the existing recovery selects a
     fallback model before another risky local call.
     Because: R4, risk 1
     Instead of: a second crash recovery system or a restart requirement
     when the GPU layer setting changes.
     Instead of: requiring CPU-only inference to never touch the GPU
     driver. That stronger guarantee is not needed for crash recovery.
     State: inference has crash recovery. GPU discovery and memory
     queries do not. D14 must cover native probes and pack loading too.
     The network download stays outside the native-call crash flag.

D16: The CUDA pack is built by its own workflow,
     .github/workflows/cuda_pack.yml, once per CUDA pack key. Each target
     has a GitHub release `cuda-<target>-<key16>` with the gzipped pack
     files and a descriptor (§5). The fllama release build never compiles
     CUDA. It computes the key of its own sources, reads the descriptor of
     the published pack, and embeds the SHA-256 and the URL of each file
     (D13). The release fails if the pack for its key is not published. The
     key contains the ggml-base and ggml-cuda sources, the pack's CMake
     project, the CMake defines, the CUDA version and the pinned CUDA
     archives (§5). It does not contain fllama sources or the rest of
     llama.cpp.
     Because: R11, I5. A cold CUDA build takes 85 to 100 minutes on the
     Windows x64 runner and 46 to 76 minutes on the Linux x64 runner. The
     build is limited by CPU (about 4 busy cores in nvcc for the whole
     build), and most of the time is nvcc compiling each kernel once per
     GPU architecture. A change to fllama code, or a llama.cpp change
     outside ggml-base and ggml-cuda, must not wait for that build. Of the
     7 commits that changed vendored llama.cpp from 2026-04 to 2026-10, only
     the 3 upstream refreshes changed a CUDA pack key file.
     Instead of: CUDA in every release build. Every release then takes
     about 1.5 hours.
     Instead of: shipping a release without CUDA when the pack is missing.
     Founder decision: the release fails. A release without CUDA cannot get
     it later, because fllama contains the pack table.
     Instead of: a key of the whole llama.cpp tree. Then every llama.cpp
     edit rebuilds CUDA.
     Instead of: fewer GPU architectures. That reduces the build time but
     drops GPUs. It can still be done; it changes the key.
     Instead of: Ninja for Windows. Measured: no gain, because MSBuild
     already kept the 4 cores busy.
     Instead of: a run-time check of a ggml build hash in fllama. fllama
     already loads a pack file only if its SHA-256 equals the embedded
     value. The key check at release time decides which files those are.
     State: implemented on branch `cuda-pack`. No pack is published yet.
```

## 4. Invariants

```
I1: If a GPU pack is not downloaded, fails its SHA-256 check, or fails to
    load, or if the GPU loader DLL or a GPU device is missing, fllama runs
    inference on the CPU.
    If violated: local AI fails on PCs and VMs without a working GPU driver.
    Pinned by: integration test "rejects GPU pack files that are missing or
    changed". The chat tests after it then run on the CPU. The Windows x64
    integration tests pass in the ARM64 VM, which has no x64 Vulkan driver.
    Planned: a run in a clean x64 VM without a GPU driver (step 9).

I2: fllama never loads a CPU variant that uses an instruction that the CPU
    does not have.
    If violated: the app stops with an illegal-instruction error.
    Pinned by: ggml_backend_score in each x64 variant. The ARM64 VM selects
    `ggml-cpu-armv8.2-dotprod.dll` natively and `ggml-cpu-haswell.dll` for
    emulated x64. Planned: runs under Intel SDE with -nhm (no AVX) and -hsw
    (AVX2) that check the selected variant in the log. A unit test of
    `fllama_backends_pick_windows_arm64_cpu`. A run on an ARM64 CPU
    without dot product if one is available.

I3: Every library in a Windows package imports only Windows system DLLs,
    C++ runtime DLLs that the package contains, and other libraries in the
    package.
    If violated: the library cannot load on some PCs (Problem item 3).
    Pinned by: planned import check in dev/ci/releases/release.dart. D6
    removed the only known violation (`VCOMP140.DLL`).

I4: Each Windows or Linux release package contains its baseline CPU
    variant. Its fllama library expects at least one GPU pack (Windows ARM64:
    contains its GPU backend), and every pack URL returns its file.
    If violated: a release loses GPU support or CPU support without an error.
    Pinned by: the hook stops a Windows x64 or Linux x64 release build that
    has no Vulkan SDK (D7). native_prebuilt:check checks every release file
    and pack URL (ADR 005 D10, I4). Planned: a check in
    dev/ci/releases/release.dart that the package contains the baseline
    CPU variant.

I5: All ggml libraries in one process are built from the same ggml-base
    sources and with the same ggml-base CMake options. Every library
    except the CUDA pack also comes from the same build. The CUDA pack
    comes from the build of its CUDA pack key (D16).
    If violated: an ABI mismatch causes crashes or wrong output.
    Pinned by: the D13 SHA-256 check. A file from another build has a
    different SHA-256. Integration test "rejects GPU pack files that are
    missing or changed". For CUDA: the release build embeds only a pack
    whose key equals the key of its own sources (I11).
    `test/cuda_pack_test.dart` checks that the key covers every ggml
    header that ggml-base and ggml-cuda include. CI runs that file before
    each CUDA pack build (cuda_pack.yml) and before each release
    (`cuda-packs` job of native_release.yml). It also checks that the
    pack and fllama use the same ggml-base ABI options, and that the pack
    project repeats what llama.cpp's root CMake project sets for ggml.

I6: If the CUDA pack loads, Nvidia GPUs run on CUDA, and Vulkan does not
    also use the same GPU.
    If violated: two backends use the memory of one GPU.
    Pinned by: the D4 load order and the llama.cpp device de-duplication,
    which keeps the first device with a given device_id
    (src/llama.cpp, model device list). Both backends use the PCI bus ID as
    device_id. Vulkan reports no ID if the driver does not have
    VK_EXT_pci_bus_info. Planned test on Nvidia hardware.

I7: After fllama_set_gpu_allowed(false), fllama does not load any GPU
    backend library.
    If violated: the fllama API does not honor its backend-disable setting.
    Pinned by: `load_backends_from` skips GPU backends when the GPU is not
    allowed. fllama_load_gpu_pack and fllama_has_vulkan_gpu return an error
    or false. Planned: a loader test with the GPU turned off.
    This is a fllama API guarantee, not a Telosnex crash recovery
    requirement. Telosnex uses D15 and does not call this API.

I8: When a request names a device key that exists, the model and the
    draft model use only that GPU and the CPU.
    If violated: the user selection has no effect.
    Pinned by: integration test "an unknown GPU device key falls back to
    Auto" covers the fallback. Planned: a loader test with a fake device
    list, and the step 9 test on a PC with two GPUs if one is available.

I9: fllama_load_gpu_pack changes the backend list only when no model is
    loaded and no request runs. It unloads idle cached models first, so the
    next request loads the model again with the new backend.
    If violated: a model load reads the ggml backend list while another
    thread changes it.
    Pinned by: a registry lock that model loads share and the pack load
    holds alone. The function returns an error while a request runs.
    Integration test "refuses to load a GPU pack while a request runs".

I10: A crash during a guarded native GPU call leaves a flag that the
     existing startup recovery reads before another risky local call.
     Normal completion clears the flag. Crash detection runs at startup,
     not while another operation can still be active.
     If violated: a GPU query or pack load can cause repeated app crashes
     without the recovery that inference already has.
     Pinned by: planned tests for D15 flag lifetime and startup recovery.
     GPU discovery from the model-selection UI must have the same coverage.

I11: A fllama release for Windows x64 or Linux x64 contains the CUDA pack
     table of the published pack whose key equals the CUDA pack key of the
     release sources. The release fails if no such pack is published.
     If violated: a release ships without CUDA, or with a pack built from
     other ggml sources (I5).
     Pinned by: the `cuda-packs` job of native_release.yml, which runs
     `scripts/cuda_pack.dart resolve` before any build. The hook then
     calls `resolveCudaPack`, which computes the key again on the build
     runner and rejects a missing or different descriptor. Tests:
     `test/cuda_pack_test.dart` ("a release build without the pack fails
     with its release tag", "rejects a pack of other sources").
```

## 5. Formats & names

CMake defines for Windows x64 and Linux x64:

```
BUILD_SHARED_LIBS=ON
GGML_BACKEND_DL=ON
GGML_CPU_ALL_VARIANTS=ON
GGML_NATIVE=OFF
GGML_VULKAN=ON                          # only if the hook finds the SDK
GGML_OPENMP=OFF                         # all Windows targets
CMAKE_PLATFORM_NO_VERSIONED_SONAME=ON   # Linux
FLLAMA_GPU_PACK_VULKAN_URL=<asset URL>  # release builds only (D13)
```

On Linux, `src/CMakeLists.txt` sets the run path of each library to
`$ORIGIN`.

Windows ARM64 uses the same defines, except:

```
GGML_CPU_ALL_VARIANTS=OFF
GGML_CPU_ARM_ARCH=<armv8-a | armv8.2-a+dotprod>   # one value per CPU build
GGML_OPENCL=ON, GGML_OPENCL_USE_ADRENO_KERNELS=ON  # or GGML_VULKAN=ON (D12)
```

The ARM64 GPU line is not implemented yet (D12).

`LLAMA_VULKAN` is removed. A hook test checks that Windows never sets it.

Windows x64 libraries in the package (Linux uses `lib<name>.so`):

```
fllama.dll  llama.dll  mtmd.dll  ggml.dll  ggml-base.dll
ggml-cpu-{x64,sse42,sandybridge,haswell,skylakex,cannonlake,cascadelake,icelake,alderlake}.dll
```

GPU packs (D13):

| Pack | Files | Platforms |
|------|-------|-----------|
| `vulkan` | `ggml-vulkan.dll` / `libggml-vulkan.so` | Windows x64, Linux x64 |
| `cuda` (D8, D16) | `ggml-cuda` and the CUDA runtime and cuBLAS libraries | Windows x64, Linux x64 |

`llama-common` stays a static library inside `fllama.dll`. fllama replaces
its download functions (`src/fllama_download_stub.cpp`), and a shared
`llama-common` would need httplib.

CUDA pack (D16). `hook/cuda_pack.dart` defines the key, the CMake defines
and the descriptor. `scripts/cuda_pack.dart` builds, publishes and
resolves the pack.

```
Release tag:   cuda-<target>-<first 16 hex digits of the key>
Assets:        <target>-<file>.gz for each pack file, and cuda-pack.json
Files:         cudart64_12.dll, cublasLt64_12.dll, cublas64_12.dll,
               ggml-cuda.dll (Windows x64)
               libcudart.so.12, libcublasLt.so.12, libcublas.so.12,
               libggml-cuda.so (Linux x64)
Key inputs:    schema version, target, CUDA version, CMake generator,
               CMake defines (GGML_CUDA=ON, GGML_CPU=OFF,
               CMAKE_CUDA_ARCHITECTURES, ...), and the SHA-256 of:
                 src/cuda_pack/**
                 scripts/install_cuda_toolkit.dart
                 src/llama.cpp/ggml/CMakeLists.txt, ggml/cmake/**
                 ggml/src/* (except ggml-backend-reg.cpp, ggml-backend-dl.*)
                 ggml/src/ggml-cuda/**
                 ggml/src/ggml-cpu/ggml-cpu-impl.h (ggml-quants.c includes it)
                 ggml/include/{ggml,ggml-alloc,ggml-backend,ggml-cpp,
                   ggml-cpu,ggml-cuda,ggml-opt,gguf}.h
Not in key:    the compiler version. Runner images update MSVC often;
               the C ABI between ggml-cuda and ggml-base does not change
               with it. The descriptor records the toolchain.
Hook input:    user define cuda_pack=<path of cuda-pack.json>
CMake input:   FLLAMA_CUDA_PACK_FILES=<name>|<sha256>|<url>;...
```

`src/cuda_pack/CMakeLists.txt` builds `ggml/` directly, with
`GGML_CPU=OFF`, and builds only the target `ggml-cuda`. ggml-base and ggml
are built to link it, and the pack does not contain them. On Linux,
`libggml-cuda.so` needs `libggml-base.so`, the file that the fllama release
ships (`scripts/cuda_pack.dart` checks the NEEDED entry). The CUDA pack
files are not in the native release or in `prebuilt.json`.
`native_prebuilt:check` does not check them. The `cuda-packs` job checks
the GitHub asset digests of each release that the native release uses.

MSVC builds 9 of the 14 upstream x64 variants. ggml skips `ivybridge`,
`piledriver`, `cooperlake`, `zen4` and `sapphirerapids` for MSVC. GCC builds
all 14 for Linux x64.

Windows ARM64 libraries. The first two lines are in the release. The GPU
lines are the D12 candidates:

```
fllama.dll  llama.dll  mtmd.dll  ggml.dll  ggml-base.dll
ggml-cpu-armv8.0.dll  ggml-cpu-armv8.2-dotprod.dll
ggml-opencl.dll  OpenCL.dll        # if D12 selects OpenCL
ggml-vulkan.dll                    # if D12 selects Vulkan
```

The ARM64 CPU file names come from fllama, not from llama.cpp. The hook
builds `ggml-cpu` once for each `GGML_CPU_ARM_ARCH` value, and it publishes
each result under the name above. `OpenCL.dll` is the Khronos ICD loader.
Windows does not include it.

Code asset IDs: `package:fllama/fllama_io.dart` for `fllama`.
`package:fllama/native/<file name without extension>` for each other library
in the package. Pack files are not code assets.

Pack file URL: the ADR 005 release asset
`https://github.com/Telosnex/fllama/releases/download/native-<16 hex>/<target>-<file name>.gz`.
The manifest entry has `delivery: runtime` and `pack: <pack>`. Released apps
expect these files, so they are never deleted or changed (ADR 005 R6).

The app writes the files of one pack to one directory, for example
`%LOCALAPPDATA%\Telosnex\gpu-packs\<sha256 of the first file>\`. Paths must be
representable in the ANSI code page (Windows), as for the other backends.

Vulkan SDK on Windows: `C:\VulkanSDK\1.4.357.0`. This is the version in the
upstream release workflow at `ece963f41`. The SDK version is part of the
build key. hooks_runner 1.5.0 does not pass `VULKAN_SDK` to hooks, so the
hook finds the directory itself. It passes `SPIRV-Headers_DIR` from the
SDK, because ggml-vulkan otherwise finds SPIRV-Headers through
`VULKAN_SDK`. On Linux, the hook looks for the headers, SPIRV-Headers and
`glslc` in the system directories. A developer can install the distribution
packages `libvulkan-dev`, `glslc` and `spirv-headers`. The release workflow
copies the pinned LunarG SDK 1.4.357.0 into those directories, because the
Ubuntu 22.04 packages are too old.

ggml-vulkan builds its `vulkan-shaders-gen` helper as an ExternalProject.
`src/CMakeLists.txt` sets its prefix to `<build>/vk`. The default prefix
makes MSBuild try-compile directories under `%LOCALAPPDATA%\fllama\Cache`
too long, and the build fails with MSB6003. The OpenCL headers and ICD
loader for ARM64 come from fixed Khronos tags, as in the upstream workflow.

`n_gpu_layers`: `-1` auto, `0` CPU only, `N > 0` that number of layers.

New FFI:

- `fllama_set_gpu_allowed(uint8_t)`. Call it before the first fllama call
  that loads backends. After that, a call with a different value returns
  non-zero and changes nothing. A call with the same value returns 0.
- `fllama_gpu_memory_info` gets `device_type` (`GPU` or `IGPU`), `backend`
  (for example `Vulkan`, `OpenCL`, `MTL` or `CUDA`) and `device_key`.
- `fllama_inference_request` gets `gpu_device_key`. NULL or empty means Auto.
- `fllama_get_loaded_backends()`: comma-separated file names of the loaded
  backend libraries.
- `fllama_get_gpu_pack_files()`: JSON array of the pack files that this
  fllama build expects:
  `[{"pack": "vulkan", "name": "ggml-vulkan.dll", "sha256": "<64 hex>", "url": "<asset URL>"}]`.
  `sha256` is the file after gunzip. Empty array on platforms without packs
  and in a local source build.
- `fllama_load_gpu_pack(const char *pack, const char *dir)`: checks the
  SHA-256 of each file of `pack` in `dir`, then loads them. Returns NULL on
  success or if the pack is loaded, else an error message. Errors: unknown
  pack, GPU not allowed (I7), a request runs (I9), file missing, SHA-256
  different, file name without `ggml-`, load failed. Unloads idle cached
  models first.
- `fllama_has_vulkan_gpu()`: true if the Vulkan loader
  (`vulkan-1.dll` / `libvulkan.so.1`) is present and lists at least one
  physical device that is not a CPU and supports Vulkan 1.2. It does not
  need the pack. False if the GPU is not allowed (I7) or the build has no
  Vulkan backend. The result is computed once per process.

The Dart API in `lib/io/fllama_io_gpu.dart` wraps these functions:
`fllamaSetGpuAllowed`, `fllamaLoadedBackendFiles`, `fllamaGpuPackFiles`,
`fllamaLoadGpuPack`, `fllamaHasVulkanGpu` and `fllamaGpuMemoryInfoGetAll`.

Device key: `<backend>|<description>|<n>`. `n` is the position of the device
among the devices with the same backend and description, from 0. Example:
`Vulkan|NVIDIA GeForce RTX 4070|0`.


## 6. Non-goals

```
NG1: The Snapdragon NPU (llama.cpp ggml-hexagon backend).
     Reopens when: a benchmark on a Snapdragon X PC shows the NPU materially
     faster than the D12 GPU backend with a shipped model.

NG2: GPU acceleration on Android.
     Reopens when: a benchmark on a target Android device shows faster
     generation on the GPU than on the CPU with a shipped model.

NG3: ROCm/HIP, SYCL and OpenVINO backends.
     Reopens when: a benchmark with the step 12 method shows a vendor
     backend materially faster than Vulkan on an AMD or Intel GPU.

NG4: The Windows zip artifact, which needs an installed Visual C++ runtime.
     Reopens when: Telosnex gives the zip to users.
```

## 7. Risks

Ranked by irreversibility.

1. **A GPU driver crashes the process during backend initialization.**
   `ggml_backend_vk_reg` catches C++ exceptions, but it cannot catch an access
   violation inside the driver. Telosnex already records inference crash
   flags and selects a fallback model on the next launch after a crash.

   GPU discovery and memory queries run outside those flags today. These
   calls can initialize the driver from the model-selection UI, even with
   "GPU layers: 0". D15 extends the existing recovery to those calls and
   to the native probes and pack loading in D14. It does not prevent the
   first crash or guarantee that CPU-only inference never touches a driver.
2. **A CUDA pack with a different ABI.** I5 and I11 cover it. The key
   is a file list (D16), so a new include from ggml-base or ggml-cuda
   into a file outside the list would change the ABI without a new key.
   `test/cuda_pack_test.dart` follows every `#include` from the key files
   and fails on such a file. CI runs it before each pack build and each
   release, so a llama.cpp update with such an include fails before it
   ships. An ABI-relevant setting that llama.cpp's root
   CMake project adds is caught by the test that compares those lines.
3. **Store review rejects the GPU pack download.** Microsoft Store
   Policies 7.20 (effective 2026-10-22) do not forbid downloaded code.
   10.2.2 forbids code that changes or extends the described function, or
   adds functions that break the policies. A GPU pack only makes local AI
   faster. 10.1.5 permits add-ons that enhance the product "with user
   consent and after initial download". D14 gets that consent. 10.2.3
   permits other software only if it enhances the product. Low. Recovery:
   Vulkan in the package for the Store (51.8 MB, R8 exception), packs for
   other channels. The NVIDIA CUDA EULA permits the pack files (step 12,
   read 2026-10-06). Recovery: drop D8.
4. **GitHub Releases is not available, or a pack file is deleted.** Released
   apps then run on the CPU (I1). They do not fail. ADR 005 risk 1 gives the
   recovery.
5. **Auto layers make Apple devices slower.** Apple GPUs use the same RAM
   as the CPU. llama.cpp counts the Metal working-set limit as GPU memory,
   and it keeps a 1 GiB free margin by default (`fit_params_target`). On an
   iPhone, models that run fully on the GPU today can move some layers to
   the CPU. Those layers use the same RAM, so the move saves no memory and
   makes generation slower. iOS also has a per-app memory limit, which
   llama.cpp does not read. Fitting adds a measurement pass to each model
   load. Unknown size. Step 6 measures it. Recovery: a smaller Apple margin.
   The user can also set the layer count (R17).
6. **Two ARM64 CPU builds need extra hook work.** Each `ggml-cpu` build is a
   separate CMake build with the same ggml-base options. Resolved: the
   release contains both variants. A cold Windows ARM64 release build takes
   7.5 minutes.
7. **An integrated GPU is slower than the CPU.** llama.cpp uses an integrated
   GPU when the PC has no discrete GPU. Unknown. Step 11 decides the default.
8. **OpenMP off makes CPU inference slower.** Unknown. Step 9 measures it
   together with the CPU variants.
9. **Build time.** A cold Windows x64 build with Vulkan took 16.5 minutes
   in the ARM64 VM (x64 emulation). Shader generation is most of it.
   Resolved by ADR 005: app builds download the release. Cold release
   builds on the runners take 12 minutes (Windows x64), 8.5 minutes (Linux
   x64) and 7.5 minutes (Windows ARM64). CUDA in the release build took
   85 to 100 minutes (Windows x64) and 46 to 76 minutes (Linux x64).
   Resolved by D16. The CUDA pack builds only when its key changes.
   Measured (Linux, nvcc `--time`): 266 CPU-minutes per cold build, 69%
   in `cicc` and 19% in `ptxas`. Each of the 7 GPU architectures costs 8%
   to 20%. Fewer architectures, or larger runners, would make the CUDA
   build itself faster.
10. **Windows does not find dependent DLLs in `flutter test`.** In tests, the
    libraries are not next to the executable. Partly resolved: the Windows
    integration tests find all libraries. A plain `flutter test` run on
    Windows is not recorded. Fallback: `fllama_io.dart` opens each
    dependency by absolute path, in dependency order, before it opens
    `fllama.dll`.

## 8. Workplan

Steps 1 to 4b, the fllama parts of steps 7 and 8, and the fllama part of
step 10 are done. Do the open steps in this order: 5, 6, 8, 9, 10, 11, then
12 and 13. Exception (founder decision, 2026-10-06): the fllama part of
step 13, the CUDA pack pipeline, was built before the step 12 gate.

1. **Done (`d97bd7a`). Fix Problem item 3 in its own release.**
   `GGML_OPENMP=OFF` for all Windows targets.
2. **Done in part (`832cf2b`). Spike on Windows x64.** The §5 defines work.
   The integration tests pass in the ARM64 VM with emulated x64 and without
   a Vulkan driver. These questions are still open, because the spike ran
   without an x64 GPU:
   - Does `flutter build windows` put all libraries next to `telosnex.exe`?
   - What is the MSIX size?
   - Does Vulkan run on a real x64 GPU (step 9)?
3. **Done (`832cf2b`, `ce2e308`). Hook.** D1, D2, D3, D6, D7 and the §5
   names. The Vulkan header version is part of the build key. Unit tests are
   in `test/build_hook_split_test.dart`.
4. **Done (`832cf2b`). Loader.** D4, the §5 FFI, device keys and the D11
   CPU selection in `src/fllama_backends.cpp`. Open: unit tests for I7 and
   for `fllama_backends_pick_windows_arm64_cpu`.
4b. **Done (`515b45e`, then ADR 005 step 3). GPU packs (D13).** The hook
    publishes pack files as release runtime files. Integration tests cover
    I1, I5 and I9.
5. **Telosnex.** D5 and the GPU layer setting are done (`b37eef6417`).
   To do:
   1. Implement D14 with `ensureRuntimeFile` from native_prebuilt
      `runtime.dart`: download, gunzip and check each pack file, then call
      `fllamaLoadGpuPack`. Retry at the next model load after a failure.
   2. Show the GPU pack size on the model download screen (D14).
   3. Extend existing crash recovery to GPU discovery, memory queries,
      native probes and pack loading (D15). Add tests for I10, including
      calls from the model-selection UI. Keep network downloads outside
      the native-call crash flag.
   4. If there is no discrete GPU, use the integrated GPU memory in the
      model-size estimates.
   5. Decide whether the custom-model setup test keeps `numGpuLayers: 0`.
6. **Apple and Android.** D5 is applied in code. On one Mac and one iPhone,
   measure load time and tokens per second for each Telosnex model with 99
   and with -1. If -1 is slower for a model that loads with 99, set a
   smaller Apple margin. Done when Android with -1 runs on the CPU with no
   change in speed.
7. **Release CI.** ADR 005 steps 1 to 4 are done. The fllama release
   workflow builds and uploads the packs. To do: add the I3 and I4 checks to
   `dev/ci/releases/release.dart`.
8. **Windows ARM64.** The D11 CPU variants are done, and the ARM64 VM
   selects the dot-product variant. To do:
   1. Add both D12 candidates to the hook.
   2. Add a Telosnex release job on a Windows ARM64 runner that builds the
      ARM64 MSIX (`msix_config` `architecture: arm64`).
   3. Upload both MSIX files in the same Store submission.
9. **Hardware test.** Run the integration test and a short benchmark on each
   of these:
   - a clean Windows VM without the Visual C++ Redistributable and without
     a GPU driver.
   - Intel SDE with `-nhm` and `-hsw`.
   - one PC with an Nvidia GPU, one with an AMD GPU, and one with only an
     Intel integrated GPU.
   - one Snapdragon X PC, with OpenCL and with Vulkan (D12).

   Record prompt and generation tokens per second, for the GPU and for the
   CPU. Compare the CPU numbers with the old SSE2 and OpenMP build.
10. **Linux x64.** The hook, loader, `$ORIGIN` run path, CPU variants and
    Vulkan pack are done and in the release. Telosnex sends -1. To do: the
    D14 download (step 5), a GPU plug in `snapcraft.yaml`, and the step 9
    tests on one Linux PC with a GPU.
11. **Gate: the owner reviews the step 6 and step 9 results.** Select the
    D12 backend. Decide the integrated-GPU default (risk 7). Keep or revert
    OpenMP off (risk 8). Then ship Windows x64, Windows ARM64, Apple and
    Linux.
12. **CUDA gate (D8).** Benchmark upstream CUDA and Vulkan builds at the
    fllama llama.cpp commit with Telosnex models, on two Nvidia GPU
    generations. Read Microsoft Store Policy 10.2.2 and the redistribution
    list of the NVIDIA CUDA EULA. The owner decides to continue or stop.
    EULA read 2026-10-06 (docs.nvidia.com/cuda/eula, last updated
    2026-01-26). Result:
    - Attachment A lists the CUDA Runtime (`cudart`) and the CUDA BLAS
      Library (`cublas`, `cublasLt`) as distributable on Windows and
      Linux, "including certain variations ... with version number ...
      embedded in the file name". All three pack files qualify.
      `ggml-cuda` is llama.cpp code (MIT), not NVIDIA's.
    - §2.3: Linux files must be unmodified "except for unzipping".
      install_cuda_toolkit.dart takes them from NVIDIA's redistributable
      archives and checks their SHA-256 against NVIDIA's manifest; the
      pack only gzips them.
    - §1.1.1, §1.2: the files may be distributed only as part of an
      application with "material additional functionality", and not as a
      stand-alone product. The pack is a GitHub release that Telosnex
      downloads for its own use (D14). Anyone can download those release
      assets directly. llama.cpp publishes `cudart-llama-bin-*` archives
      the same way. Low risk; the pack's release notes say the files are
      for fllama.
    - §1.1.2: the terms under which Telosnex is distributed must be
      consistent with the EULA, including no reverse engineering of the
      NVIDIA files. To do in Telosnex: a third-party notice for the CUDA
      files and that clause in its terms.
    - §1.2: the SDK must not become subject to a license that requires
      it be distributed as source or for free. fllama is GPL v2: a third
      party that ships fllama under the GPL with the CUDA pack combines
      GPL code with NVIDIA's closed libraries. Telosnex ships fllama under
      its own commercial terms, so this does not affect Telosnex. Open:
      add a GPL exception for the CUDA libraries to fllama's LICENSE, or
      say in the README that the CUDA pack is for the commercial license.
    Questions go to nvidia-compute-license-questions@nvidia.com (§2.5).
13. **CUDA pack, if step 12 continues.** Done on branch `cuda-pack`: the
    pack build (D16), the release check (I11), and fllama_load_gpu_pack
    loads the CUDA runtime libraries before `ggml-cuda`. The first packs
    are published, and a build-only release with them passed
    (2026-10-06). To do: a published release with them. Download the pack only
    when an Nvidia GPU is present (D14). Test I6 on Nvidia hardware. CI
    runners have no Nvidia GPU, so CI checks only that the pack builds
    and that its files match the embedded hashes.

---

## ──────── non-normative ────────

### A. Alternatives & notes

**Alternatives.**

- **One `fllama.dll` with `/DELAYLOAD:vulkan-1.dll`.** This works only on
  Windows. It needs a probe before each Vulkan entry, and it gives no CPU
  variants. Lost to R5 and R6.
- **`ggml_backend_load_all_from_path(<fllama directory>)`.** This is simpler
  than D4, but it cannot skip GPU backends (I7) or load CUDA first from a
  second directory (I6). It does not provide those fllama API guarantees.
- **clang-cl for x64**, as upstream uses. This adds 5 CPU variants, including
  `zen4`. It needs the Clang components on the x64 runner. Reconsider it if
  step 9 shows slow MSVC CPU code.
- **Upstream prebuilt `ggml-vulkan.dll` for the same tag.** This removes the
  SDK from build machines. The upstream CMake options must equal the fllama
  options, and the hook mixes a downloaded backend with a local `ggml-base`.
  Lost to I5.
- **A separate CUDA edition.** Lost to R1.
- **Vulkan inside the package.** Simplest, and GPU acceleration works with
  no network. Every x64 install grows by 51.8 MB, also on PCs that cannot
  use it. Lost to R8. It is the recovery for risk 3.
- **Fewer Vulkan shaders**, for example no cooperative-matrix shaders.
  The size saving is unknown, and some GPUs become slower. Not needed with
  D13.
- **An `.msixbundle` instead of two MSIX files.** The Store accepts both.
  `msix` 3.18.0 builds one architecture per run and does not make bundles.
  Two files need no new tool.

**Backends in NG3 and NG1.**

| Backend | Hardware | Maintained by (CODEOWNERS and docs) |
|---------|----------|---------------------------------------|
| ROCm/HIP | AMD GPUs | Community maintainer. Uses AMD's ROCm SDK. Windows support covers a subset of Radeon GPUs. |
| SYCL | Intel GPUs (Arc and integrated) | ggml-sycl team. Uses Intel oneAPI. |
| OpenVINO | Intel CPUs, GPUs and NPUs | Intel's toolkit. The upstream docs mark it as work in progress. |
| OpenCL Adreno | Qualcomm Adreno GPUs | ggml-opencl team (also the hexagon team). D12 candidate. |
| Hexagon | Qualcomm NPU | ggml-hexagon team. NG1. |

**Device API.** llama.cpp lists every device with
`ggml_backend_dev_count`, `ggml_backend_dev_get`, `ggml_backend_dev_name`,
`ggml_backend_dev_description`, `ggml_backend_dev_type` and
`ggml_backend_dev_memory`. `llama_model_params.devices` takes a
null-terminated list of the devices that the model can use.
`fllama_get_gpu_devices` already walks this list.

**Discoveries** (classified by ADR_REVIEW_GUIDELINES §5):

| Discovery | Classification | Action |
|-----------|----------------|--------|
| x64 `fllama.dll` imports `VCOMP140.DLL` (Problem item 3) | Independent defect | Fixed in step 1 (`d97bd7a`) |
| `LLAMA_VULKAN` has no effect | Fixed by D3 | Fixed in step 3 |
| x64 CPU code is SSE2 only | Fixed by D2 | Fixed in step 3 |
| Windows ARM64 CPU code is ARMv8.0 only | Fixed by D11 | Fixed in fllama. Telosnex ARM64 package open (step 8) |
| Android arm64 builds use `-march=armv8.2-a+dotprod` for all devices (`src/CMakeLists.txt`). CPUs without the dot-product extension, for example Cortex-A53, cannot run this code. | Independent defect. Inferred. | Track separately |
| Telosnex enables the draft model only for `gpuLayers > 0` | Fixed by D5 | Fixed in Telosnex `b37eef6417` |
| `fllama_get_gpu_devices` skips integrated GPUs, so Telosnex shows no GPU memory on PCs with only an integrated GPU | Fixed by D9 | Fixed in fllama step 4. Telosnex estimates open (step 5) |
| Android release libraries contained debug information (129.6 MiB for ARM64) | Independent defect | Fixed in ADR 005 (release `native-580a44799cc1e0f1`) |
| The Windows zip needs an installed Visual C++ runtime | Independent | NG4 |

**Sizes** from the upstream b11396 Windows release archives, unpacked.
These CUDA files are CUDA 13.4; the fllama pack uses CUDA 12.8 (D16), so
its files are `*_12` and their sizes differ. The fllama pack sizes are
below this table.

| File | MB |
|------|---:|
| `ggml-vulkan.dll` (x64) | 45.3 |
| `ggml-cpu-<variant>.dll` (14 variants, clang) | 0.9 to 1.9 each |
| `ggml-cuda.dll` (CUDA 13.4, x64) | 147.7 |
| `cublasLt64_13.dll` | 492.8 |
| `cublas64_13.dll` | 54.9 |
| `cudart64_13.dll` | 0.6 |

**fllama CUDA pack sizes** (CUDA 12.8, 7 GPU architectures, first packs
`cuda-windows-x64-1c6b4f34777df5fe` and `cuda-linux-x64-632a6bd1dff0be2b`,
MB = 10^6 bytes):

| File | Windows x64 unpacked / gzip | Linux x64 unpacked / gzip |
|---|---|---|
| cudart | 0.6 / 0.1 | 0.7 / 0.2 |
| cublasLt | 674.7 / 480.5 | 751.8 / 507.0 |
| cublas | 113.7 / 87.9 | 116.4 / 88.5 |
| ggml-cuda | 127.9 / 115.1 | 137.4 / 116.2 |
| Total | 917 / 684 | 1006 / 712 |

A user with an NVIDIA GPU downloads about 0.7 GB once per pack key.
cublasLt is 70% of it.

Before this ADR, the fllama VM builds were 7.1 MB (x64) and 8.8 MB (ARM64).

Measured fllama build at `ce2e308` (MSVC, Windows x64, Vulkan SDK 1.4.357.0):
`ggml-vulkan.dll` 51.8 MB, 16.0 MB with gzip. The 9 CPU variants are 8.0 MB
together. `fllama.dll` is 2.5 MB.

Release `native-580a44799cc1e0f1`, gzipped download sizes:

| Target | Bundled libraries | CPU variants in that total | Vulkan pack |
|--------|------------------:|---------------------------:|------------:|
| Windows x64 | 5.9 MB | 2.9 MB (9) | 16.6 MB |
| Windows ARM64 | 4.2 MB | 0.6 MB (2) | none |
| Linux x64 | 10.6 MB | 6.1 MB (14) | 16.8 MB |

**Evidence index.**

| Claim | Source |
|-------|--------|
| `LLAMA_VULKAN` is not mapped | `src/llama.cpp/CMakeLists.txt` `llama_option_depr` list |
| Cross builds disable x86 extensions | `src/llama.cpp/ggml/CMakeLists.txt`, `GGML_NATIVE_DEFAULT` and `INS_ENB` |
| `CMAKE_SYSTEM_NAME` always set | `native_toolchain_cmake` 0.2.7 `run_builder.dart`, `_generateWindowsDefines` and `_generateLinuxDefines` |
| MSIX runtime list | `msix` 3.18.0 `lib/src/assets.dart`, `_vcRuntimeDllNames` |
| MSIX ARM64 support | `msix` 3.18.0 `lib/src/configuration.dart`, `architecture` (`x64` or `arm64`) |
| Fitting aborts when layers are set | `src/llama.cpp/common/fit.cpp:377` |
| Fitting keeps the context size when it is set | `src/llama.cpp/common/fit.cpp:310` |
| Metal free memory | `ggml-metal-device.m`, `recommendedMaxWorkingSetSize` minus `currentAllocatedSize` |
| Default backend search paths | `src/llama.cpp/ggml/src/ggml-backend-reg.cpp`, `ggml_backend_load_best` |
| Discrete GPUs preferred, same-ID devices merged | `src/llama.cpp/src/llama.cpp`, model device list |
| Vulkan init catches exceptions | `ggml-vulkan.cpp`, `ggml_backend_vk_reg` |
| Hook environment filter | `hooks_runner` 1.5.0 `build_runner.dart`, environment allow-list |
| No ARM variants on Windows | `src/llama.cpp/ggml/src/CMakeLists.txt`, `GGML_CPU_ALL_VARIANTS` block |
| `GGML_CPU_ARM_ARCH` sets `-march` | `src/llama.cpp/ggml/src/ggml-cpu/CMakeLists.txt` |
| Upstream Windows ARM64 GPU build is OpenCL Adreno | `src/llama.cpp/.github/workflows/release.yml`, `windows` matrix |
| fllama Windows ARM64 uses ClangCL with no `-march` | `hook/build.dart` `windowsToolset`, `src/cmake/windows-clangcl.toolchain.cmake` |
| Linux bundle library directory | Telosnex `linux/CMakeLists.txt`, `NATIVE_ASSETS_DIR` |

### B. Revision history

- 2026-10-04: First draft.
- 2026-10-04: Windows ARM64 is a goal (D10 to D12). Auto layers apply to
  Apple (D5, step 6). Old NG1 and NG5 removed.
- 2026-10-04: -1 on every native platform, with a user layer setting (R17).
  The Apple benchmark tunes the margin and no longer blocks D5.
- 2026-10-04: GPU picker (D9, I8). The environment-variable workaround is
  removed from NG3.
- 2026-10-05: Founder rule R8: large backends that not every user can use
  are downloads. Vulkan becomes a GPU pack (D3, D13, D14, I9). The CUDA
  manifest is replaced by hashes inside fllama.
- 2026-10-05: Depends on ADR 005. GPU packs come from the fllama prebuilt
  release on GitHub, not from B2 (D7, D13, I4, risks 4 and 9, §5, step 7).
  A local source build bundles its GPU backends.
- 2026-10-05: ADR 005 step 3 done. `fllama_get_gpu_pack_files` returns
  `url`; `gpu_pack_dir`, `relativePath` and `fllamaGpuPackObjectPrefix`
  are gone. The release workflow installs the Vulkan SDK 1.4.357.0 on
  Windows x64 and copies it into the system directories on Linux x64,
  where the hook looks (§5). A release without a Vulkan pack for Windows
  x64 or Linux x64 fails (D7).
- 2026-10-05: Status update against fllama release
  `native-580a44799cc1e0f1` and Telosnex `b37eef6417`. New §0 shows the
  implementation state. Problem items, decisions, invariants, risks and
  workplan steps now show what is done and what is open. Telosnex has one
  GPU control, "GPU layers: Auto / number" (founder decision). D9 now
  describes that control. It also proposes, for approval, that `0` calls
  fllama_set_gpu_allowed(false) at app start. §5 adds the 14 Linux x64 CPU
  variants, the Linux SDK path in the release workflow, the
  `fllama_set_gpu_allowed` return value, and the release sizes.
- 2026-10-05: Founder approved reuse of the existing fllama crash recovery
  for GPU calls (D15, I10, risk 1, step 5). Inference already has coverage.
  GPU discovery, memory queries, native probes and pack loading need it.
  Removed the D9 startup-disable proposal and its restart requirement.
  I7 remains a fllama API guarantee, not a Telosnex recovery requirement.
- 2026-10-06: D16 and I11. The CUDA pack has its own key, workflow and
  releases (`cuda-<target>-<key16>`). The fllama release embeds the
  published pack and fails if it is missing (founder decision). I5 now
  allows the CUDA pack to come from another build with the same ggml-base
  sources and options. Measured CUDA build times added to risk 9. The
  Ninja trial for Windows is recorded under D16 (no gain).
- 2026-10-06: Status update. D13 and D14 state: the CUDA loader and
  `fllama_has_cuda_gpu` exist on branch `cuda-pack`. CI runs the CUDA pack
  key test before each pack build and release (I5, risk 2). Workplan
  exception: the step 13 pipeline came before the step 12 gate. The CUDA
  sizes in the appendix are labeled as CUDA 13.4.
- 2026-10-06: First CUDA packs published. Their sizes are in the
  appendix. A release build-only run with them passed.
- 2026-10-06: Step 12 license part done: the NVIDIA CUDA EULA permits the
  pack files. Open: Telosnex notice and terms, and the fllama GPL question.
