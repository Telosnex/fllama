// Builds, publishes and resolves the CUDA GPU pack
// (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D16). See hook/cuda_pack.dart for
// the key. Commands:
//
//   dart scripts/cuda_pack.dart key     --target <t> [--list]
//   dart scripts/cuda_pack.dart status  --target <t> [--repo <owner/name>]
//   dart scripts/cuda_pack.dart build   --target <t> --out <dir>
//                                       [--build-dir <dir>] [--toolchain <s>]
//   dart scripts/cuda_pack.dart publish --target <t> --out <dir>
//   dart scripts/cuda_pack.dart resolve --target <t> --descriptor <file>
//
// <t> is windows-x64 or linux-x64. The repository defaults to
// GITHUB_REPOSITORY, else Telosnex/fllama. `status` writes `published` and
// `tag` to GITHUB_OUTPUT when it is set. `build` needs the CUDA Toolkit from
// scripts/install_cuda_toolkit.dart and writes the gzipped assets and
// cuda-pack.json to <out>/assets. `publish` uploads them as release
// cuda-<t>-<key16>. `resolve` checks the published release of these sources
// and writes its descriptor for the fllama release build; it fails if the
// pack is not published.
import 'dart:convert';
import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:crypto/crypto.dart';
import 'package:native_prebuilt/native_prebuilt.dart';
// ignore: implementation_imports
import 'package:native_prebuilt/src/publisher.dart';
import 'package:path/path.dart' as p;

import '../hook/cuda_pack.dart';

Future<void> main(List<String> arguments) async {
  if (arguments.isEmpty) _usage();
  final command = arguments.first;
  final options = _parse(arguments.skip(1).toList());
  final target = options['target'] ?? _usage();
  final repository =
      options['repo'] ??
      Platform.environment['GITHUB_REPOSITORY'] ??
      'Telosnex/fllama';
  final packageRoot = Directory.current.uri;
  try {
    final key = await _key(packageRoot, target);
    switch (command) {
      case 'key':
        stdout.write(options.containsKey('list') ? key.listing : '');
        stdout.writeln('${key.key} ${key.tag}');
      case 'status':
        final published = await GhPublisher().publishedAssetDigests(
          repository: repository,
          tag: key.tag,
        );
        final complete =
            published != null && published.containsKey(cudaPackDescriptorName);
        stdout.writeln(
          complete
              ? 'CUDA pack ${key.tag} is published.'
              : 'CUDA pack ${key.tag} is not published.',
        );
        final output = Platform.environment['GITHUB_OUTPUT'];
        if (output != null && output.isNotEmpty) {
          await File(output).writeAsString(
            'published=$complete\ntag=${key.tag}\nkey=${key.key}\n',
            mode: FileMode.append,
          );
        }
      case 'build':
        await _build(
          packageRoot: packageRoot,
          key: key,
          repository: repository,
          out: Directory(options['out'] ?? _usage()),
          buildDir: options['build-dir'],
          toolchain: options['toolchain'] ?? '',
        );
      case 'publish':
        await _publish(
          key: key,
          repository: repository,
          out: Directory(options['out'] ?? _usage()),
        );
      case 'resolve':
        await _resolve(
          key: key,
          repository: repository,
          descriptor: File(options['descriptor'] ?? _usage()),
        );
      default:
        _usage();
    }
  } on StateError catch (error) {
    stderr.writeln('error: ${error.message}');
    exit(1);
  }
}

Never _usage() {
  stderr.writeln(
    'Usage: dart scripts/cuda_pack.dart <key|status|build|publish|resolve> '
    '--target <windows-x64|linux-x64> [options]. See the file header.',
  );
  exit(64);
}

Map<String, String> _parse(List<String> args) {
  final options = <String, String>{};
  for (var i = 0; i < args.length; i++) {
    final arg = args[i];
    if (!arg.startsWith('--')) _usage();
    final name = arg.substring(2);
    if (name == 'list') {
      options[name] = '';
    } else {
      if (i + 1 >= args.length) _usage();
      options[name] = args[++i];
    }
  }
  return options;
}

