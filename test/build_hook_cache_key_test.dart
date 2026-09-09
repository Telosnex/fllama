import 'dart:io';

import 'package:test/test.dart';

import '../hook/cache_key.dart';

void main() {
  late Directory firstSourceDirectory;
  late Directory secondSourceDirectory;

  setUp(() async {
    firstSourceDirectory = await Directory.systemTemp.createTemp(
      'fllama_cache_key_first_',
    );
    secondSourceDirectory = await Directory.systemTemp.createTemp(
      'fllama_cache_key_second_',
    );
  });

  tearDown(() async {
    await firstSourceDirectory.delete(recursive: true);
    await secondSourceDirectory.delete(recursive: true);
  });

  Future<String> keyFor(Directory directory) async {
    return computeBuildKey(
      os: 'macos',
      arch: 'arm64',
      defines: const {'CMAKE_BUILD_TYPE': 'Release'},
      sourceFiles: await collectSourceFiles(directory.uri),
    );
  }

  test('is stable when checkout path and source mtimes differ', () async {
    final first = File('${firstSourceDirectory.path}/fllama.cpp');
    final second = File('${secondSourceDirectory.path}/fllama.cpp');
    await first.writeAsString('int fllama() { return 1; }\n');
    await second.writeAsString('int fllama() { return 1; }\n');
    await first.setLastModified(DateTime.utc(2024));
    await second.setLastModified(DateTime.utc(2026));

    expect(
      await keyFor(firstSourceDirectory),
      await keyFor(secondSourceDirectory),
    );
  });

  test('changes when source contents change without changing size', () async {
    final source = File('${firstSourceDirectory.path}/fllama.cpp');
    await source.writeAsString('int fllama() { return 1; }\n');
    final originalKey = await keyFor(firstSourceDirectory);

    await source.writeAsString('int fllama() { return 2; }\n');

    expect(await keyFor(firstSourceDirectory), isNot(originalKey));
  });

  test('separates iOS device and simulator cache entries', () async {
    final source = File('${firstSourceDirectory.path}/fllama.cpp');
    await source.writeAsString('int fllama() { return 1; }\n');
    final sourceFiles = await collectSourceFiles(firstSourceDirectory.uri);

    String keyForSdk(String sdk) => computeBuildKey(
      os: 'ios',
      arch: 'arm64',
      targetVariant: sdk,
      defines: const {'CMAKE_BUILD_TYPE': 'Release'},
      sourceFiles: sourceFiles,
    );

    expect(keyForSdk('iphoneos'), isNot(keyForSdk('iphonesimulator')));
  });

  test('ignores generated build directories and unrelated files', () async {
    await File(
      '${firstSourceDirectory.path}/fllama.cpp',
    ).writeAsString('int fllama() { return 1; }\n');
    final originalKey = await keyFor(firstSourceDirectory);
    await Directory('${firstSourceDirectory.path}/build').create();
    await File(
      '${firstSourceDirectory.path}/build/generated.cpp',
    ).writeAsString('generated output\n');
    await File(
      '${firstSourceDirectory.path}/README.md',
    ).writeAsString('documentation\n');

    expect(await keyFor(firstSourceDirectory), originalKey);
  });
}
