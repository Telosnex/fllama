// Build hook for fllama — compiles llama.cpp into a shared library that
// Flutter bundles with the app. Runs automatically on flutter build/run/test.
//
// With package:native_prebuilt (docs/ADR_005_PREBUILT_NATIVE_LIBRARIES.md),
// the hook first downloads the libraries from the GitHub release in
// native_artifacts/prebuilt.json if that manifest matches the package
// sources. User define `native_build`: auto (default), download or source.
// Everything below is the source build.
//
// ═══════════════════════════════════════════════════════════════════════
//   Why this file is complicated
// ═══════════════════════════════════════════════════════════════════════
//
// Flutter's `hooks_runner` (the code that drives build hooks) has several
// rough edges that make naive hooks *extremely* slow in practice:
//
//   1. It unconditionally hashes PATH, HOME, TMPDIR into its per-config
//      cache key. Every different shell environment — VS Code terminal,
//      plain Terminal.app, agent wrappers, CI runners — gets a distinct
//      cache directory and therefore a distinct "cold build."
//
//   2. `dart test` and `flutter test` produce different BuildInput
//      configs (different deployment target, different c_compiler),
//      so each gets its own cache directory → two full builds.
//
//   3. Under concurrent invocations (e.g. N parallel `flutter test`
//      processes from a test-running agent), hooks_runner's per-config
//      directory gets stdout.txt/stderr.txt/hook.dill[.d] written into
//      it, and those writes race — processes crash with
//      PathNotFoundException.
//
//   4. `native_toolchain_cmake`'s CMakeBuilder doesn't declare any
//      file-level dependencies on the output, so hooks_runner has no
//      way to prove the output is fresh and re-runs the hook every
//      single time the config hash differs (which per #1 is always).
//
// hooks_runner is compiled into flutter_tools.snapshot. We cannot
// reasonably fork or patch it.
//
// Instead, this hook sidesteps hooks_runner's caching entirely by
// maintaining its own content-addressed cache under `~/.cache/fllama/`.
// hooks_runner can re-invoke us as often as it likes; 99% of the time
// we hit our cache, copy one file, and return in milliseconds.
//
// ═══════════════════════════════════════════════════════════════════════
//   How the cache works
// ═══════════════════════════════════════════════════════════════════════
//
//   build_key = sha256(
//     target_os, target_arch, build_mode,
//     sorted(defines), GPU SDK version,
//     native_prebuilt source key (sha256 of every package source file)
//   )
//
//   cache_dir = ~/.cache/fllama/<build_key>/
//   cache_lib = <cache_dir>/libfllama.<ext>
//
// On each hook invocation:
//
//   if cache_lib exists:
//     copy cache_lib → input.outputDirectory
//     register as CodeAsset
//     return                                           # ~20ms total
//   else:
//     acquire flock on <cache_dir>/.lock               # serialize peers
//     re-check cache (a peer may have just built)
//     if still missing:
//       run CMakeBuilder with outDir=<cache_dir>       # real compile
//     copy cache_lib → input.outputDirectory
//     register as CodeAsset
//
// Benefits:
//
//   - Different shell envs, different configs, different projects on
//     the same machine: all share one cache keyed on actual build
//     inputs, not environment noise.
//   - 18 concurrent `flutter test` invocations: 1 builds under flock,
//     the other 17 wait (<10s for flock contention) then all hit
//     cache. No PathNotFoundException crash storm.
//   - Editing fllama.cpp: content changes → new build_key → one
//     rebuild; subsequent calls hit the new cache entry.
//   - No git hash / pub cache path in the key: updating fllama to a
//     new commit that changed zero source bytes reuses the cache.

import 'dart:convert';
import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:crypto/crypto.dart';
import 'package:hooks/hooks.dart';
import 'package:logging/logging.dart';
import 'package:native_prebuilt/native_prebuilt.dart';
import 'package:native_toolchain_cmake/native_toolchain_cmake.dart';
import 'package:path/path.dart' as p;

import 'cache_key.dart';

void main(List<String> args) async {
  final hookLog = _HookLogBuffer('fllama');
  await build(args, (input, output) async {
    // Bail out early if the consumer doesn't need native code (e.g. dart
    // analyze, or a platform that doesn't support code assets).
    if (!input.config.buildCodeAssets) return;

    final hookStopwatch = Stopwatch()..start();

    final logger = Logger('')
      ..level = Level.ALL
      ..onRecord.listen((record) => hookLog.add(record.message));

    await NativePrebuilt(input: input, output: output, log: logger.info).run(
      (source) => _buildFromSource(
        input: input,
        output: output,
        source: source,
        logger: logger,
      ),
    );
    logger.info('Hook completed in ${_formatDuration(hookStopwatch.elapsed)}');
  }).whenComplete(hookLog.flush);
}