Future<CudaPackKey> _key(Uri packageRoot, String target) async {
  cudaPackOS(target); // Validates the target.
  final source = await computeSourceKey(packageRoot);
  return computeCudaPackKey(
    packageRoot: packageRoot,
    target: target,
    files: source.files,
  );
}

Future<void> _run(String executable, List<String> args) async {
  stdout.writeln('+ $executable ${args.join(' ')}');
  final process = await Process.start(
    executable,
    args,
    mode: ProcessStartMode.inheritStdio,
  );
  final code = await process.exitCode;
  if (code != 0) throw StateError('$executable failed with exit code $code.');
}

Future<String> _sha256(File file) async =>
    (await sha256.bind(file.openRead()).first).toString();

Future<void> _build({
  required Uri packageRoot,
  required CudaPackKey key,
  required String repository,
  required Directory out,
  required String? buildDir,
  required String toolchain,
}) async {
  final os = cudaPackOS(key.target);
  final toolkit = cudaToolkitRoot(os);
  final nvcc = p.join(toolkit, 'bin', os == OS.windows ? 'nvcc.exe' : 'nvcc');
  if (!File(nvcc).existsSync()) {
    throw StateError(
      'No CUDA Toolkit $cudaToolkitVersion at $toolkit. Run '
      'scripts/install_cuda_toolkit.dart first.',
    );
  }
  final source = p.join(
    Directory.fromUri(packageRoot).path,
    'src',
    'cuda_pack',
  );
  final build = Directory(
    buildDir ?? p.join(Directory.systemTemp.path, 'fllama_cuda_${key.short}'),
  ).absolute;
  await build.create(recursive: true);

  await _run('cmake', [
    '-S', source, '-B', build.path, //
    ...cudaPackGeneratorArgs(os),
    if (os == OS.windows) ...['-T', 'cuda=$toolkit'],
    '-DCUDAToolkit_ROOT=$toolkit',
    if (os != OS.windows) '-DCMAKE_CUDA_COMPILER=$nvcc',
    // Per-file timings; Visual Studio ignores the launcher.
    if (os != OS.windows) '-DFLLAMA_CUDA_TIMING=ON',
    for (final entry in cudaPackDefines(os).entries)
      '-D${entry.key}=${entry.value}',
  ]);
  await _run('cmake', [
    '--build', build.path, '--config', 'Release', '--target', 'ggml-cuda', //
    '--parallel', '${Platform.numberOfProcessors}',
  ]);

  final list = File(p.join(build.path, 'cuda_pack_files-Release.txt'));
  final paths = (await list.readAsLines())
      .where((line) => line.trim().isNotEmpty)
      .toList();
  if (os == OS.linux) await _checkLinuxNeeded(paths.last);

  final assets = Directory(p.join(out.path, 'assets'));
  await assets.create(recursive: true);
  final files = <CudaPackFile>[];
  for (final path in paths) {
    final file = File(path);
    final name = p.basename(path);
    final asset = cudaPackAssetName(key.target, name);
    final gz = File(p.join(assets.path, asset));
    await file
        .openRead()
        .transform(GZipCodec(level: 9).encoder)
        .pipe(gz.openWrite());
    files.add(
      CudaPackFile(
        name: name,
        sha256: await _sha256(file),
        bytes: await file.length(),
        url: githubAssetUrl(repository, key.tag, asset),
        downloadSha256: await _sha256(gz),
      ),
    );
    stdout.writeln(
      '$name: ${await file.length()} bytes, ${await gz.length()} gzipped',
    );
  }
  final descriptor = CudaPackDescriptor(
    target: key.target,
    key: key.key,
    files: files,
    toolchain: toolchain,
    commit: Platform.environment['GITHUB_SHA'] ?? '',
  );
  descriptor.check(key, repository: repository);
  await File(p.join(assets.path, cudaPackDescriptorName)).writeAsString(
    '${const JsonEncoder.withIndent('  ').convert(descriptor.toJson())}\n',
  );
  await File(p.join(out.path, 'key.txt')).writeAsString(key.listing);
  stdout.writeln('CUDA pack ${key.tag}: ${assets.path}');
}

