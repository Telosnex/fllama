/// Replaces `kiln:release` in the kiln release workflow, with the same
/// arguments. It runs with `dart tool/kiln/release.dart`.
///
/// First it checks the GPU packs (ADR 004 D7, I4, D16): Windows x64 and
/// Linux x64 have a Vulkan GPU pack and no CUDA pack files, and a CUDA pack
/// descriptor. The CUDA pack files are in the cuda-* release that
/// cuda_pack.yml published; fllama contains their SHA-256 values and URLs.
/// Then it runs `dart run kiln:release`.
library;

import 'dart:convert';
import 'dart:io';

Future<void> main(List<String> args) async {
  final artifacts = Platform.environment['ARTIFACTS']!;
  final summary = Platform.environment['GITHUB_STEP_SUMMARY'];
  for (final target in ['windows-x64', 'linux-x64']) {
    final json = File('$artifacts/out/$target/target.json').readAsStringSync();
    if (!json.contains('"pack": "vulkan"')) {
      _fail('$target has no Vulkan GPU pack.');
    }
    if (json.contains('"pack": "cuda"')) {
      _fail(
        '$target built CUDA pack files. The CUDA pack comes from '
        'cuda_pack.yml.',
      );
    }
    final cuda = File('$artifacts/cuda-packs/$target.json');
    if (!cuda.existsSync()) _fail('$target has no CUDA pack descriptor.');
    final tag = (jsonDecode(cuda.readAsStringSync()) as Map)['tag'];
    final line = '$target CUDA pack: $tag';
    stdout.writeln(line);
    if (summary != null) {
      File(summary).writeAsStringSync('$line\n', mode: FileMode.append);
    }
  }

  final process = await Process.start(Platform.resolvedExecutable, [
    'run',
    'kiln:release',
    ...args,
  ], mode: ProcessStartMode.inheritStdio);
  exit(await process.exitCode);
}

Never _fail(String message) {
  stdout.writeln('::error::$message');
  exit(1);
}
