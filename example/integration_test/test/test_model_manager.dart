// ignore_for_file: avoid_print

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';

import 'package:path/path.dart' as path;
import 'package:synchronized/synchronized.dart';

enum TestModel { tinyStories, phi4Mini, gemma3_12b, smolLm3 }

/// A singleton manager for downloading and caching large model files
/// for use in tests. This allows multiple tests to share the same model
/// files without having to include them in the repository or download
/// them for each test.
class TestModelManager {
  // Singleton pattern implementation
  static final TestModelManager _instance = TestModelManager._internal();
  factory TestModelManager() => _instance;
  TestModelManager._internal();

  // Configuration
  static final String _cacheDir =
      Platform.environment['MODEL_CACHE_DIR'] ??
      (Platform.isMacOS
          ? '/Users/jpo/Library/Containers/com.example.fllamaExample/Data/.model_cache'
          : path.join(Directory.current.path, '.model_cache'));

  static String pathForModel(TestModel model) {
    final metadata = _modelRegistry[model]!;
    return path.join(_cacheDir, metadata.filename);
  }

  // Map of model metadata (version, hash, etc)
  static final Map<TestModel, ModelMetadata> _modelRegistry = {
    TestModel.phi4Mini: ModelMetadata(
      sizeBytes: 1024 * 1024 * 2500, // 2.5GB
      repoId: 'telosnex/fllama',
      filename: 'microsoft_Phi-4-mini-instruct-Q4_0.gguf',
    ),
    TestModel.tinyStories: ModelMetadata(
      sizeBytes: 1024 * 1024 * 74, // 74MB
      repoId: 'telosnex/fllama',
      filename: 'DistilGPT2-TinyStories.IQ3_M.gguf',
    ),
    TestModel.gemma3_12b: ModelMetadata(
      sizeBytes: 1024 * 1024 * 6800, // 6.8GB
      repoId: 'telosnex/fllama',
      filename: 'google_gemma-3-12b-it-qat-Q4_0.gguf',
    ),
    TestModel.smolLm3: ModelMetadata(
      sizeBytes: 1024 * 1024 * 1900, // 1.9GB
      repoId: 'telosnex/fllama',
      filename: 'HuggingFaceTB_SmolLM3-3B-Q4_0.gguf',
    ),
  };

  // Synchronization locks for each model
  final Map<TestModel, Lock> _fileLocks = {};

  String getModelStoragePath(TestModel model) {
    final metadata = _modelRegistry[model]!;
    return path.join(_cacheDir, metadata.filename);
  }

  /// Gets a model file, downloading it if necessary.
  ///
  /// [model] is the [TestModel] (must be in the model registry)
  /// [forceDownload] if true, will re-download even if the file exists
  ///
  /// Returns a [File] pointing to the downloaded model
  Future<File> getModel(TestModel model, {bool forceDownload = false}) async {
    // Validate model name
    if (!_modelRegistry.containsKey(model)) {
      throw ArgumentError(
        'Unknown model: $model. Available models: ${_modelRegistry.keys.join(', ')}',
      );
    }

    final metadata = _modelRegistry[model]!;
    final modelPath = getModelStoragePath(model);
    print('Current directory: ${Directory.current.path}');
    print('Cache directory: $_cacheDir');
    print('Model path: $modelPath');
    final lockPath = '$modelPath.lock';
    final modelFile = File(modelPath);

    // Create a lock for this specific model if it doesn't exist
    _fileLocks[model] ??= Lock();

    // Use the lock to synchronize access
    return await _fileLocks[model]!.synchronized(() async {
      // Check if model exists after acquiring the lock
      if (!forceDownload && await modelFile.exists()) {
        print(
          'Model $model already exists in cache folder, no need to download.',
        );
        return modelFile;
      }

      // Check for lock file (another process downloading)
      final lockFile = File(lockPath);
      if (await lockFile.exists()) {
        print('Another process is downloading $model. Waiting...');
        // Another process is downloading, wait and check periodically
        int attempts = 0;
        while (await lockFile.exists() && attempts < 30) {
          // 1 minute timeout
          await Future.delayed(Duration(seconds: 2));
          attempts++;

          if (await modelFile.exists()) {
            return modelFile;
          }
        }

        // If we timed out waiting and the lock still exists, it might be stale
        // rationale: necessary for algo.
        // ignore: no-equal-nested-conditions
        if (await lockFile.exists()) {
          await lockFile.delete();
        }
      }

      try {
        // Create lock file to signal download in progress
        await Directory(path.dirname(lockPath)).create(recursive: true);
        await lockFile.create();

        // Ensure cache directory exists
        await Directory(path.dirname(modelPath)).create(recursive: true);

        // Perform the actual download
        print(
          'Downloading model $modelFile (${_formatSize(metadata.sizeBytes)})...',
        );
        final downloadedFile = await _downloadModel(
          model,
          modelPath,
          onProgress: (received, total) {
            final percent = (received / total * 100).toStringAsFixed(1);
            final downloadedSize = _formatSize(received);
            final totalSize = _formatSize(total);
            print(
              'Downloading $model: $percent% ($downloadedSize / $totalSize)',
            );
          },
        );

        return downloadedFile;
      } catch (e) {
        print('Error downloading model $model: $e');
        rethrow; // Let the caller handle the error
      } finally {
        // Remove lock file when done (success or error)
        if (await lockFile.exists()) {
          await lockFile.delete();
        }
      }
    });
  }

