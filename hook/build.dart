// Build hook for fllama — compiles llama.cpp into a shared library that
// Flutter bundles with the app. Runs automatically on flutter build/run/test.
//
// How Dart native asset hooks work:
//   1. The Dart SDK discovers hook/build.dart in any dependency.
//   2. It invokes the hook with BuildInput (target OS, arch, output dir, etc).
//   3. The hook compiles native code and writes BuildOutput (list of assets
//      to bundle, plus dependency files for cache invalidation).
//   4. The SDK bundles the produced .dylib/.so/.dll with the app.
//   5. Dart code uses @Native() or DynamicLibrary.open() to call into it.
//
// Caching:
//   The hooks runner only re-runs this script if files declared via
//   output.addDependency() have changed since the last successful build.
//   Without those declarations the hook runs on EVERY flutter test/build/run.
//   native_toolchain_c's CBuilder does this automatically;
//   native_toolchain_cmake's CMakeBuilder does NOT — so we do it ourselves
//   at the bottom of this file.
//
// CMake source-dir mismatch:
//   When fllama is a git dependency, the pub cache path includes the commit
//   hash (e.g. .pub-cache/git/fllama-<hash>/src/). The hooks runner's build
//   output directory is keyed on build *config* (OS, arch, build mode), not
//   the source path — so a new fllama commit reuses the same output dir.
//   CMake stores the original source path in CMakeCache.txt and refuses to
//   reconfigure if it doesn't match. We detect this and wipe the stale cache
//   before invoking CMakeBuilder.

import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:hooks/hooks.dart';
import 'package:logging/logging.dart';
import 'package:native_toolchain_cmake/native_toolchain_cmake.dart';

void main(List<String> args) async {
  await build(args, (input, output) async {
    // Bail out early if the consumer doesn't need native code (e.g. dart
    // analyze, or a platform that doesn't support code assets).
    if (!input.config.buildCodeAssets) return;

    final logger = Logger('')
      ..level = Level.ALL
      ..onRecord.listen((record) => stderr.writeln(record.message));

    final sourceDir = input.packageRoot.resolve('src/');
    final targetOS = input.config.code.targetOS;

    // ── CMake defines ──────────────────────────────────────────────────
    // These are passed as -D flags to cmake configure. They control what
    // llama.cpp compiles and how it links.

    final defines = <String, String>{
      'CMAKE_BUILD_TYPE': 'Release',
      // Static-link all llama sub-libraries (ggml, llama, common, etc.)
      // into the single fllama shared library that we ship.
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

    // ── Apple (macOS + iOS): Metal GPU, no OpenMP ──────────────────────
    if (targetOS == OS.macOS || targetOS == OS.iOS) {
      defines['GGML_METAL'] = 'ON';
      // Embed the Metal shader library into the binary so we don't need
      // to ship a separate .metallib file.
      defines['GGML_METAL_EMBED_LIBRARY'] = 'ON';
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

    // ── Windows: Vulkan GPU acceleration ───────────────────────────────
    if (targetOS == OS.windows) {
      defines['LLAMA_VULKAN'] = 'ON';
    }

    // ── Linux: position-independent code ───────────────────────────────
    // The static .a libs get linked into a shared .so; without -fPIC the
    // linker refuses to emit relocatable code.
    if (targetOS == OS.linux) {
      defines['CMAKE_POSITION_INDEPENDENT_CODE'] = 'ON';
    }

    // ── Android: disable features incompatible with the NDK ────────────
    if (targetOS == OS.android) {
      defines['GGML_LLAMAFILE'] = 'OFF';
      defines['GGML_OPENMP'] = 'OFF';
    }

    // ── Stale CMake cache detection ────────────────────────────────────
    // See header comment for why this is needed.
    final cmakeCache =
        File.fromUri(input.outputDirectory.resolve('CMakeCache.txt'));
    if (await cmakeCache.exists()) {
      final content = await cmakeCache.readAsString();
      final sourcePath = sourceDir.toFilePath();
      if (!content.contains(sourcePath)) {
        logger.info('Source dir changed, clearing stale CMake cache');
        await cmakeCache.delete();
      }
    }

    // ── Build ──────────────────────────────────────────────────────────
    final builder = CMakeBuilder.create(
      name: 'fllama',
      sourceDir: sourceDir,
      defines: defines,
      targets: ['fllama'],
      // buildLocal: true would put build artifacts inside src/build/<os>/<arch>,
      // i.e. inside the pub cache. We use false so artifacts go into
      // .dart_tool/hooks_runner/shared/fllama/build/<config-hash>/ instead,
      // which survives pub cache cleans and is shared across projects.
      buildLocal: false,
      logger: logger,
    );

    await builder.run(input: input, output: output, logger: logger);

    // ── Declare dependencies for caching ───────────────────────────────
    // The hooks runner stat()s these files on subsequent invocations. If
    // none have been modified since the last build, the hook is skipped
    // entirely — no cmake resolution, no configure, no compile.
    //
    // This is ~769 files; stat()ing them takes ~50ms, vs ~60s for a full
    // cmake build. native_toolchain_c's CBuilder does this automatically;
    // native_toolchain_cmake's CMakeBuilder does not.
    final srcDir = Directory.fromUri(sourceDir);
    await for (final entity in srcDir.list(recursive: true)) {
      if (entity is File) {
        final path = entity.path;
        if (path.endsWith('.cpp') ||
            path.endsWith('.h') ||
            path.endsWith('.c') ||
            path.endsWith('.m') ||
            path.endsWith('.metal') ||
            path.endsWith('.cmake') ||
            path.endsWith('CMakeLists.txt')) {
          output.addDependency(entity.uri);
        }
      }
    }

    // ── Register the produced library as a code asset ──────────────────
    // findAndAddCodeAssets scans the output dir for a file matching the
    // regex pattern and registers it with the asset ID 'fllama_io.dart'.
    // Flutter then bundles it so that @Native() / DynamicLibrary.open()
    // can find it at runtime.
    final outLibs = await output.findAndAddCodeAssets(
      input,
      names: {r'(lib)?fllama\.(dll|so|dylib)': 'fllama_io.dart'},
      outDir: input.outputDirectory,
      logger: logger,
      regExp: true,
    );

    if (outLibs.isEmpty) {
      logger.severe('ERROR: No fllama library found after build!');
      logger.info('Output directory contents:');
      await for (final entity
          in Directory.fromUri(input.outputDirectory).list(recursive: true)) {
        logger.info('  ${entity.path}');
      }
      throw Exception('Native build produced no library.');
    }

    logger.info('Successfully registered ${outLibs.length} native asset(s).');
  });
}
