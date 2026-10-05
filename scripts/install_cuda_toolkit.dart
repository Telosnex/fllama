// Installs the pinned CUDA Toolkit parts that the CUDA GPU pack needs
// (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D8). The release workflow runs it
// on Windows x64 and Linux x64:
//
//   dart scripts/install_cuda_toolkit.dart <install directory>
//
// It downloads NVIDIA's redistributable archives, checks the SHA-256 values
// from NVIDIA's manifest redistrib_12.8.1.json, and merges them into one
// toolkit directory. hook/build.dart looks for the toolkit at
// `cudaToolkitRoot`. Windows also needs Visual Studio; the hook selects the
// toolkit with `cmake -T cuda=<dir>`, so the Visual Studio installation is
// not changed.
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:path/path.dart' as p;

const _base = 'https://developer.download.nvidia.com/compute/cuda/redist/';

/// Relative path and SHA-256 of each archive, from redistrib_12.8.1.json.
const _archives = {
  'windows-x86_64': {
    'cuda_cudart/windows-x86_64/cuda_cudart-windows-x86_64-12.8.90-archive.zip':
        '4a39058fd8519444a81cfc7ae055d136f48d1a31ffa41ae255b35b2edd61e13b',
    'cuda_nvcc/windows-x86_64/cuda_nvcc-windows-x86_64-12.8.93-archive.zip':
        '9fdc70b4271ed9aad4d64cd7076a7d96ec36512d074b9995fe638de669197391',
    'libcublas/windows-x86_64/libcublas-windows-x86_64-12.8.4.1-archive.zip':
        '57a470112cec7e112c95253dde8b3c7184d795dbd92b0bde77a4cb7f8c94c8aa',
    'cuda_cccl/windows-x86_64/cuda_cccl-windows-x86_64-12.8.90-archive.zip':
        'bd8548fa1ae82f92910bebc3079e14bd58c5a92aa64596d46bd610a478cb39d7',
    'visual_studio_integration/windows-x86_64/visual_studio_integration-windows-x86_64-12.8.90-archive.zip':
        'f41d12a0e49b7848ed35e8a15b58926b83f635c723cab7e9952bc633e3c1f200',
  },
  'linux-x86_64': {
    'cuda_cudart/linux-x86_64/cuda_cudart-linux-x86_64-12.8.90-archive.tar.xz':
        '8d566b5fe745c46842dc16945cf36686227536decd2302c372be86da37faca68',
    'cuda_nvcc/linux-x86_64/cuda_nvcc-linux-x86_64-12.8.93-archive.tar.xz':
        '9961b3484b6b71314063709a4f9529654f96782ad39e72bf1e00f070db8210d3',
    'libcublas/linux-x86_64/libcublas-linux-x86_64-12.8.4.1-archive.tar.xz':
        '21718957c2cf000bacd69d36c95708a2319199e39e056f8b4f0f68e3b9f323bb',
    'cuda_cccl/linux-x86_64/cuda_cccl-linux-x86_64-12.8.90-archive.tar.xz':
        '0740e9e01e4f15e17c5ab8d68bba4f8ec0eb6b84edccba4ac45112d2d2174e4b',
  },
};

Future<void> main(List<String> args) async {
  if (args.length != 1) {
    stderr.writeln('Usage: dart scripts/install_cuda_toolkit.dart <dir>');
    exit(64);
  }
  final platform = Platform.isWindows ? 'windows-x86_64' : 'linux-x86_64';
  if (!Platform.isWindows && !Platform.isLinux) {
    stderr.writeln('The CUDA pack builds only on Windows and Linux.');
    exit(1);
  }
  final root = Directory(args.single).absolute;
  // Next to the install directory, so _merge can rename instead of copy.
  await root.parent.create(recursive: true);
  final work = await root.parent.createTemp('.fllama_cuda_');
  try {
    for (final MapEntry(key: path, value: expected)
        in _archives[platform]!.entries) {
      final archive = File(p.join(work.path, p.basename(path)));
      await _download(Uri.parse('$_base$path'), archive);
      final actual = (await sha256.bind(archive.openRead()).single).toString();
      if (actual != expected) {
        throw StateError('$path has SHA-256 $actual, expected $expected.');
      }
      final out = Directory(p.join(work.path, 'x'));
      if (await out.exists()) await out.delete(recursive: true);
      await out.create();
      // Windows 10 and later have bsdtar, which reads zip archives.
      await _run('tar', [
        if (!Platform.isWindows) '--no-same-owner',
        '-xf',
        archive.path,
        '-C',
        out.path,
      ]);
      await archive.delete();
      // Each archive has one top directory, <name>-<platform>-<version>-archive.
      final top = await out.list().single as Directory;
      await _merge(top, root);
      stdout.writeln('Installed ${p.basename(path)}');
    }
  } finally {
    await work.delete(recursive: true);
  }
  if (Platform.isWindows) {
    // `cmake -T cuda=<dir>` reads the MSBuild extensions from here.
    final from = Directory(
      p.join(root.path, 'visual_studio_integration', 'MSBuildExtensions'),
    );
    final to = Directory(
      p.join(root.path, 'extras', 'visual_studio_integration'),
    );
    await to.create(recursive: true);
    await _merge(from.parent, to);
  }
  final nvcc = p.join(
    root.path,
    'bin',
    Platform.isWindows ? 'nvcc.exe' : 'nvcc',
  );
  await _run(nvcc, ['--version']);
}

Future<void> _download(Uri url, File file) async {
  final client = HttpClient();
  try {
    for (var attempt = 1; ; attempt++) {
      try {
        final response = await (await client.getUrl(url)).close();
        if (response.statusCode != HttpStatus.ok) {
          throw HttpException('HTTP ${response.statusCode}', uri: url);
        }
        await response.pipe(file.openWrite());
        return;
      } on Exception {
        if (attempt == 3) rethrow;
        await Future<void>.delayed(Duration(seconds: 5 * attempt));
      }
    }
  } finally {
    client.close();
  }
}

/// Moves the contents of [from] into [to], merging directories. Files and
/// links are renamed, not copied, so links (`libcudart.so.12`) stay links.
/// [from] and [to] must be on the same file system.
Future<void> _merge(Directory from, Directory to) async {
  await to.create(recursive: true);
  await for (final entity in from.list(followLinks: false)) {
    final target = p.join(to.path, p.basename(entity.path));
    if (entity is Directory) {
      await _merge(entity, Directory(target));
    } else {
      final existing = FileSystemEntity.typeSync(target, followLinks: false);
      if (existing == FileSystemEntityType.directory) {
        throw StateError('$target is a directory in another archive.');
      }
      if (existing != FileSystemEntityType.notFound) {
        await File(target).delete();
      }
      await entity.rename(target);
    }
  }
}

Future<void> _run(String executable, List<String> args) async {
  final result = await Process.run(executable, args);
  stdout.write(result.stdout);
  if (result.exitCode != 0) {
    throw StateError(
      '$executable ${args.join(' ')} failed (${result.exitCode}): '
      '${result.stderr}',
    );
  }
}
