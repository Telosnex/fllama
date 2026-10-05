import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:logging/logging.dart';
import 'package:test/test.dart';

import '../hook/build.dart' as hook;

void main() {
  test('strips only Android release copies', () {
    for (final os in OS.values) {
      expect(hook.shouldStripAndroidLibrary(os, release: false), isFalse);
      expect(
        hook.shouldStripAndroidLibrary(os, release: true),
        os == OS.android,
      );
    }
  });

  late Directory dir;
  late File cache;
  late File library;
  late File original;
  final logger = Logger('Android strip test');

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('fllama_strip_test_');
    cache = File('${dir.path}/CMakeCache.txt');
    original = await File(
      '${dir.path}/cached/libfllama.so',
    ).create(recursive: true);
    await original.writeAsString('code plus debug symbols');
    library = await original.copy('${dir.path}/libfllama.so');
  });
  tearDown(() => dir.delete(recursive: true));

  test(
    'uses CMake NDK strip on the published copy, retaining the cache',
    () async {
      await cache.writeAsString(
        'CMAKE_STRIP:FILEPATH=/selected ndk/bin/llvm-strip\r\n',
      );
      await hook.stripAndroidReleaseLibrary(
        library: library,
        cmakeCache: cache,
        logger: logger,
        run: (executable, arguments) async {
          expect(executable, '/selected ndk/bin/llvm-strip');
          expect(arguments, ['--strip-unneeded', library.path]);
          await library.writeAsString('code');
          return ProcessResult(1, 0, '', '');
        },
      );
      expect(await library.readAsString(), 'code');
      expect(await original.readAsString(), 'code plus debug symbols');
    },
  );

  for (final value in ['', 'CMAKE_STRIP:FILEPATH=CMAKE_STRIP-NOTFOUND\n']) {
    test('fails closed when CMake has no strip tool ($value)', () async {
      await cache.writeAsString(value);
      await expectLater(
        hook.stripAndroidReleaseLibrary(
          library: library,
          cmakeCache: cache,
          logger: logger,
        ),
        throwsA(isA<StateError>()),
      );
      expect(await library.readAsString(), await original.readAsString());
    });
  }

  test('strip failure aborts publication and includes diagnostics', () async {
    await cache.writeAsString('CMAKE_STRIP:FILEPATH=/ndk/llvm-strip\n');
    await expectLater(
      hook.stripAndroidReleaseLibrary(
        library: library,
        cmakeCache: cache,
        logger: logger,
        run: (_, _) async => ProcessResult(1, 2, '', 'invalid ELF'),
      ),
      throwsA(
        isA<StateError>().having(
          (e) => e.toString(),
          'diagnostics',
          contains('invalid ELF'),
        ),
      ),
    );
  });
}