Future<void> _buildFromSource({
  required BuildInput input,
  required BuildOutputBuilder output,
  required SourceBuild source,
  required Logger logger,
}) async {
  final sourceDir = input.packageRoot.resolve('src/');
  final targetOS = input.config.code.targetOS;
  final targetArch = input.config.code.targetArchitecture;
  final targetVariant = _targetVariant(input.config.code);
  final toolset = windowsToolset(targetOS, targetArch);
  final split = usesSplitLibraries(targetOS, targetArch);
  final release = source.release;

  // ── GPU SDK ────────────────────────────────────────────────────────
  final vulkan = split ? findVulkanSdk(targetOS, targetArch) : null;
  if (split && vulkan == null) {
    if (release != null && targetArch == Architecture.x64) {
      // ADR 004 D7: a release for Windows x64 or Linux x64 has a GPU pack.
      throw StateError(
        'A release build for ${targetOS.name} x64 needs the Vulkan SDK. '
        '${vulkanSdkHint(targetOS)}',
      );
    }
    logger.warning(
      'WARNING: no Vulkan SDK found for ${targetOS.name} '
      '${targetArch.name}. Building CPU backends only. '
      '${vulkanSdkHint(targetOS)}',
    );
  }

  // CUDA is only a GPU pack, so only a release build makes it (ADR 004
  // D8). A local build would bundle the 1 GB NVIDIA libraries.
  CudaToolkit? cuda;
  if (release != null && cudaTargets(targetOS, targetArch)) {
    cuda = findCudaToolkit(targetOS);
    if (cuda == null) {
      throw StateError(
        'A release build for ${targetOS.name} x64 needs the CUDA Toolkit '
        '$cudaToolkitVersion at ${cudaToolkitRoot(targetOS)}.',
      );
    }
  }

  // ── CMake defines ──────────────────────────────────────────────────
  // Only a release build makes GPU backends GPU packs (ADR 005 D7). A
  // local build bundles ggml-vulkan, because it has no host for the pack.
  final defines = computeDefines(
    targetOS,
    targetArch,
    targetVariant,
    vulkan: vulkan,
    cuda: cuda,
    gpuPackUrlTemplate: release?.assetUrl(gpuPackUrlNamePlaceholder),
  );

  // ── Compute build key ──────────────────────────────────────────────
  final buildKey = computeBuildKey(
    os: targetOS.name,
    arch: targetArch.name,
    targetVariant: targetVariant,
    toolset: toolset,
    defines: defines,
    sourceKey: source.sourceKey.key,
    extra: {
      if (vulkan != null) 'vulkan_header': '${vulkan.headerVersion}',
      if (cuda != null) 'cuda': cudaToolkitVersion,
      if (split && targetOS == OS.windows && targetArch == Architecture.arm64)
        'arm64_cpu_variants': windowsArm64CpuVariants.keys.join(','),
    },
  );

  // ── Resolve cache location ─────────────────────────────────────────
  final cacheDir = _cacheDirectory(buildKey);
  logger.info('Build key: $buildKey');
  logger.info('Cache: ${cacheDir.path}');

  final layout = split
      ? _SplitLayout(cacheDir, targetOS)
      : _SingleLayout(cacheDir, _libraryFileName(targetOS));

  // ── Fast path: cache hit ───────────────────────────────────────────
  var cached = await layout.cachedLibraries();
  if (cached == null) {
    // ── Slow path: build under flock ─────────────────────────────────
    await cacheDir.create(recursive: true);
    final lockAndBuildStopwatch = Stopwatch()..start();
    await _withExclusiveLock(
      File(p.join(cacheDir.path, '.build.lock')),
      () async {
        // Another process may have just finished the build while we were
        // waiting for the lock. Re-check before spending 60s recompiling.
        if (await layout.collect(logger) != null) {
          logger.info(
            'Build completed by another process while we waited for the '
            'lock',
          );
          return;
        }

        final cmakeStopwatch = Stopwatch()..start();
        for (final job in _buildJobs(
          targetOS: targetOS,
          targetArch: targetArch,
          split: split,
          cacheDir: cacheDir,
          defines: defines,
        )) {
          final jobDir = Directory.fromUri(job.outDir);
          await jobDir.create(recursive: true);
          // Handle stale CMakeCache.txt. The content-addressed cache dir
          // should make this rare (different source trees → different
          // build key → different dir), but `LLAMA_BUILD_COMMIT` and
          // friends aren't in the key yet, and future edits to
          // computeDefines may introduce keys that aren't fingerprinted.
          await _clearStaleCMakeCache(
            cacheDir: jobDir,
            sourceDir: sourceDir,
            logger: logger,
          );
          final builder = createFllamaBuilder(
            sourceDir: sourceDir,
            // Redirect CMakeBuilder's output into OUR cache dir instead
            // of into hooks_runner's per-config `input.outputDirectory`.
            // This is the critical move — the expensive artifacts live in
            // one stable, shared location.
            outDir: job.outDir,
            defines: job.defines,
            toolset: toolset,
            targets: job.targets,
            logger: logger,
          );
          await builder.run(input: input, output: output, logger: logger);
        }
        logger.info(
          'CMake build finished in '
          '${_formatDuration(cmakeStopwatch.elapsed)}',
        );

        if (await layout.collect(logger) == null) {
          throw StateError(
            'CMake build reported success but the expected libraries are '
            'missing. Contents of cache dir:\n'
            '${await _listForDiagnostics(cacheDir)}',
          );
        }
      },
      logger: logger,
    );
    logger.info(
      'Cache miss resolved in '
      '${_formatDuration(lockAndBuildStopwatch.elapsed)}',
    );
    cached = await layout.cachedLibraries();
    if (cached == null) {
      throw StateError('Libraries missing from ${cacheDir.path}');
    }
  }

  final publishStopwatch = Stopwatch()..start();
  // GPU packs are downloads, not code assets (ADR 004, D13).
  final packs = layout is _SplitLayout
      ? await layout.gpuPackFiles()
      : const <GpuPackFile>[];
  for (final pack in packs) {
    final url = release?.assetUrl(pack.name);
    if (pack.url != url) {
      throw StateError(
        'fllama contains the URL ${pack.url} for GPU pack file ${pack.name}, '
        'but the release asset URL is $url.',
      );
    }
    release!.addRuntimeFile(
      File(p.join(cacheDir.path, 'out', pack.name)).uri,
      pack: pack.pack,
    );
    logger.info('GPU pack ${pack.pack}: ${pack.name} (${pack.sha256})');
  }
  final packNames = {for (final pack in packs) pack.name};
  final bundled = [
    for (final lib in cached)
      if (!packNames.contains(p.basename(lib.path))) lib,
  ];
  for (final lib in bundled) {
    await _publishFromCache(
      cachedLib: lib,
      outputDirectory: input.outputDirectory,
      libFileName: p.basename(lib.path),
      logger: logger,
    );
    if (shouldStripAndroidLibrary(targetOS, release: release != null)) {
      // The NDK adds -g even for Release. Strip only the published copy,
      // before native_prebuilt hashes it; keep the cache for debugging.
      await stripAndroidReleaseLibrary(
        library: File.fromUri(
          input.outputDirectory.resolve(p.basename(lib.path)),
        ),
        cmakeCache: File(p.join(cacheDir.path, 'CMakeCache.txt')),
        logger: logger,
      );
    }
  }
  _registerAssets(
    input: input,
    output: output,
    libFileNames: [for (final lib in bundled) p.basename(lib.path)],
    logger: logger,
  );
  logger.info(
    'Published ${bundled.length} libraries in '
    '${_formatDuration(publishStopwatch.elapsed)}',
  );
}

