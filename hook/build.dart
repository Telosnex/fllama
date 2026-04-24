// Build hook for fllama — compiles llama.cpp into a shared library that
// Flutter bundles with the app. Runs automatically on flutter build/run/test.
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
//     sorted(defines),
//     sorted( (relpath, size, mtime_µs) for each source file )
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
//   - Editing fllama.cpp: mtime changes → new build_key → one
//     rebuild; subsequent calls hit the new cache entry.
//   - No git hash / pub cache path in the key: updating fllama to a
//     new commit that changed zero source bytes reuses the cache.

import 'dart:convert';
import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:crypto/crypto.dart';
import 'package:hooks/hooks.dart';
import 'package:logging/logging.dart';
import 'package:native_toolchain_cmake/native_toolchain_cmake.dart';
import 'package:path/path.dart' as p;

/// Source extensions we consider part of the "build input fingerprint".
const _sourceExtensions = <String>{
  '.c',
  '.cc',
  '.cpp',
  '.cxx',
  '.h',
  '.hh',
  '.hpp',
  '.hxx',
  '.m',
  '.mm',
  '.metal',
  '.cmake',
};

/// Additional file *basenames* (case-sensitive) to include.
const _sourceBasenames = <String>{
  'CMakeLists.txt',
};

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
    final defines = _computeDefines(targetOS);

    // ── Enumerate source files (used for both key + dep declarations) ──
    final swStart = Stopwatch()..start();
    final sourceFiles = await _collectSourceFiles(sourceDir);
    logger.info(
      'Enumerated ${sourceFiles.length} source files '
      'in ${swStart.elapsedMilliseconds}ms',
    );

    // ── Compute build key ──────────────────────────────────────────────
    final buildKey = _computeBuildKey(
      os: targetOS.name,
      arch: input.config.code.targetArchitecture.name,
      defines: defines,
      sourceFiles: sourceFiles,
    );

    // ── Resolve cache location ─────────────────────────────────────────
    final cacheDir = _cacheDirectory(buildKey);
    final libFileName = _libraryFileName(targetOS);
    final cachedLib = File(p.join(cacheDir.path, libFileName));

    logger.info('fllama build key: $buildKey');
    logger.info('fllama cache: ${cacheDir.path}');

    // ── Declare dependencies (always, regardless of cache hit/miss) ────
    // Even if we never invoke cmake, declaring these helps consumers that
    // have other cache layers (build_runner, Flutter's depfile, etc.).
    _declareDependencies(output, sourceFiles);

    // ── Fast path: cache hit ───────────────────────────────────────────
    if (await cachedLib.exists()) {
      await _publishFromCache(
        cachedLib: cachedLib,
        outputDirectory: input.outputDirectory,
        libFileName: libFileName,
        logger: logger,
      );
      await _registerAsset(
        input: input,
        output: output,
        libFileName: libFileName,
        logger: logger,
      );
      return;
    }

    // ── Slow path: build under flock ───────────────────────────────────
    await cacheDir.create(recursive: true);
    await _withExclusiveLock(
      File(p.join(cacheDir.path, '.build.lock')),
      () async {
        // Another process may have just finished the build while we were
        // waiting for the lock. Re-check before spending 60s recompiling.
        if (await cachedLib.exists()) {
          logger.info(
            'Build completed by another process while we waited for the lock',
          );
          return;
        }

        // Handle stale CMakeCache.txt. The content-addressed cache dir
        // should make this rare (different source trees → different build
        // key → different dir), but `LLAMA_BUILD_COMMIT` and friends
        // aren't in the key yet, and future edits to _computeDefines may
        // introduce new keys that aren't fingerprinted.
        await _clearStaleCMakeCache(
          cacheDir: cacheDir,
          sourceDir: sourceDir,
          logger: logger,
        );

        final builder = CMakeBuilder.create(
          name: 'fllama',
          sourceDir: sourceDir,
          // Redirect CMakeBuilder's output into OUR cache dir instead of
          // into hooks_runner's per-config `input.outputDirectory`. This
          // is the critical move — the expensive artifacts live in one
          // stable, shared location.
          outDir: cacheDir.uri,
          defines: defines,
          targets: ['fllama'],
          buildLocal: false,
          logger: logger,
        );
        await builder.run(input: input, output: output, logger: logger);

        if (!await cachedLib.exists()) {
          throw StateError(
            'CMake build reported success but ${cachedLib.path} '
            'is missing. Contents of cache dir:\n'
            '${await _listForDiagnostics(cacheDir)}',
          );
        }
      },
      logger: logger,
    );

    await _publishFromCache(
      cachedLib: cachedLib,
      outputDirectory: input.outputDirectory,
      libFileName: libFileName,
      logger: logger,
    );
    await _registerAsset(
      input: input,
      output: output,
      libFileName: libFileName,
      logger: logger,
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────
//   defines
// ─────────────────────────────────────────────────────────────────────────

Map<String, String> _computeDefines(OS targetOS) {
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

  // Apple (macOS + iOS): Metal GPU, no OpenMP.
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

  // Windows: Vulkan GPU acceleration.
  if (targetOS == OS.windows) {
    defines['LLAMA_VULKAN'] = 'ON';
  }

  // Linux: position-independent code — the static .a libs get linked into
  // a shared .so; without -fPIC the linker refuses to emit relocatable code.
  if (targetOS == OS.linux) {
    defines['CMAKE_POSITION_INDEPENDENT_CODE'] = 'ON';
  }

  // Android: disable features incompatible with the NDK.
  if (targetOS == OS.android) {
    defines['GGML_LLAMAFILE'] = 'OFF';
    defines['GGML_OPENMP'] = 'OFF';
  }

  return defines;
}

// ─────────────────────────────────────────────────────────────────────────
//   source-file enumeration
// ─────────────────────────────────────────────────────────────────────────

class _SourceFile {
  _SourceFile(this.relPath, this.absoluteUri, this.size, this.mtimeMicros);

  final String relPath;
  final Uri absoluteUri;
  final int size;
  final int mtimeMicros;
}

Future<List<_SourceFile>> _collectSourceFiles(Uri sourceDir) async {
  final srcDir = Directory.fromUri(sourceDir);
  final basePath = srcDir.path;
  final files = <_SourceFile>[];

  await for (final entity in srcDir.list(recursive: true, followLinks: false)) {
    if (entity is! File) continue;
    final path = entity.path;
    final ext = p.extension(path).toLowerCase();
    final basename = p.basename(path);
    if (!_sourceExtensions.contains(ext) &&
        !_sourceBasenames.contains(basename)) {
      continue;
    }
    // Skip anything inside a build/ directory — output, not input. (Only
    // relevant if someone did a local cmake build by hand.)
    if (p.split(p.relative(path, from: basePath)).contains('build')) {
      continue;
    }
    final stat = await entity.stat();
    files.add(
      _SourceFile(
        p.relative(path, from: basePath),
        entity.uri,
        stat.size,
        stat.modified.microsecondsSinceEpoch,
      ),
    );
  }
  files.sort((a, b) => a.relPath.compareTo(b.relPath));
  return files;
}

// ─────────────────────────────────────────────────────────────────────────
//   build key
// ─────────────────────────────────────────────────────────────────────────

String _computeBuildKey({
  required String os,
  required String arch,
  required Map<String, String> defines,
  required List<_SourceFile> sourceFiles,
}) {
  final buffer = StringBuffer();
  buffer.writeln('v1'); // schema tag — bump to invalidate all prior caches
  buffer.writeln('os=$os');
  buffer.writeln('arch=$arch');

  final sortedDefines = defines.entries.toList()
    ..sort((a, b) => a.key.compareTo(b.key));
  for (final e in sortedDefines) {
    buffer.writeln('D:${e.key}=${e.value}');
  }
  for (final f in sourceFiles) {
    buffer.writeln('F:${f.relPath}|${f.size}|${f.mtimeMicros}');
  }

  final digest = sha256.convert(utf8.encode(buffer.toString()));
  // 16 hex chars = 64 bits. For ~10^5 distinct cache entries the
  // birthday-collision probability is ~2.7e-10 — effectively zero.
  return digest.toString().substring(0, 16);
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

  final home = Platform.environment['HOME'] ??
      Platform.environment['USERPROFILE'] ??
      (throw StateError(
        'Cannot locate user home: neither HOME, USERPROFILE, nor '
        'XDG_CACHE_HOME is set.',
      ));
  return Directory(p.join(home, '.cache', 'fllama', buildKey));
}

String _libraryFileName(OS targetOS) {
  if (targetOS == OS.windows) return 'fllama.dll';
  if (targetOS == OS.macOS || targetOS == OS.iOS) return 'libfllama.dylib';
  return 'libfllama.so'; // linux, android
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
      logger.info(
        'Waited ${sw.elapsedMilliseconds}ms for fllama build lock',
      );
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

Future<void> _registerAsset({
  required BuildInput input,
  required BuildOutputBuilder output,
  required String libFileName,
  required Logger logger,
}) async {
  // Register the library that now lives in input.outputDirectory. Using
  // the package's own helper guarantees we match the library-naming
  // conventions that native_toolchain_cmake's own consumers rely on.
  final added = await output.findAndAddCodeAssets(
    input,
    names: {r'(lib)?fllama\.(dll|so|dylib)': 'fllama_io.dart'},
    outDir: input.outputDirectory,
    logger: logger,
    regExp: true,
  );
  if (added.isEmpty) {
    throw StateError(
      'Failed to register fllama as a code asset: no library matching '
      r'"(lib)?fllama.(dll|so|dylib)" found under '
      '${input.outputDirectory}. Expected $libFileName after publish.',
    );
  }
  logger.info('Registered ${added.length} code asset(s).');
}

// ─────────────────────────────────────────────────────────────────────────
//   dependencies
// ─────────────────────────────────────────────────────────────────────────

void _declareDependencies(
  BuildOutputBuilder output,
  List<_SourceFile> sourceFiles,
) {
  output.dependencies.addAll(sourceFiles.map((f) => f.absoluteUri));
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
