import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:hooks/hooks.dart';
import 'package:logging/logging.dart';
import 'package:native_toolchain_cmake/native_toolchain_cmake.dart';

void main(List<String> args) async {
  await build(args, (input, output) async {
    if (!input.config.buildCodeAssets) return;

    final logger = Logger('')
      ..level = Level.ALL
      ..onRecord.listen((record) => stderr.writeln(record.message));

    final sourceDir = input.packageRoot.resolve('src/');
    final targetOS = input.config.code.targetOS;

    // Base defines — shared across all platforms.
    final defines = <String, String>{
      'CMAKE_BUILD_TYPE': 'Release',
      'BUILD_SHARED_LIBS': 'OFF', // Static-link llama libs into fllama shared lib
      'LLAMA_NATIVE': 'OFF',
      'LLAMA_HTTPLIB': 'OFF',
      'LLAMA_CURL': 'OFF',
      'LLAMA_BUILD_SERVER': 'OFF',
      'LLAMA_BUILD_TESTS': 'OFF',
      'LLAMA_BUILD_EXAMPLES': 'OFF',
      'LLAMA_BUILD_NUMBER': '1',
      'LLAMA_BUILD_COMMIT': 'unknown',
    };

    // --- Apple (macOS + iOS): Metal GPU acceleration, no OpenMP ---
    if (targetOS == OS.macOS || targetOS == OS.iOS) {
      defines['GGML_METAL'] = 'ON';
      defines['GGML_METAL_EMBED_LIBRARY'] = 'ON';
      // Homebrew libomp is arm64-only; universal builds fail linking x86_64.
      // llama.cpp falls back to pthreads, which is fine.
      defines['GGML_OPENMP'] = 'OFF';
    }
    if (targetOS == OS.macOS) {
      defines['CMAKE_OSX_DEPLOYMENT_TARGET'] = '10.15';
    }
    if (targetOS == OS.iOS) {
      defines['CMAKE_OSX_DEPLOYMENT_TARGET'] = '13.0';
    }

    // --- Windows: Vulkan GPU acceleration ---
    if (targetOS == OS.windows) {
      defines['LLAMA_VULKAN'] = 'ON';
    }

    // --- Android: disable features that don't build with NDK ---
    if (targetOS == OS.android) {
      defines['GGML_LLAMAFILE'] = 'OFF';
      defines['GGML_OPENMP'] = 'OFF';
    }

    final builder = CMakeBuilder.create(
      name: 'fllama',
      sourceDir: sourceDir,
      defines: defines,
      targets: ['fllama'],
      buildLocal: false,
      logger: logger,
    );

    await builder.run(input: input, output: output, logger: logger);

    // Find the produced shared library and register it as a code asset.
    final outLibs = await output.findAndAddCodeAssets(
      input,
      names: {r'(lib)?fllama\.(dll|so|dylib)': 'fllama_io.dart'},
      outDir: input.outputDirectory,
      logger: logger,
      regExp: true,
    );

    if (outLibs.isEmpty) {
      logger.severe('ERROR: No fllama library found after build!');
      logger.info('Output directory contents:');
      await for (final entity
          in Directory.fromUri(input.outputDirectory).list(recursive: true)) {
        logger.info('  ${entity.path}');
      }
      throw Exception('Native build produced no library.');
    }

    logger.info('Successfully registered ${outLibs.length} native asset(s).');
  });
}