/// One CMake configure + build in the cache directory.
final class _BuildJob {
  const _BuildJob(this.outDir, this.defines, this.targets);

  final Uri outDir;
  final Map<String, String> defines;
  final List<String> targets;
}

List<_BuildJob> _buildJobs({
  required OS targetOS,
  required Architecture targetArch,
  required bool split,
  required Directory cacheDir,
  required Map<String, String> defines,
}) {
  final jobs = [
    _BuildJob(cacheDir.uri, defines, const ['fllama']),
  ];
  if (split && targetOS == OS.windows && targetArch == Architecture.arm64) {
    // ggml cannot build CPU variants for Windows ARM (ADR 004, D11). The
    // main build makes the baseline CPU backend. Each other variant is a
    // separate build of only ggml-cpu (and ggml-base, which it links) with
    // the same options except GGML_CPU_ARM_ARCH.
    for (final entry in windowsArm64CpuVariants.entries.skip(1)) {
      jobs.add(
        _BuildJob(
          Directory(p.join(cacheDir.path, 'cpu-${entry.key}')).uri,
          {...defines, 'GGML_CPU_ARM_ARCH': entry.value},
          const ['ggml-cpu'],
        ),
      );
    }
  }
  return jobs;
}

/// Serial is native_toolchain_cmake's default. Use all available cores for
/// cold llama.cpp builds on CI and developer machines; the cache lock still
/// ensures that concurrent hooks compile each content key only once.
CMakeBuilder createFllamaBuilder({
  required Uri sourceDir,
  required Uri outDir,
  required Map<String, String> defines,
  String? toolset,
  List<String> targets = const ['fllama'],
  required Logger logger,
}) => CMakeBuilder.create(
  name: 'fllama',
  sourceDir: sourceDir,
  outDir: outDir,
  // native_toolchain_cmake 0.2.7 does not forward `toolset` to `cmake -T`,
  // so a toolchain file selects it. The absolute paths are added after the
  // cache key is computed, keeping keys checkout-path independent.
  defines: {
    ...defines,
    if (toolset != null)
      'CMAKE_TOOLCHAIN_FILE': _toolsetToolchainFile(sourceDir, toolset)
    else if (defines.containsKey('FLLAMA_CUDA_TOOLKIT_DIR'))
      // The Visual Studio generator finds CUDA through `cmake -T cuda=`.
      'CMAKE_TOOLCHAIN_FILE': p.join(
        Directory.fromUri(sourceDir).path,
        'cmake',
        'windows-cuda.toolchain.cmake',
      ),
    if (defines['GGML_VULKAN'] == 'ON')
      'GGML_VULKAN_SHADERS_GEN_TOOLCHAIN': p.join(
        Directory.fromUri(sourceDir).path,
        'cmake',
        'host.toolchain.cmake',
      ),
  },
  targets: targets,
  buildLocal: false,
  parallelUseAllProcessors: true,
  logger: logger,
);

/// Visual Studio toolset (`cmake -T`) for [targetOS] and [arch], if not the
/// default MSVC toolset.
///
/// llama.cpp rejects MSVC for ARM builds: its ARM kernels need clang's
/// `-march` feature flags and GNU-style intrinsics. Visual Studio's ClangCL
/// toolset keeps the Visual Studio generator, MSVC ABI, and Windows SDK, but
/// compiles with clang-cl. It needs the Visual Studio components
/// `Microsoft.VisualStudio.Component.VC.Llvm.Clang` and
/// `Microsoft.VisualStudio.Component.VC.Llvm.ClangToolset`.
String? windowsToolset(OS targetOS, Architecture arch) =>
    targetOS == OS.windows && arch == Architecture.arm64 ? 'ClangCL' : null;

String _toolsetToolchainFile(Uri sourceDir, String toolset) {
  if (toolset != 'ClangCL') {
    throw ArgumentError.value(toolset, 'toolset', 'No toolchain file');
  }
  return p.join(
    Directory.fromUri(sourceDir).path,
    'cmake',
    'windows-clangcl.toolchain.cmake',
  );
}

/// Collects logger records so hooks_runner receives one newline-normalized
/// stderr message instead of adding a blank line after every streamed chunk.
final class _HookLogBuffer {
  _HookLogBuffer(this.tag);

  final String tag;
  final List<String> _lines = [];

  void add(String message) {
    final normalized = message.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    for (final line in normalized.split('\n')) {
      if (line.trim().isEmpty) continue;
      _lines.add('[$tag] $line');
    }
  }

  void flush() {
    if (_lines.isEmpty) return;
    // hooks_runner adds the terminating newline while capturing this chunk.
    stderr.write(_lines.join('\n'));
  }
}

// ─────────────────────────────────────────────────────────────────────────
//   duration formatting
// ─────────────────────────────────────────────────────────────────────────

String _formatDuration(Duration duration) {
  final millis = duration.inMilliseconds;
  if (millis < 1000) return '${millis}ms';
  final seconds = duration.inSeconds;
  final remainderMillis = millis - seconds * 1000;
  if (seconds < 60) {
    return '$seconds.${(remainderMillis ~/ 100).toString()}s';
  }
  final minutes = seconds ~/ 60;
  final remainderSeconds = seconds % 60;
  return '${minutes}m ${remainderSeconds}s';
}

// ─────────────────────────────────────────────────────────────────────────
//   defines
// ─────────────────────────────────────────────────────────────────────────

String _targetVariant(CodeConfig config) {
  if (config.targetOS == OS.iOS) {
    // arm64 device and Apple-silicon simulator builds have the same OS and
    // architecture but incompatible Mach-O platforms. They must never share a
    // compiled-library cache entry.
    return config.iOS.targetSdk.toString();
  }
  return '';
}

