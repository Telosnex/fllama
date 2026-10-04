import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

import '../hook/build.dart' as hook;

void main() {
  test('cold fllama builds enable all-core CMake compilation', () {
    final source = Uri.directory('/fixture/src');
    final output = Uri.directory('/fixture/cache');
    final defines = {'CMAKE_BUILD_TYPE': 'Release', 'GGML_METAL': 'OFF'};
    final builder = hook.createFllamaBuilder(
      sourceDir: source,
      outDir: output,
      defines: defines,
      logger: Logger('offline builder test'),
    );
    expect(builder.parallelUseAllProcessors, isTrue);
    expect(builder.buildLocal, isFalse);
    expect(builder.targets, ['fllama']);
    expect(builder.sourceDir, source);
    expect(builder.outDir, output);
    expect(builder.defines, defines);
    expect(builder.defines, isNot(contains('CMAKE_TOOLCHAIN_FILE')));
  });

  test('Windows arm64 builds with ClangCL; other targets use defaults', () {
    expect(hook.windowsToolset(OS.windows, Architecture.arm64), 'ClangCL');
    expect(hook.windowsToolset(OS.windows, Architecture.x64), isNull);
    expect(hook.windowsToolset(OS.linux, Architecture.arm64), isNull);
    expect(hook.windowsToolset(OS.macOS, Architecture.arm64), isNull);

    final sourceDir = Directory.systemTemp.uri.resolve('fixture/src/');
    final builder = hook.createFllamaBuilder(
      sourceDir: sourceDir,
      outDir: Uri.directory('/fixture/cache'),
      defines: const {'CMAKE_BUILD_TYPE': 'Release'},
      toolset: 'ClangCL',
      logger: Logger('offline builder test'),
    );
    expect(builder.defines, {
      'CMAKE_BUILD_TYPE': 'Release',
      'CMAKE_TOOLCHAIN_FILE': p.join(
        Directory.fromUri(sourceDir).path,
        'cmake',
        'windows-clangcl.toolchain.cmake',
      ),
    });
  });

  test('Windows builds never link an OpenMP runtime', () {
    for (final arch in [Architecture.x64, Architecture.arm64]) {
      final defines = hook.computeDefines(OS.windows, arch, '');
      expect(defines['GGML_OPENMP'], 'OFF', reason: 'windows ${arch.name}');
    }
  });
}
