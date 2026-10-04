# ADR 004 — One desktop build per CPU architecture that selects the GPU and CPU code at run time
Status: DRAFT (2026-10-04)

## 1. Problem

Telosnex ships one Windows x64 package through the Microsoft Store. fllama
runs llama.cpp inside that package. At fllama `d4e262e` and llama.cpp
`ece963f41`, the native build has these properties:

1. **Windows has no GPU acceleration.** `hook/build.dart` and
   `src/CMakeLists.txt` set `LLAMA_VULKAN=ON`. llama.cpp does not read this
   name. Only `GGML_VULKAN` enables Vulkan. The CMake caches of all six Windows
   builds in the test VM contain `GGML_VULKAN:BOOL=OFF`. (Observed.)
2. **Windows x64 CPU code does not use AVX.** `native_toolchain_cmake` 0.2.7
   always passes `CMAKE_SYSTEM_NAME`, so CMake marks each build as a cross
   build. ggml then disables SSE4.2, AVX, AVX2, BMI2, FMA and F16C. The x64
   cache `d11d429c115fb668` contains `GGML_AVX2:BOOL=OFF`. The CPU code uses
   only SSE2. (Observed in the VM. The release runner uses the same code path.
   Inferred.)
3. **The package does not contain a runtime file that fllama needs.** The x64
   `fllama.dll` imports `VCOMP140.DLL`, which is the Microsoft OpenMP runtime.
   `msix` 3.18.0 copies only the C++ runtime DLLs into the package. It does not
   copy `vcomp140.dll`. On a PC without the Visual C++ Redistributable,
   Windows cannot load `fllama.dll`, and local AI fails. (Imports and package
   list observed. The load failure is inferred and not reproduced.)
4. **The GPU layer count disables memory fitting.** Telosnex sends
   `n_gpu_layers = 99` on Windows, macOS and iOS
   (`lib/features/local_llm/fllama_process.dart`). llama.cpp fits the layers to
   free GPU memory only when `n_gpu_layers` is −1 (`common/fit.cpp:377`). With
   99, a model that is larger than the GPU memory does not get a partial
   offload. The same file enables the draft model only when the layer count
   is greater than 0. The user cannot change the layer count. (Source
   observed. The failure on discrete GPUs is inferred.)
5. **Linux uses only the CPU.** Telosnex sends `n_gpu_layers = 0` on Linux and
   Android. The Linux x64 build has the same cross-build defaults as item 2.
   (Telosnex source observed. Linux CPU flags inferred.)
6. **Windows ARM PCs run the x64 package in emulation.** Telosnex does not
   ship an ARM64 package, so Snapdragon PCs run x64 code through Windows
   emulation. The fllama ARM64 build exists, but it uses the ClangCL toolset
   with no `-march`, so its CPU code is plain ARMv8.0 without the dot-product
   instructions. (Toolset observed. CPU flags inferred from the clang default
   target.)

**Outcome.** One Telosnex Store listing contains an x64 package and an ARM64
package. Each package uses the GPU with no user setup. If no GPU works, it uses
the fastest CPU code that the CPU supports. On all GPU platforms, llama.cpp
fits the model to free GPU memory. Users who know llama.cpp can turn off the
GPU, set the layer count, and later add CUDA. Android is out of scope (§6).

Item 3 affects users now, and it is independent of this ADR. Workplan step 1
fixes it first.

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

D6: Build all Windows targets with GGML_OPENMP=OFF.
    Because: R7
    Instead of: bundle vcomp140.dll (x64) and libomp140.aarch64.dll (ARM64).
    Upstream llama.cpp copies libomp140 from the Visual Studio folder
    debug_nonredist, so that file is not redistributable. One policy for all
    Windows targets is less to maintain.

D7: The fllama build hook compiles a GPU backend from source when it finds
    the pinned SDK for it. If it does not find the SDK, it builds the CPU
    backends only and logs a warning. The Telosnex release script fails if
    fllama expects no GPU pack, or if the release did not upload each pack
    that fllama expects (I4).
    Because: R9, R13, R14
    Instead of: a hook option that makes the SDK mandatory. The release check
    catches the same failure with one mechanism and no per-machine setting.
    Instead of: upstream prebuilt libraries (the fonnx pattern). They must
    match the local ggml-base exactly (I5).