/// Whether [targetOS] and [targetArch] ship ggml as separate libraries with
/// run-time backend selection (ADR 004, D1). Other targets link everything
/// into the one fllama library.
bool usesSplitLibraries(OS targetOS, Architecture targetArch) =>
    targetOS == OS.windows ||
    (targetOS == OS.linux && targetArch == Architecture.x64);

/// Windows ARM64 CPU backends: published file suffix → GGML_CPU_ARM_ARCH.
/// The first entry is the baseline that every ARM64 CPU can run. The loader
/// in src/fllama_backends.cpp selects among these names.
const windowsArm64CpuVariants = <String, String>{
  'armv8.0': 'armv8-a',
  'armv8.2-dotprod': 'armv8.2-a+dotprod',
};

/// Pinned Windows Vulkan SDK. This is the version in the upstream llama.cpp
/// release workflow at the vendored commit.
const windowsVulkanSdkVersion = '1.4.357.0';

/// A Vulkan SDK that the hook found on this machine.
final class VulkanSdk {
  const VulkanSdk({required this.headerVersion, this.defines = const {}});

  /// `VK_HEADER_VERSION` from `vulkan_core.h`. Part of the build key.
  final int headerVersion;

  /// CMake defines that point FindVulkan at this SDK.
  final Map<String, String> defines;
}

String vulkanSdkHint(OS targetOS) => targetOS == OS.windows
    ? 'Install the Vulkan SDK $windowsVulkanSdkVersion to '
          r'C:\VulkanSDK\'
          '$windowsVulkanSdkVersion for GPU support.'
    : 'Install libvulkan-dev, glslc and spirv-headers for GPU support.';

/// Finds the Vulkan SDK for a split-library target, or returns null.
///
/// hooks_runner does not pass VULKAN_SDK to hooks, so this looks in fixed
/// locations. Windows uses only the pinned SDK version, so every machine
/// builds the same backend. Linux uses the distribution packages.
VulkanSdk? findVulkanSdk(OS targetOS, Architecture targetArch) {
  if (targetOS == OS.windows) {
    // Windows ARM64 GPU backend is chosen by benchmark (ADR 004, D12).
    if (targetArch != Architecture.x64) return null;
    final sdk = p.join(r'C:\VulkanSDK', windowsVulkanSdkVersion);
    final header = File(p.join(sdk, 'Include', 'vulkan', 'vulkan_core.h'));
    final library = File(p.join(sdk, 'Lib', 'vulkan-1.lib'));
    final glslc = File(p.join(sdk, 'Bin', 'glslc.exe'));
    final spirvHeaders = Directory(
      p.join(sdk, 'Lib', 'cmake', 'SPIRV-Headers'),
    );
    if (!header.existsSync() ||
        !library.existsSync() ||
        !glslc.existsSync() ||
        !spirvHeaders.existsSync()) {
      return null;
    }
    final version = readVulkanHeaderVersion(header.readAsStringSync());
    if (version == null) return null;
    return VulkanSdk(
      headerVersion: version,
      defines: {
        'Vulkan_INCLUDE_DIR': p.join(sdk, 'Include'),
        'Vulkan_LIBRARY': library.path,
        'Vulkan_GLSLC_EXECUTABLE': glslc.path,
        // ggml-vulkan finds SPIRV-Headers through $VULKAN_SDK, which hooks
        // do not receive.
        'SPIRV-Headers_DIR': spirvHeaders.path,
      },
    );
  }
  if (targetOS == OS.linux) {
    final header = File('/usr/include/vulkan/vulkan_core.h');
    if (!header.existsSync()) return null;
    if (!File('/usr/include/spirv/unified1/spirv.hpp').existsSync()) {
      return null;
    }
    final pathDirs = (Platform.environment['PATH'] ?? '').split(':');
    final hasGlslc = [
      ...pathDirs,
      '/usr/bin',
    ].any((dir) => dir.isNotEmpty && File(p.join(dir, 'glslc')).existsSync());
    if (!hasGlslc) return null;
    final version = readVulkanHeaderVersion(header.readAsStringSync());
    if (version == null) return null;
    return VulkanSdk(headerVersion: version);
  }
  return null;
}

/// Pinned CUDA Toolkit for the CUDA GPU pack (ADR 004 D8). The release
/// workflow installs it from the NVIDIA redistributable archives.
const cudaToolkitVersion = '12.8';

/// GPU architectures of the CUDA pack. `-real` is machine code, so these
/// GPUs need no JIT compilation and run with any CUDA 12 driver:
/// GTX 10 (61), GTX 16 and RTX 20 (75), A100 (80), RTX 30 (86), RTX 40
/// (89) and RTX 50 (120a). `90-virtual` is PTX for other and future GPUs.
const cudaArchitectures =
    '61-real;75-real;80-real;86-real;89-real;'
    '90-virtual;120a-real';

/// Whether a release for [targetOS] and [targetArch] has a CUDA pack.
bool cudaTargets(OS targetOS, Architecture targetArch) =>
    targetArch == Architecture.x64 &&
    (targetOS == OS.windows || targetOS == OS.linux);

/// Where the release workflow installs the CUDA Toolkit. hooks_runner does
/// not pass CUDA_PATH to hooks, so the hook uses fixed locations.
String cudaToolkitRoot(OS targetOS) => targetOS == OS.windows
    ? p.windows.join(
        r'C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA',
        'v$cudaToolkitVersion',
      )
    : '/usr/local/cuda-$cudaToolkitVersion';

/// A CUDA Toolkit that the hook found on this machine.
final class CudaToolkit {
  const CudaToolkit({required this.defines});

  /// CMake defines that select this toolkit.
  final Map<String, String> defines;
}