  /// Downloads a model from HuggingFace
  Future<File> _downloadModel(
    TestModel model,
    String destPath, {
    void Function(int received, int total)? onProgress,
  }) async {
    final metadata = _modelRegistry[model]!;
    // Use the HuggingFace URL construction
    final url = _getHuggingFaceUrl(
      repoId: metadata.repoId,
      filename: metadata.filename,
      revision: 'main',
    );
    print('Downloading model from URL: $url');
    final file = File(destPath);
    final tempFile = File('$destPath.tmp');

    try {
      // Use Dio for downloading, which has built-in progress tracking
      final dio = Dio(
        BaseOptions(
          receiveTimeout: const Duration(minutes: 30),
          connectTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 30),
        ),
      );
      (dio.httpClientAdapter as IOHttpClientAdapter)
          .createHttpClient = () => HttpClient()
        ..badCertificateCallback = (X509Certificate cert, String host, int port) {
          print(
            '[TestModelManager._download] Bad certificate for $host:$port. Cert: $cert',
          );
          // huggingface.co was added initially, sometime Q2-Q3 2024
          // cdn-lfs.hf.co added 23-10-2024
          if (host.endsWith('huggingface.co') || host.endsWith('hf.co')) {
            return true;
          }
          print(
            '[ERROR] [TestModelManager._download] Bad certificate for $host:$port. Cert: $cert',
          );
          return false;
        };

      await dio.download(url, tempFile.path, onReceiveProgress: onProgress);
      print('Attempting move from ${tempFile.path} to $destPath');
      // Move temp file to final destination
      await tempFile.rename(destPath);
      print('Model moved to final destination: $destPath');
      return file;
    } on DioException catch (dioError, s) {
      print('Dio error downloading model: ${dioError.message}. $dioError. Stack: $s');
      if (dioError.response != null) {
        print('Status code: ${dioError.response?.statusCode}');
        print('Response data: ${dioError.response?.data}');
      }
      // Clean up incomplete file
      if (await tempFile.exists()) {
        await tempFile.delete();
      }
      if (await file.exists()) {
        await file.delete();
      }
      Error.throwWithStackTrace(
        Exception('Failed to download model: ${dioError.message}'),
        s,
      );
    } catch (e) {
      // Clean up incomplete file
      if (await tempFile.exists()) {
        await tempFile.delete();
      }
      if (await file.exists()) {
        await file.delete();
      }
      rethrow;
    }
  }

  String _getHuggingFaceUrl({
    required String repoId,
    required String filename,
    String revision = 'main',
  }) {
    return 'https://huggingface.co/$repoId/resolve/$revision/$filename';
  }

  /// Formats file size in human-readable format
  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  /// Cleans the cache directory, removing any unused or outdated models
  Future<void> cleanCache() async {
    final cacheDir = Directory(_cacheDir);
    if (!await cacheDir.exists()) return;

    // Get valid model filenames
    final validFilenames = _modelRegistry.entries
        .map((entry) => entry.value.filename)
        .toSet();

    // Delete any files that don't match our known models
    await for (final entity in cacheDir.list()) {
      if (entity is File) {
        final filename = path.basename(entity.path);
        if (filename.endsWith('.lock')) {
          // Check if lock file is stale (older than 1 hour)
          final stat = await entity.stat();
          final now = DateTime.now();
          if (now.difference(stat.modified).inHours > 1) {
            await entity.delete();
          }
        } else if (!validFilenames.contains(filename)) {
          await entity.delete();
        }
      }
    }
  }
}

/// Metadata about a specific model version
class ModelMetadata {
  final int sizeBytes;
  final String repoId; // HuggingFace repository ID
  final String filename; // Actual filename in the HuggingFace repo

  const ModelMetadata({
    required this.sizeBytes,
    required this.repoId,
    required this.filename,
  });
}
