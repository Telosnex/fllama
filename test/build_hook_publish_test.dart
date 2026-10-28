import 'dart:io';

import 'package:logging/logging.dart';
import 'package:test/test.dart';

import '../hook/build.dart' as hook;

void main() {
  late Directory dir;
  setUp(() => dir = Directory.systemTemp.createTempSync('fllama_publish'));
  tearDown(() => dir.deleteSync(recursive: true));

  // Full audit: a Mach-O library is padded to whole pages, so a small source
  // change often keeps its size. The hook then kept the published library of
  // the other build.
  test(
    'publishes a cached library of the same size and an older time',
    () async {
      final cached = File('${dir.path}/cache/libfllama.dylib')
        ..createSync(recursive: true)
        ..writeAsStringSync('new!');
      final published = File('${dir.path}/out/libfllama.dylib')
        ..createSync(recursive: true)
        ..writeAsStringSync('old!');
      cached.setLastModifiedSync(DateTime(2020));

      await hook.publishFromCache(
        cachedLib: cached,
        outputDirectory: Directory('${dir.path}/out/').uri,
        libFileName: 'libfllama.dylib',
        logger: Logger('test'),
      );

      expect(published.readAsStringSync(), 'new!');
    },
  );

  test('does not copy a library with the same bytes', () async {
    final cached = File('${dir.path}/cache/libfllama.dylib')
      ..createSync(recursive: true)
      ..writeAsStringSync('same');
    final published = File('${dir.path}/out/libfllama.dylib')
      ..createSync(recursive: true)
      ..writeAsStringSync('same');
    final time = DateTime(2021);
    published.setLastModifiedSync(time);

    await hook.publishFromCache(
      cachedLib: cached,
      outputDirectory: Directory('${dir.path}/out/').uri,
      libFileName: 'libfllama.dylib',
      logger: Logger('test'),
    );

    expect(published.lastModifiedSync(), time);
  });
}