/// Finds the pinned CUDA Toolkit, or returns null.
CudaToolkit? findCudaToolkit(OS targetOS) {
  final root = cudaToolkitRoot(targetOS);
  if (targetOS == OS.windows) {
    final required = [
      p.windows.join(root, 'bin', 'nvcc.exe'),
      p.windows.join(root, 'include', 'cublas_v2.h'),
      p.windows.join(
        root,
        'extras',
        'visual_studio_integration',
        'MSBuildExtensions',
        'CUDA $cudaToolkitVersion.props',
      ),
    ];
    if (!required.every((path) => File(path).existsSync())) return null;
    return CudaToolkit(
      defines: {
        'CUDAToolkit_ROOT': root,
        // Read by cmake/windows-cuda.toolchain.cmake.
        'FLLAMA_CUDA_TOOLKIT_DIR': root,
      },
    );
  }
  final nvcc = p.join(root, 'bin', 'nvcc');
  if (!File(nvcc).existsSync() ||
      !File(p.join(root, 'include', 'cublas_v2.h')).existsSync()) {
    return null;
  }
  return CudaToolkit(
    defines: {'CUDAToolkit_ROOT': root, 'CMAKE_CUDA_COMPILER': nvcc},
  );
}

/// The text in [PrebuiltRelease.assetUrl] that CMake replaces with the
/// file name of each GPU pack file (src/cmake/gpu_packs.cmake).
const gpuPackUrlNamePlaceholder = '@FILE@';

/// Reads `#define VK_HEADER_VERSION <n>` from `vulkan_core.h`.
int? readVulkanHeaderVersion(String header) {
  final match = RegExp(
    r'^#define\s+VK_HEADER_VERSION\s+(\d+)',
    multiLine: true,
  ).firstMatch(header);
  return match == null ? null : int.parse(match.group(1)!);
}

/// CMake defines for a target. [gpuPackUrlTemplate] is the release URL of
/// a GPU pack file, with [gpuPackUrlNamePlaceholder] for its name. Without
/// it, ggml-vulkan is a normal library. [cuda] needs [gpuPackUrlTemplate].
Map<String, String> computeDefines(
  OS targetOS,
  Architecture targetArch,
  String targetVariant, {
  VulkanSdk? vulkan,
  CudaToolkit? cuda,
  String? gpuPackUrlTemplate,
}) {
  if (cuda != null && gpuPackUrlTemplate == null) {
    throw ArgumentError('CUDA is only built as a GPU pack.');
  }
  final defines = <String, String>{
    'CMAKE_BUILD_TYPE': 'Release',
    // Static-link all llama sub-libraries (ggml, llama, common, etc.) into
    // the single fllama shared library that we ship.
    'BUILD_SHARED_LIBS': 'OFF',
    // LLAMA_NATIVE=ON would emit -march=native, producing binaries that
    // crash on machines with a different CPU than the build host.
    'LLAMA_NATIVE': 'OFF',
    // We don't need llama.cpp's HTTP server, tests, or examples.
    'LLAMA_HTTPLIB': 'OFF',
    'LLAMA_CURL': 'OFF',
    'LLAMA_BUILD_SERVER': 'OFF',
    'LLAMA_BUILD_TESTS': 'OFF',
    'LLAMA_BUILD_EXAMPLES': 'OFF',
    'LLAMA_BUILD_NUMBER': '1',
    'LLAMA_BUILD_COMMIT': 'unknown',
  };

  // Apple devices and macOS use Metal. The iOS simulator's Metal shim aborts
  // on llama.cpp's external-pointer buffers, so simulator integration tests
  // intentionally use the CPU backend.
  if (targetOS == OS.macOS ||
      (targetOS == OS.iOS && targetVariant != 'iphonesimulator')) {
    defines['GGML_METAL'] = 'ON';
    // Embed the Metal shader library into the binary so we don't need
    // to ship a separate .metallib file.
    defines['GGML_METAL_EMBED_LIBRARY'] = 'ON';
  } else if (targetOS == OS.iOS) {
    defines['GGML_METAL'] = 'OFF';
  }
  if (targetOS == OS.macOS || targetOS == OS.iOS) {
    // Homebrew's libomp is arm64-only; linking fails on x86_64 / universal
    // builds. llama.cpp uses pthreads as a fallback, which is fine.
    defines['GGML_OPENMP'] = 'OFF';
  }
  if (targetOS == OS.macOS) {
    defines['CMAKE_OSX_DEPLOYMENT_TARGET'] = '10.15';
  }
  if (targetOS == OS.iOS) {
    defines['CMAKE_OSX_DEPLOYMENT_TARGET'] = '13.0';
  }

  if (targetOS == OS.windows) {
    // OpenMP adds a runtime DLL that the app package does not contain: MSVC
    // links vcomp140.dll and clang-cl links libomp140.<arch>.dll. The msix
    // package bundles only the core C++ runtime DLLs, and libomp140 is not
    // redistributable, so fllama.dll fails to load on PCs without the
    // Visual C++ Redistributable. llama.cpp's own threadpool replaces OpenMP.
    // See docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D6.
    defines['GGML_OPENMP'] = 'OFF';
  }

  // Linux: position-independent code — the static .a libs get linked into
  // a shared .so; without -fPIC the linker refuses to emit relocatable code.
  if (targetOS == OS.linux) {
    defines['CMAKE_POSITION_INDEPENDENT_CODE'] = 'ON';
  }

  if (usesSplitLibraries(targetOS, targetArch)) {
    // One library per ggml component and backend. fllama selects the GPU
    // and CPU backends at run time (ADR 004, D1 and D4).
    defines['BUILD_SHARED_LIBS'] = 'ON';
    defines['GGML_BACKEND_DL'] = 'ON';
    defines['GGML_NATIVE'] = 'OFF';
    if (targetArch == Architecture.x64) {
      defines['GGML_CPU_ALL_VARIANTS'] = 'ON';
    } else if (targetOS == OS.windows && targetArch == Architecture.arm64) {
      defines['GGML_CPU_ARM_ARCH'] = windowsArm64CpuVariants.values.first;
    }
    if (targetOS == OS.linux) {
      // Plain file names (libllama.so, not libllama.so.0), so the NEEDED
      // entries match the files that the code assets publish.
      defines['CMAKE_PLATFORM_NO_VERSIONED_SONAME'] = 'ON';
    }
    if (vulkan != null) {
      defines['GGML_VULKAN'] = 'ON';
      defines.addAll(vulkan.defines);
    }
    if (cuda != null) {
      defines['GGML_CUDA'] = 'ON';
      defines['FLLAMA_CUDA_TIMING'] = 'ON';
      defines['CMAKE_CUDA_ARCHITECTURES'] = cudaArchitectures;
      // One library for all GPUs. NCCL is only for several GPUs.
      defines['GGML_CUDA_NCCL'] = 'OFF';
      defines.addAll(cuda.defines);
    }
    if (gpuPackUrlTemplate != null && (vulkan != null || cuda != null)) {
      defines['FLLAMA_GPU_PACK_URL_TEMPLATE'] = gpuPackUrlTemplate;
    }
  }

  // Android: disable features incompatible with the NDK.
  if (targetOS == OS.android) {
    defines['GGML_LLAMAFILE'] = 'OFF';
    defines['GGML_OPENMP'] = 'OFF';
  }

  return defines;
}

