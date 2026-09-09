// ignore_for_file: avoid_print

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:path/path.dart' as path;

enum TestModel { qwen35_08b, qwen35_08bMmproj }

/// Downloads and caches the small GGUF used by the native integration suite.
class TestModelManager {
  static const _qwenFilename = 'Qwen3.5-0.8B-Q4_K_M.gguf';
  static const _qwenRevision = 'fb22ecba24c0b7f51525f5124febd84aa5003cd5';
  static const _qwenSizeBytes = 532517120;
  static const _qwenMmprojFilename = 'Qwen3.5-0.8B-mmproj-F16.gguf';
  static const _qwenMmprojSizeBytes = 204987232;

  static final _modelRegistry = <TestModel, ModelMetadata>{
    TestModel.qwen35_08b: const ModelMetadata(
      sizeBytes: _qwenSizeBytes,
      repoId: 'telosnex/fllama',
      revision: _qwenRevision,
      filename: _qwenFilename,
      seedPathEnvironmentVariable: 'QWEN_0_8B_MODEL_PATH',
      urlEnvironmentVariable: 'QWEN_0_8B_MODEL_URL',
    ),
    TestModel.qwen35_08bMmproj: const ModelMetadata(
      sizeBytes: _qwenMmprojSizeBytes,
      repoId: 'telosnex/fllama',
      revision: _qwenRevision,
      filename: _qwenMmprojFilename,
      seedPathEnvironmentVariable: 'QWEN_0_8B_MMPROJ_PATH',
      urlEnvironmentVariable: 'QWEN_0_8B_MMPROJ_URL',
    ),
  };

  final Directory cacheDirectory;

  TestModelManager({Directory? cacheDirectory})
      : cacheDirectory = cacheDirectory ??
            Directory(
              Platform.environment['MODEL_CACHE_DIR'] ??
                  path.join(Directory.current.path, '.model_cache'),
            );

  String getModelStoragePath(TestModel model) {
    return path.join(cacheDirectory.path, _modelRegistry[model]!.filename);
  }

  Future<File> getModel(TestModel model) async {
    final metadata = _modelRegistry[model]!;
    await cacheDirectory.create(recursive: true);

    final modelFile = File(getModelStoragePath(model));
    if (await _isComplete(modelFile, metadata)) {
      print(
        '[model cache] hit: ${modelFile.absolute.path} '
        '(${_formatSize(metadata.sizeBytes)})',
      );
      return modelFile;
    }

    if (await modelFile.exists()) {
      print('[model cache] deleting incomplete model: ${modelFile.path}');
      await modelFile.delete();
    }

    final seedPath = Platform.environment[metadata.seedPathEnvironmentVariable];
    if (seedPath != null && seedPath.isNotEmpty) {
      final seedFile = File(seedPath);
      if (await _isComplete(seedFile, metadata)) {
        print('[model cache] seeding from ${seedFile.absolute.path}');
        await _copyAtomically(seedFile, modelFile);
        return modelFile;
      }
      print('[model cache] ignoring missing or incomplete seed: $seedPath');
    }

    final configuredUrl = Platform.environment[metadata.urlEnvironmentVariable];
    final url = configuredUrl ?? _modelUrl(metadata);
    print(
      '[model cache] downloading ${metadata.filename} '
      '(${_formatSize(metadata.sizeBytes)}) from $url',
    );
    await _download(Uri.parse(url), modelFile, metadata);
    return modelFile;
  }

  Future<void> _download(
    Uri uri,
    File destination,
    ModelMetadata metadata,
  ) async {
    final temporary = File('${destination.path}.tmp');
    if (await temporary.exists()) await temporary.delete();

    final dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(minutes: 30),
      ),
    );

    var lastLoggedPercent = -10;
    try {
      await dio.download(
        uri.toString(),
        temporary.path,
        onReceiveProgress: (received, total) {
          if (total <= 0) return;
          final percent = received * 100 ~/ total;
          if (percent >= lastLoggedPercent + 10 || received == total) {
            lastLoggedPercent = percent;
            print(
              '[model cache] download $percent% '
              '(${_formatSize(received)} / ${_formatSize(total)})',
            );
          }
        },
      );

      if (!await _isComplete(temporary, metadata)) {
        final actualSize = await temporary.length();
        throw StateError(
          'Downloaded ${metadata.filename} has $actualSize bytes; '
          'expected ${metadata.sizeBytes}.',
        );
      }
      await temporary.rename(destination.path);
      print('[model cache] stored ${destination.absolute.path}');
    } catch (_) {
      if (await temporary.exists()) await temporary.delete();
      rethrow;
    } finally {
      dio.close(force: true);
    }
  }

  Future<void> _copyAtomically(File source, File destination) async {
    final temporary = File('${destination.path}.tmp');
    if (await temporary.exists()) await temporary.delete();
    try {
      await source.copy(temporary.path);
      await temporary.rename(destination.path);
    } catch (_) {
      if (await temporary.exists()) await temporary.delete();
      rethrow;
    }
  }

  Future<bool> _isComplete(File file, ModelMetadata metadata) async {
    return await file.exists() && await file.length() == metadata.sizeBytes;
  }

  static String _modelUrl(ModelMetadata metadata) {
    const baseUrl = String.fromEnvironment('FLLAMA_TEST_MODEL_BASE_URL');
    if (baseUrl.isNotEmpty) {
      return '${baseUrl.replaceFirst(RegExp(r'/+$'), '')}/'
          '${Uri.encodeComponent(metadata.filename)}';
    }
    return 'https://huggingface.co/${metadata.repoId}/resolve/'
        '${metadata.revision}/${Uri.encodeComponent(metadata.filename)}';
  }

  static String _formatSize(int bytes) {
    const mb = 1024 * 1024;
    return '${(bytes / mb).toStringAsFixed(1)} MiB';
  }
}

class ModelMetadata {
  final int sizeBytes;
  final String repoId;
  final String revision;
  final String filename;
  final String seedPathEnvironmentVariable;
  final String urlEnvironmentVariable;

  const ModelMetadata({
    required this.sizeBytes,
    required this.repoId,
    required this.revision,
    required this.filename,
    required this.seedPathEnvironmentVariable,
    required this.urlEnvironmentVariable,
  });
}
