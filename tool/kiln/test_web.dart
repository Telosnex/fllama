/// The browser test of the web runtime files (kiln ADR 002 D10, D13). The
/// kiln release workflow runs it with `dart tool/kiln/test_web.dart`, after
/// `kiln:web install-dev` of the files that tool/kiln/build_web.dart built.
///
/// 1. scripts/check_web_assets.sh checks the files in lib/web/.
/// 2. It downloads the test model to test/web_models/, if it is not there.
/// 3. test/web_runtime_test.dart loads the model in Chrome. The build hook
///    builds the host library from source for the test runner: the release
///    for this source key does not exist yet.
library;

import 'dart:io';

const _model = 'test/web_models/stories15M-q4_0.gguf';
const _modelUrl =
    'https://huggingface.co/ggml-org/models/resolve/main/tinyllamas/stories15M-q4_0.gguf';
const _modelSha256 =
    '66967fbece6dbe97886593fdbb73589584927e29119ec31f08090732d1861739';

Future<void> main() async {
  Directory.current = Directory.fromUri(Platform.script.resolve('../..'));
  await _run('bash', ['scripts/check_web_assets.sh']);

  if (!File(_model).existsSync() || await _sha256(_model) != _modelSha256) {
    await Directory('test/web_models').create(recursive: true);
    await _run('curl', ['-sSfL', '--retry', '3', '-o', _model, _modelUrl]);
  }
  final sha = await _sha256(_model);
  if (sha != _modelSha256) {
    stderr.writeln('test_web: $_model has SHA-256 $sha, not $_modelSha256.');
    exit(1);
  }

  await _run('flutter', [
    'test',
    '--platform',
    'chrome',
    'test/web_runtime_test.dart',
  ]);
}

Future<String> _sha256(String path) async {
  final result = await Process.run('shasum', ['-a', '256', path]);
  if (result.exitCode != 0) {
    stderr.writeln('test_web: shasum failed: ${result.stderr}');
    exit(1);
  }
  return '${result.stdout}'.split(' ').first;
}

Future<void> _run(String executable, List<String> args) async {
  stdout.writeln('+ $executable ${args.join(' ')}');
  final process = await Process.start(
    executable,
    args,
    mode: ProcessStartMode.inheritStdio,
  );
  final code = await process.exitCode;
  if (code != 0) exit(code);
}