// ─────────────────────────────────────────────────────────────────────────
//   cache location
// ─────────────────────────────────────────────────────────────────────────

/// Returns the cache directory for a given build key.
///
/// Resolution order, per the XDG Base Directory Specification v0.8
/// (freedesktop.org, 2021-05-08) [1]:
///
///   1. `$XDG_CACHE_HOME/fllama/<key>` if XDG_CACHE_HOME is set & non-empty
///   2. `$HOME/.cache/fllama/<key>` on Unix (Linux, macOS)
///   3. `%LOCALAPPDATA%\fllama\Cache\<key>` on Windows
///
/// Why XDG/`~/.cache` on macOS rather than the "native" `~/Library/Caches`?
/// Because every compilation-cache-class dev tool in this category uses XDG:
///
///   - ccache (our closest analog — a build-output cache) defaults to
///     `$XDG_CACHE_HOME/ccache`, falling back to `$HOME/.cache/ccache`
///     on ALL non-Windows systems including macOS. [2]
///   - pip, poetry, uv, cargo's sccache, bazel's disk cache, Gradle's
///     build cache — all use `~/.cache` or honor XDG on macOS.
///   - `~/Library/Caches` is Apple's recommendation for GUI apps [3].
///     Dev/CLI tools on macOS overwhelmingly ignore it; doing so keeps
///     the cache discoverable to scripts, tar, rsync, and `du -sh`,
///     none of which know to look under `~/Library`.
///
/// [1] https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
/// [2] https://ccache.dev/manual/latest.html#_cache_directory
/// [3] https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
Directory _cacheDirectory(String buildKey) {
  // XDG_CACHE_HOME wins if explicitly set — honors user overrides on
  // any OS, including Windows (where some dev environments set it).
  final xdg = Platform.environment['XDG_CACHE_HOME'];
  if (xdg != null && xdg.isNotEmpty) {
    return Directory(p.join(xdg, 'fllama', buildKey));
  }

  if (Platform.isWindows) {
    final localAppData = Platform.environment['LOCALAPPDATA'];
    if (localAppData != null && localAppData.isNotEmpty) {
      return Directory(p.join(localAppData, 'fllama', 'Cache', buildKey));
    }
    // Extremely unusual — LOCALAPPDATA should always be set on Windows.
    // Fall through to USERPROFILE\.cache as a last resort.
  }

  final home =
      Platform.environment['HOME'] ??
      Platform.environment['USERPROFILE'] ??
      (throw StateError(
        'Cannot locate user home: neither HOME, USERPROFILE, nor '
        'XDG_CACHE_HOME is set.',
      ));
  return Directory(p.join(home, '.cache', 'fllama', buildKey));
}

String _libraryFileName(OS targetOS) =>
    sharedLibraryFileName(targetOS, 'fllama');

/// File name of the shared library [stem] on [targetOS].
String sharedLibraryFileName(OS targetOS, String stem) =>
    targetOS.dylibFileName(stem);

/// Ensures [cachedLib] exists at the canonical cache root.
///
/// MSVC generators place DLLs in config subdirectories like `Release/`; copy
/// that output back to the root so later cache hits and asset publishing agree.
Future<bool> _normalizeBuiltLibraryIntoCache({
  required Directory cacheDir,
  required File cachedLib,
  required String libFileName,
  required Logger logger,
}) async {
  if (await cachedLib.exists()) return true;

  final builtLib = await _findBuiltLibrary(cacheDir, libFileName);
  if (builtLib == null) return false;

  logger.info('Normalizing CMake output ${builtLib.path} → ${cachedLib.path}');
  await cachedLib.parent.create(recursive: true);
  await builtLib.copy(cachedLib.path);
  return true;
}

Future<File?> _findBuiltLibrary(Directory cacheDir, String libFileName) async {
  final candidates = <File>[];
  await for (final entity in cacheDir.list(
    recursive: true,
    followLinks: false,
  )) {
    if (entity is! File || p.basename(entity.path) != libFileName) continue;
    candidates.add(entity);
  }
  if (candidates.isEmpty) return null;
  candidates.sort((a, b) {
    final score = _builtLibraryCandidateScore(
      a,
    ).compareTo(_builtLibraryCandidateScore(b));
    if (score != 0) return score;
    return a.path.compareTo(b.path);
  });
  return candidates.first;
}

int _builtLibraryCandidateScore(File file) {
  final parts = p.split(file.path).map((part) => part.toLowerCase()).toSet();
  if (parts.contains('release')) return 0;
  if (parts.contains('relwithdebinfo')) return 1;
  if (parts.contains('minsizerel')) return 2;
  if (parts.contains('debug')) return 3;
  return 4;
}

// ─────────────────────────────────────────────────────────────────────────
//   flock
// ─────────────────────────────────────────────────────────────────────────

