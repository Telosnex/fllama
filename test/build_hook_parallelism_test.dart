import 'package:logging/logging.dart';
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
  });
}