D8: CUDA is a GPU pack (D13) for x64 PCs that have an Nvidia GPU. Work
    starts only after a benchmark shows that CUDA is materially faster than
    Vulkan with Telosnex models.
    Because: R1, R8, R11
    Instead of: a separate CUDA edition (R1), or CUDA inside the package (R8).

D9: fllama reports every GPU, discrete and integrated, with its backend
    name, type and device key (§5). Telosnex settings show
    "GPU: Auto / Off / <each GPU>" and "GPU layers: Auto / number" on every
    native platform. A request that names a device key gives llama.cpp only
    that device. If no device has the key, fllama uses Auto and logs a
    warning.
    Because: R10
    Instead of: the GGML_VK_VISIBLE_DEVICES environment variable. The user
    must set it outside the app and must know the Vulkan device number.
    Instead of: the device number as the saved value. The order of devices
    can change after a driver update or when a GPU is added.

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

D13: A GPU pack is a set of backend libraries that the hook builds in the
     same CMake build as fllama, but does not publish as code assets. The
     build writes the SHA-256 of each pack file into fllama (a generated
     source file). The release uploads each file to Backblaze B2 at a path
     that contains its SHA-256 (§5). fllama_load_gpu_pack loads a file only
     if its SHA-256 is equal to the value inside fllama.
     Because: R8, R12, I5
     Instead of: hashes in a manifest that the app downloads with the pack.
     The download can change both the file and the manifest (R12).
     Instead of: hashes in Telosnex assets. Flutter bundles the assets
     before the release script can read the hook output, so the release
     needs two builds.
     Instead of: a check of the fllama build key. An equal file hash also
     proves the same build (I5), and it is one check instead of two.

D14: Telosnex downloads a GPU pack automatically when all of these are true:
     the platform has a pack, the GPU is allowed, fllama_has_vulkan_gpu (or
     a CUDA probe for D8) finds a device, and the user starts the first
     local model download or local model load. Telosnex then calls
     fllama_load_gpu_pack. If the download or the check fails, local AI runs
     on the CPU, and Telosnex tries the download again at the next model
     load.
     Because: R2, R4, R8
     Instead of: a download at app start. Users who never use local AI do not
     need the pack.
     Instead of: a setting that the user turns on. R2 requires no user action.
```

## 4. Invariants

```
I1: If a GPU pack is not downloaded, fails its SHA-256 check, or fails to
    load, or if the GPU loader DLL or a GPU device is missing, fllama runs
    inference on the CPU.
    If violated: local AI fails on PCs and VMs without a working GPU driver.
    Pinned by: planned integration test with the GPU backend DLL deleted,
    and a planned run in a VM without a GPU driver.

I2: fllama never loads a CPU variant that uses an instruction that the CPU
    does not have.
    If violated: the app stops with an illegal-instruction error.
    Pinned by: planned runs under Intel SDE with -nhm (no AVX) and -hsw
    (AVX2) that check the selected variant in the log. For ARM64, a planned
    unit test of the D11 selection, and a run on a CPU without dot product
    if one is available.

I3: Every library in a Windows package imports only Windows system DLLs,
    C++ runtime DLLs that the package contains, and other libraries in the
    package.
    If violated: the library cannot load on some PCs (Problem item 3).
    Pinned by: planned import check in dev/ci/releases/release.dart.

I4: Each Windows or Linux release package contains its baseline CPU
    variant. Its fllama library expects at least one GPU pack (Windows ARM64:
    contains its GPU backend), and B2 has every pack file that it expects.
    If violated: a release loses GPU support or CPU support without an error.
    Pinned by: planned file check and B2 check in
    dev/ci/releases/release.dart.

I5: All ggml libraries in one process come from one build: the same
    llama.cpp commit and the same CMake options.
    If violated: an ABI mismatch causes crashes or wrong output.
    Pinned by: the D13 SHA-256 check. A file from another build has a
    different SHA-256. Planned integration test with a changed pack file.