/// ggml-cuda must need the libggml-base.so that the fllama release ships
/// (CMAKE_PLATFORM_NO_VERSIONED_SONAME), and the CUDA runtime by soname.
Future<void> _checkLinuxNeeded(String library) async {
  final result = await Process.run('objdump', ['-p', library]);
  if (result.exitCode != 0) {
    throw StateError('objdump failed: ${result.stderr}');
  }
  final needed = RegExp(
    r'NEEDED\s+(\S+)',
  ).allMatches(result.stdout as String).map((m) => m.group(1)!).toSet();
  stdout.writeln('${p.basename(library)} needs ${needed.join(', ')}');
  if (!needed.contains('libggml-base.so')) {
    throw StateError('${p.basename(library)} does not need libggml-base.so.');
  }
}

Future<void> _publish({
  required CudaPackKey key,
  required String repository,
  required Directory out,
}) async {
  final assets = Directory(p.join(out.path, 'assets'));
  final descriptor = await CudaPackDescriptor.load(
    File(p.join(assets.path, cudaPackDescriptorName)),
  );
  // The sources must not change between build and publish.
  descriptor.check(key, repository: repository);
  final files = [
    for (final file in descriptor.files)
      File(p.join(assets.path, cudaPackAssetName(key.target, file.name))),
    File(p.join(assets.path, cudaPackDescriptorName)),
  ];
  for (final file in descriptor.files) {
    final gz = File(
      p.join(assets.path, cudaPackAssetName(key.target, file.name)),
    );
    if (await _sha256(gz) != file.downloadSha256) {
      throw StateError('${gz.path} changed after the build.');
    }
  }
  await GhPublisher(log: stdout.writeln).publish(
    repository: repository,
    tag: key.tag,
    assets: files,
    // A CUDA pack is a side release; the latest release stays fllama's own.
    latest: false,
    notes:
        'fllama CUDA GPU pack for ${key.target} (ADR 004 D16). CUDA '
        '$cudaToolkitVersion, architectures $cudaArchitectures. CUDA pack '
        'key ${key.key}. ${descriptor.toolchain}',
  );
}

Future<void> _resolve({
  required CudaPackKey key,
  required String repository,
  required File descriptor,
}) async {
  final digests = await GhPublisher().publishedAssetDigests(
    repository: repository,
    tag: key.tag,
  );
  if (digests == null || !digests.containsKey(cudaPackDescriptorName)) {
    throw StateError(
      'The CUDA pack for ${key.target} is not published: release ${key.tag} '
      'of $repository does not exist. Its ggml sources changed. Run the '
      '"CUDA pack" workflow (.github/workflows/cuda_pack.yml) for this '
      'commit and wait for it to finish (about 1.5 to 2 hours), then run '
      'this release again.',
    );
  }
  final temporary = await Directory.systemTemp.createTemp('fllama_cuda_');
  try {
    await _run('gh', [
      'release', 'download', key.tag, '--repo', repository, //
      '--pattern', cudaPackDescriptorName, '--dir', temporary.path,
    ]);
    final downloaded = File(p.join(temporary.path, cudaPackDescriptorName));
    if (await _sha256(downloaded) != digests[cudaPackDescriptorName]) {
      throw StateError('$cudaPackDescriptorName does not match its digest.');
    }
    final pack = await CudaPackDescriptor.load(downloaded);
    pack.check(key, repository: repository);
    for (final file in pack.files) {
      final asset = cudaPackAssetName(key.target, file.name);
      if (digests[asset] == null || digests[asset] != file.downloadSha256) {
        throw StateError(
          'Release ${key.tag} asset $asset has SHA-256 ${digests[asset]}, '
          'the descriptor has ${file.downloadSha256}.',
        );
      }
    }
    await descriptor.parent.create(recursive: true);
    await downloaded.copy(descriptor.path);
    stdout.writeln(
      'CUDA pack ${key.tag}: ${pack.files.map((f) => f.name).join(', ')}',
    );
  } finally {
    await temporary.delete(recursive: true);
  }
}