Future<void> _withExclusiveLock(
  File lockFile,
  Future<void> Function() body, {
  required Logger logger,
}) async {
  await lockFile.parent.create(recursive: true);
  if (!await lockFile.exists()) {
    // Create empty; we only care about the lock, not the file contents.
    await lockFile.writeAsString('');
  }
  final raf = await lockFile.open(mode: FileMode.append);
  try {
    final sw = Stopwatch()..start();
    await raf.lock(FileLock.blockingExclusive);
    if (sw.elapsedMilliseconds > 100) {
      logger.info('Waited ${sw.elapsedMilliseconds}ms for build lock');
    }
    try {
      await body();
    } finally {
      await raf.unlock();
    }
  } finally {
    await raf.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────
//   cache staleness
// ─────────────────────────────────────────────────────────────────────────

Future<void> _clearStaleCMakeCache({
  required Directory cacheDir,
  required Uri sourceDir,
  required Logger logger,
}) async {
  final cmakeCache = File(p.join(cacheDir.path, 'CMakeCache.txt'));
  if (!await cmakeCache.exists()) return;
  final content = await cmakeCache.readAsString();
  final sourcePath = Directory.fromUri(sourceDir).path;
  if (content.contains(sourcePath)) return;
  logger.info('Source dir changed vs CMakeCache.txt; wiping cache dir');
  await for (final entity in cacheDir.list()) {
    if (entity is File && p.basename(entity.path) == '.build.lock') continue;
    if (entity is Directory) {
      await entity.delete(recursive: true);
    } else {
      await entity.delete();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
//   publish + register
// ─────────────────────────────────────────────────────────────────────────

Future<void> _publishFromCache({
  required File cachedLib,
  required Uri outputDirectory,
  required String libFileName,
  required Logger logger,
}) async {
  await Directory.fromUri(outputDirectory).create(recursive: true);
  final dest = File(
    p.join(Directory.fromUri(outputDirectory).path, libFileName),
  );
  // Only copy if missing or older than the cached source, to save on
  // filesystem churn on back-to-back cache hits.
  var needCopy = true;
  if (await dest.exists()) {
    final destStat = await dest.stat();
    final srcStat = await cachedLib.stat();
    if (destStat.size == srcStat.size &&
        !destStat.modified.isBefore(srcStat.modified)) {
      needCopy = false;
    }
  }
  if (needCopy) {
    logger.info('Copying cached library → ${dest.path}');
    await cachedLib.copy(dest.path);
  }
}

/// Developer source builds retain debug information; Android releases do not.
bool shouldStripAndroidLibrary(OS os, {required bool release}) =>
    os == OS.android && release;

/// Uses the strip tool selected by CMake's NDK toolchain, not the host strip.
/// The caller passes the published copy, never the cached build library.
Future<void> stripAndroidReleaseLibrary({
  required File library,
  required File cmakeCache,
  required Logger logger,
  Future<ProcessResult> Function(String, List<String>) run = Process.run,
}) async {
  final cache = await cmakeCache.readAsString();
  final strip = RegExp(
    r'^CMAKE_STRIP:FILEPATH=(.+)$',
    multiLine: true,
  ).firstMatch(cache)?.group(1)?.trim();
  if (strip == null || strip.isEmpty || strip.endsWith('-NOTFOUND')) {
    throw StateError('No NDK CMAKE_STRIP in ${cmakeCache.path}.');
  }
  final before = await library.length();
  final result = await run(strip, ['--strip-unneeded', library.path]);
  if (result.exitCode != 0) {
    throw StateError(
      'NDK strip failed (${result.exitCode}) for ${library.path}: '
      '${result.stdout}\n${result.stderr}',
    );
  }
  logger.info(
    'Stripped Android release ${library.path}: '
    '$before → ${await library.length()} bytes',
  );
}

/// Registers each published library as a code asset. Flutter bundles all of
/// them next to each other: beside the executable on Windows and in `lib/`
/// on Linux. ggml's backend libraries are not opened from Dart, but they
/// must be registered to be bundled.
void _registerAssets({
  required BuildInput input,
  required BuildOutputBuilder output,
  required List<String> libFileNames,
  required Logger logger,
}) {
  for (final fileName in libFileNames) {
    output.assets.code.add(
      CodeAsset(
        package: input.packageName,
        name: codeAssetName(fileName),
        linkMode: DynamicLoadingBundled(),
        file: input.outputDirectory.resolve(fileName),
      ),
    );
  }
  logger.info('Registered ${libFileNames.length} code asset(s).');
}

/// Code asset name for a published library file. The fllama library keeps
/// the name that `fllama_io.dart` resolves. Other libraries use
/// `native/<file name without extension>`.
String codeAssetName(String fileName) {
  final stem = p.basenameWithoutExtension(fileName);
  if (stem == 'fllama' || stem == 'libfllama') return 'fllama_io.dart';
  return 'native/$stem';
}

// ─────────────────────────────────────────────────────────────────────────
//   GPU packs (ADR 004, D13)
// ─────────────────────────────────────────────────────────────────────────

/// One file of a GPU pack, as listed in the `gpu_packs.json` that
/// src/cmake/gpu_packs.cmake writes.
final class GpuPackFile {
  const GpuPackFile({
    required this.pack,
    required this.name,
    required this.sha256,
    required this.url,
  });

  factory GpuPackFile.fromJson(Map<String, Object?> json) => GpuPackFile(
    pack: json['pack']! as String,
    name: json['name']! as String,
    sha256: json['sha256']! as String,
    url: json['url']! as String,
  );

  final String pack;
  final String name;
  final String sha256;

  /// The gzipped file in the fllama GitHub release (ADR 005 §5).
  final String url;
}

List<GpuPackFile> parseGpuPackFiles(String json) => [
  for (final entry in jsonDecode(json) as List<Object?>)
    GpuPackFile.fromJson((entry! as Map).cast<String, Object?>()),
];

// ─────────────────────────────────────────────────────────────────────────
//   cache layouts
// ─────────────────────────────────────────────────────────────────────────

/// Where a finished build keeps its libraries inside the cache directory.
sealed class _CacheLayout {
  /// The cached libraries, or null if the cache entry is incomplete.
  Future<List<File>?> cachedLibraries();

  /// Moves fresh CMake output into the cache layout. Returns the libraries,
  /// or null if the CMake output is incomplete.
  Future<List<File>?> collect(Logger logger);
}

/// One fllama library at the cache root (Apple, Android, Linux arm64).
final class _SingleLayout extends _CacheLayout {
  _SingleLayout(this.cacheDir, this.libFileName)
    : cachedLib = File(p.join(cacheDir.path, libFileName));

  final Directory cacheDir;
  final String libFileName;
  final File cachedLib;

  @override
  Future<List<File>?> cachedLibraries() async =>
      await cachedLib.exists() ? [cachedLib] : null;

  @override
  Future<List<File>?> collect(Logger logger) async {
    final ok = await _normalizeBuiltLibraryIntoCache(
      cacheDir: cacheDir,
      cachedLib: cachedLib,
      libFileName: libFileName,
      logger: logger,
    );
    return ok ? [cachedLib] : null;
  }
}

/// All libraries in `<cache>/out/`, listed by `<cache>/out/manifest.txt`.
/// The manifest is written last, so its presence marks a complete entry.
final class _SplitLayout extends _CacheLayout {
  _SplitLayout(this.cacheDir, this.targetOS)
    : outDir = Directory(p.join(cacheDir.path, 'out'));

  final Directory cacheDir;
  final OS targetOS;
  final Directory outDir;

  File get _manifest => File(p.join(outDir.path, 'manifest.txt'));

  File get _gpuPacks => File(p.join(outDir.path, 'gpu_packs.json'));

  /// GPU pack files of a complete cache entry. Their libraries are in
  /// [cachedLibraries] too.
  Future<List<GpuPackFile>> gpuPackFiles() async =>
      parseGpuPackFiles(await _gpuPacks.readAsString());

  /// A shared library name. Linux CUDA libraries have their soname, for
  /// example `libcudart.so.12` (src/CMakeLists.txt).
  bool _isLibrary(String name) => targetOS == OS.windows
      ? p.extension(name) == '.dll'
      : RegExp(r'\.so(\.\d+)*$').hasMatch(name);

  @override
  Future<List<File>?> cachedLibraries() async {
    if (!await _manifest.exists() || !await _gpuPacks.exists()) return null;
    final names = (await _manifest.readAsLines())
        .where((line) => line.trim().isNotEmpty)
        .toList();
    final files = [for (final name in names) File(p.join(outDir.path, name))];
    for (final file in files) {
      if (!await file.exists()) return null;
    }
    return files;
  }

  @override
  Future<List<File>?> collect(Logger logger) async {
    final existing = await cachedLibraries();
    if (existing != null) return existing;

    // CMake writes every runtime library to <build>/bin, plus a config
    // subdirectory for Visual Studio generators.
    final main = await _librariesIn(Directory(p.join(cacheDir.path, 'bin')));
    if (!main.containsKey(_name('fllama'))) return null;

    final published = <String, File>{...main};
    if (targetOS == OS.windows && main.containsKey('ggml-cpu.dll')) {
      // Windows ARM64: name each CPU build by its variant (ADR 004, D11).
      final variants = windowsArm64CpuVariants.keys.toList();
      published.remove('ggml-cpu.dll');
      published['ggml-cpu-${variants.first}.dll'] = main['ggml-cpu.dll']!;
      for (final variant in variants.skip(1)) {
        final extra = await _librariesIn(
          Directory(p.join(cacheDir.path, 'cpu-$variant', 'bin')),
        );
        final cpu = extra['ggml-cpu.dll'];
        if (cpu == null) return null;
        published['ggml-cpu-$variant.dll'] = cpu;
      }
    }

    // fllama contains these SHA-256 values. Check that the copies match,
    // so a pack that fllama rejects never leaves the build.
    final packsJson = File(p.join(cacheDir.path, 'gpu_packs.json'));
    if (!await packsJson.exists()) return null;
    final packs = parseGpuPackFiles(await packsJson.readAsString());
    for (final pack in packs) {
      final file = published[pack.name];
      if (file == null) return null;
      final actual = sha256.convert(await file.readAsBytes()).toString();
      if (actual != pack.sha256) {
        throw StateError(
          'GPU pack file ${pack.name} has SHA-256 $actual, but fllama '
          'expects ${pack.sha256}.',
        );
      }
    }

    await outDir.create(recursive: true);
    final names = published.keys.toList()..sort();
    for (final name in names) {
      await published[name]!.copy(p.join(outDir.path, name));
    }
    await packsJson.copy(_gpuPacks.path);
    logger.info('Collected ${names.length} libraries: ${names.join(', ')}');
    // Written last: its presence marks a complete cache entry.
    await _manifest.writeAsString('${names.join('\n')}\n');
    return cachedLibraries();
  }

  String _name(String stem) =>
      targetOS == OS.windows ? '$stem.dll' : 'lib$stem.so';

  /// Libraries directly in [dir], or in its Release subdirectory.
  Future<Map<String, File>> _librariesIn(Directory dir) async {
    for (final candidate in [Directory(p.join(dir.path, 'Release')), dir]) {
      if (!await candidate.exists()) continue;
      final found = <String, File>{};
      await for (final entity in candidate.list(followLinks: false)) {
        if (entity is! File) continue;
        final name = p.basename(entity.path);
        if (_isLibrary(name)) found[name] = entity;
      }
      if (found.isNotEmpty) return found;
    }
    return const {};
  }
}

// ─────────────────────────────────────────────────────────────────────────
//   diagnostics
// ─────────────────────────────────────────────────────────────────────────

Future<String> _listForDiagnostics(Directory dir) async {
  final buffer = StringBuffer();
  try {
    await for (final e in dir.list(recursive: true, followLinks: false)) {
      buffer.writeln('  ${e.path}');
    }
  } catch (err) {
    buffer.writeln('  (failed to list: $err)');
  }
  return buffer.toString();
}