I6: If the CUDA pack loads, Nvidia GPUs run on CUDA, and Vulkan does not
    also use the same GPU.
    If violated: two backends use the memory of one GPU.
    Pinned by: the D4 load order and the llama.cpp device de-duplication,
    which keeps the first device with a given device_id
    (src/llama.cpp, model device list). Both backends use the PCI bus ID as
    device_id. Vulkan reports no ID if the driver does not have
    VK_EXT_pci_bus_info. Planned test on Nvidia hardware.

I7: With "GPU: Off", fllama does not load any GPU backend library.
    If violated: the user cannot avoid a GPU driver crash.
    Pinned by: planned loader unit test with the GPU turned off.
    fllama_load_gpu_pack returns an error when the GPU is not allowed.

I9: fllama_load_gpu_pack changes the backend list only when no model is
    loaded and no request runs.
    If violated: a model load reads the ggml backend list while another
    thread changes it.
    Pinned by: the function returns an error in other states. Planned
    integration test that calls it during a request.

I8: When a request names a device key that exists, the model and the
    draft model use only that GPU and the CPU.
    If violated: the user selection has no effect.
    Pinned by: planned loader unit test with a fake device list, and the
    step 9 test on a PC with two GPUs if one is available.
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
CMAKE_PLATFORM_NO_VERSIONED_SONAME=ON   # Linux. Step 10 confirms.
```

Windows ARM64 uses the same defines, except:

```
GGML_CPU_ALL_VARIANTS=OFF
GGML_CPU_ARM_ARCH=<armv8-a | armv8.2-a+dotprod>   # one value per CPU build
GGML_OPENCL=ON, GGML_OPENCL_USE_ADRENO_KERNELS=ON  # or GGML_VULKAN=ON (D12)
```

Remove `LLAMA_VULKAN` from `hook/build.dart` and `src/CMakeLists.txt`.

Windows x64 libraries in the package (Linux uses `lib<name>.so`):

```
fllama.dll  llama.dll  mtmd.dll  ggml.dll  ggml-base.dll
ggml-cpu-{x64,sse42,sandybridge,haswell,skylakex,cannonlake,cascadelake,icelake,alderlake}.dll
```

GPU packs (D13):

| Pack | Files | Platforms |
|------|-------|-----------|
| `vulkan` | `ggml-vulkan.dll` / `libggml-vulkan.so` | Windows x64, Linux x64 |
| `cuda` (D8) | `ggml-cuda.dll` and the CUDA runtime DLLs | Windows x64 |

`llama-common` stays a static library inside `fllama.dll`. fllama replaces
its download functions (`src/fllama_download_stub.cpp`), and a shared
`llama-common` would need httplib.

MSVC builds 9 of the 14 upstream x64 variants. ggml skips `ivybridge`,
`piledriver`, `cooperlake`, `zen4` and `sapphirerapids` for MSVC.

Expected Windows ARM64 libraries. Step 8 confirms the list:

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

Hook user define `gpu_pack_dir` (a path, relative to the app pubspec). If it
is set, the hook writes each pack file to
`<gpu_pack_dir>/<os>-<arch>/<sha256>/<file name>.gz`. The Telosnex release
script uploads this directory. If it is not set, the pack files stay only in
the hook cache.

B2 object name: `fllama-gpu-packs/<os>-<arch>/<sha256>/<file name>.gz`, for
example `fllama-gpu-packs/windows-x64/3f9a…/ggml-vulkan.dll.gz`. `<sha256>`
is the SHA-256 of the file before gzip, in lowercase hex. Objects are never
deleted or changed, because released apps expect them. The bucket allows
public reads.

The app writes the files of one pack to one directory, for example
`%LOCALAPPDATA%\Telosnex\gpu-packs\<sha256 of the first file>\`. Paths must be
representable in the ANSI code page (Windows), as for the other backends.

Vulkan SDK on Windows: `C:\VulkanSDK\1.4.357.0`. This is the version in the
upstream release workflow at `ece963f41`. The SDK version is part of the
build key. hooks_runner 1.5.0 does not pass `VULKAN_SDK` to hooks, so the
hook finds the directory itself. It passes `SPIRV-Headers_DIR` from the
SDK, because ggml-vulkan otherwise finds SPIRV-Headers through
`VULKAN_SDK`. On Linux, the distribution packages `libvulkan-dev`, `glslc`
and `spirv-headers` supply the SDK.

ggml-vulkan builds its `vulkan-shaders-gen` helper as an ExternalProject.
`src/CMakeLists.txt` sets its prefix to `<build>/vk`. The default prefix
makes MSBuild try-compile directories under `%LOCALAPPDATA%\fllama\Cache`
too long, and the build fails with MSB6003. The OpenCL headers and ICD
loader for ARM64 come from fixed Khronos tags, as in the upstream workflow.

`n_gpu_layers`: `-1` auto, `0` CPU only, `N > 0` that number of layers.

New FFI:

- `fllama_set_gpu_allowed(bool)`. Call it before the first fllama call that
  loads backends. A later call returns an error and changes nothing.
- `fllama_gpu_memory_info` gets `device_type` (`GPU` or `IGPU`), `backend`
  (for example `Vulkan`, `OpenCL`, `MTL` or `CUDA`) and `device_key`.
- `fllama_inference_request` gets `gpu_device_key`. NULL or empty means Auto.
- `fllama_get_loaded_backends()`: comma-separated file names of the loaded
  backend libraries.
- `fllama_get_gpu_pack_files()`: JSON array of the pack files that this
  fllama build expects:
  `[{"pack": "vulkan", "name": "ggml-vulkan.dll", "sha256": "<64 hex>"}]`.
  Empty array on platforms without packs.
- `fllama_load_gpu_pack(const char *pack, const char *dir)`: checks the
  SHA-256 of each file of `pack` in `dir`, then loads them. Returns NULL on
  success, else an error message. Errors: unknown pack, GPU not allowed
  (I7), a model is loaded or a request runs (I9), file missing, SHA-256
  different, load failed.
- `fllama_has_vulkan_gpu()`: true if the Vulkan loader
  (`vulkan-1.dll` / `libvulkan.so.1`) is present and lists at least one
  physical device that is not a CPU. It does not need the pack.

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
   violation inside the driver. A user who gets this crash cannot use local AI
   until they find "GPU: Off". The GPU pack loads at the first local model
   load (D14), not when the app starts. `fllama_has_vulkan_gpu` also calls
   the driver, and Telosnex calls it at the same time. If beta reports show this crash, add a marker file that
   turns off the GPU after a crash during initialization.
2. **A CUDA pack with a different ABI.** I5 covers it.
3. **Store policy does not permit downloaded GPU libraries.** Microsoft
   Store Policy 10.2.2 limits code that the app gets after installation.
   This now applies to Vulkan, not only to CUDA. Unknown. Step 4b checks it
   before release work. Recovery: Vulkan in the package for the Store
   (51.8 MB, R8 exception), packs for other channels. The NVIDIA license
   for the CUDA download is checked in step 12. Recovery: drop D8.
4. **B2 is not available, or a pack object is deleted.** Released apps then
   run on the CPU (I1). They do not fail. Recovery: upload the object again
   from the release artifacts. The release keeps the `gpu_pack_dir` output.
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
   separate CMake build with the same ggml-base options. If step 8 finds that
   this breaks I5 or doubles the build time, ship only the dot-product
   variant if every Windows 11 ARM64 CPU has dot product (unverified), else
   only the baseline.
7. **An integrated GPU is slower than the CPU.** llama.cpp uses an integrated
   GPU when the PC has no discrete GPU. Unknown. Step 11 decides the default.
8. **OpenMP off makes CPU inference slower.** Unknown. Step 9 measures it
   together with the CPU variants.
9. **Build time.** A cold Windows x64 build with Vulkan took 16.5 minutes
   in the ARM64 VM (x64 emulation). Shader generation is most of it.
   Recovery: drop variants, or prebuild.
10. **Windows does not find dependent DLLs in `flutter test`.** In tests, the
   libraries are not next to the executable. Unknown. Step 2 decides it.
   Fallback: `fllama_io.dart` opens each dependency by absolute path, in
   dependency order, before it opens `fllama.dll`.

## 8. Workplan

1. **Fix Problem item 3 in its own release.** Set `GGML_OPENMP=OFF` for all
   Windows targets in `hook/build.dart`. Rebuild x64. Run the fllama
   integration tests on x64 (the ARM64 VM can run x64 Flutter in emulation).
   Done when `fllama.dll` imports only system DLLs and C++ runtime DLLs, and
   the tests pass.
2. **Spike on Windows x64 (bounded).** Use a scratch branch with the §5
   defines. Register each output library as a code asset. Answer these
   questions and record the results in §A:
   - Does `flutter build windows` put all libraries next to `telosnex.exe`?
   - Does `flutter test` find `ggml-base.dll` for `fllama.dll` and for the
     backends?
   - What is the cold build time, with and without Vulkan?
   - What is the unpacked size, and what is the MSIX size?
   - Does `-DVulkan_ROOT=<sdk>` let `FindVulkan` find the SDK and `glslc`
     without the `VULKAN_SDK` variable?

   Success: the integration tests pass in `flutter test` and in the built
   app, with Vulkan selected and also with `ggml-vulkan.dll` deleted. If
   `flutter test` fails on dependent DLLs, use the risk 9 fallback. Run the
   spike on an x64 machine with a GPU. The ARM64 VM runs x64 code only in
   emulation.
3. **Hook.** Implement D1, D2, D3, D6, D7 and the §5 names for x64. Add the
   SDK version to the build key. Publish and register all libraries. Add
   unit tests: the defines for each target, a new key when the SDK version
   changes, and a CPU-only build when there is no SDK.
4. **Loader.** Implement D4 and I7 in `src/fllama.cpp`. Find the directory of
   the fllama library with `GetModuleHandleExW`
   (`GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS`) on Windows and `dladdr` on
   Linux. Load the CPU variant with the highest score. Log the selected CPU
   variant and the GPU devices. Add the §5 FFI. Add tests for I1 and I7.
4b. **GPU packs (D13).** Check Store Policy 10.2.2 first (risk 3). Remove
    the pack files from the hook code assets. Generate the SHA-256 source in
    `src/CMakeLists.txt`. Add the `gpu_pack_dir` user define and the §5 FFI.
    Make the fllama example download nothing: its integration test calls
    `fllama_load_gpu_pack` on the hook cache directory. Add tests for I1
    (no pack, changed pack), I5, I7 and I9. Done when the Windows x64
    integration test passes with and without the pack.
5. **Telosnex.** Implement D14: download, gunzip, `fllama_load_gpu_pack`,
   and a retry at the next model load. Apply D5 on Windows, including the
   draft-model check. Add
   "GPU: Auto / Off" and "GPU layers: Auto / number" to the settings. If there is no discrete GPU, use the
   integrated GPU memory in the model-size estimates.
6. **Apple and Android.** Apply D5 on macOS, iOS and Android. On one Mac
   and one iPhone, measure load time and tokens per second for each Telosnex
   model with 99 and with -1. If -1 is slower for a model that loads with 99,
   set a smaller Apple margin. Done when Android with -1 runs on the CPU
   with no change in speed.
7. **Release CI.** Install the pinned Vulkan SDK on the Windows runner. Set
   `gpu_pack_dir`. Upload new pack objects to B2, and skip objects that
   exist. Add the I3 and I4 checks to `dev/ci/releases/release.dart`.
8. **Windows ARM64.** Add D11 and both D12 candidates to the hook. Confirm
   the §5 ARM64 list. Add a release job on a Windows ARM64 runner that builds
   the ARM64 MSIX (`msix_config` `architecture: arm64`). Upload both MSIX
   files in the same Store submission. Run the integration tests in the
   ARM64 VM, which tests the CPU path.
9. **Hardware test.** Run the integration test and a short benchmark on each
   of these:
   - a clean Windows VM without the Visual C++ Redistributable and without
     a GPU driver.
   - Intel SDE with `-nhm` and `-hsw`.
   - one PC with an Nvidia GPU, one with an AMD GPU, and one with only an
     Intel integrated GPU.
   - one Snapdragon X PC, with OpenCL and with Vulkan (D12).

   Record prompt and generation tokens per second, for the GPU and for the
   CPU. Compare the CPU numbers with the current SSE2 and OpenMP build.
10. **Linux x64.** Do steps 3, 4, 7 and 9 again for Linux. Set `$ORIGIN` as
    the run path of each library. Add a GPU plug to `snapcraft.yaml`. Apply
    D5 on Linux.
11. **Gate: the owner reviews the step 6 and step 9 results.** Select the
    D12 backend. Decide the integrated-GPU default (risk 6). Keep or revert
    OpenMP off (risk 7). Then ship Windows x64, Windows ARM64, Apple and
    Linux.
12. **CUDA gate (D8).** Benchmark upstream CUDA and Vulkan builds at the
    fllama llama.cpp commit with Telosnex models, on two Nvidia GPU
    generations. Read Microsoft Store Policy 10.2.2 and the redistribution
    list of the NVIDIA CUDA EULA. The owner decides to continue or stop.
13. **CUDA pack, if step 12 continues.** Add the `cuda` pack (D13) to the
    Windows x64 release build. Download it only when an Nvidia GPU is
    present (D14). Test I6.

---

## ──────── non-normative ────────

### A. Alternatives & notes

**Alternatives.**

- **One `fllama.dll` with `/DELAYLOAD:vulkan-1.dll`.** This works only on
  Windows. It needs a probe before each Vulkan entry, and it gives no CPU
  variants. Lost to R5 and R6.
- **`ggml_backend_load_all_from_path(<fllama directory>)`.** This is simpler
  than D4, but it cannot skip GPU backends (I7) or load CUDA first from a
  second directory (I6). It is sufficient if the owner drops D8 and
  "GPU: Off".
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
| x64 `fllama.dll` imports `VCOMP140.DLL` (Problem item 3) | Independent defect. Affects users now. | Workplan step 1, separate release |
| `LLAMA_VULKAN` has no effect | Fixed by D3 | Step 3 |
| x64 CPU code is SSE2 only | Fixed by D2 | Step 3 |
| Windows ARM64 CPU code is ARMv8.0 only | Fixed by D11 | Step 8 |
| Android arm64 builds use `-march=armv8.2-a+dotprod` for all devices (`src/CMakeLists.txt`). CPUs without the dot-product extension, for example Cortex-A53, cannot run this code. | Independent defect. Inferred. | Track separately |
| Telosnex enables the draft model only for `gpuLayers > 0` | Fixed by D5 | Step 5 |
| `fllama_get_gpu_devices` skips integrated GPUs, so Telosnex shows no GPU memory on PCs with only an integrated GPU | Fixed by D9 | Steps 4 and 5 |
| The Windows zip needs an installed Visual C++ runtime | Independent | NG4 |

**Sizes** from the upstream b11396 Windows release archives, unpacked:

| File | MB |
|------|---:|
| `ggml-vulkan.dll` (x64) | 45.3 |
| `ggml-cpu-<variant>.dll` (14 variants, clang) | 0.9 to 1.9 each |
| `ggml-cuda.dll` (CUDA 13.4, x64) | 147.7 |
| `cublasLt64_13.dll` | 492.8 |
| `cublas64_13.dll` | 54.9 |
| `cudart64_13.dll` | 0.6 |

The current fllama VM builds are 7.1 MB (x64) and 8.8 MB (ARM64).

Measured fllama build at `ce2e308` (MSVC, Windows x64, Vulkan SDK 1.4.357.0):
`ggml-vulkan.dll` 51.8 MB, 16.0 MB with gzip. The 9 CPU variants are 8.0 MB
together. `fllama.dll` is 2.5 MB.

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
