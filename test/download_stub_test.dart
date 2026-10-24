import 'dart:io';

import 'package:test/test.dart';

/// src/fllama_download_stub.cpp replaces llama.cpp's download functions, so
/// fllama links without cpp-httplib. A stub must have the signature in
/// llama.cpp's download.h: a stub with another signature replaces nothing.
void main() {
  test('the download stub matches llama.cpp download.h', () async {
    final result = await Process.run('c++', [
      '-std=c++17',
      '-fsyntax-only',
      '-Isrc/llama.cpp/common',
      'src/fllama_download_stub.cpp',
    ]);
    expect(result.exitCode, 0, reason: '${result.stderr}');
  });
}
