// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:fllama/fllama.dart' as fllama;
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path/path.dart' as p;

import 'test/initialize.dart';

void main() {
  if (kIsWeb) {
    print('Skipping native fllama integration test on web');
    return;
  }

  const skipPlatforms = {
    TargetPlatform.android,
    TargetPlatform.iOS,
    TargetPlatform.windows,
  };
  if (skipPlatforms.contains(defaultTargetPlatform)) {
    print('Skipping native fllama integration test on $defaultTargetPlatform');
    return;
  }

  group('Qwen OAI error callback integration', () {
    late File modelFile;

    setUpAll(() async {
      prepareAllowNetworkRequests();
      prepareTestBindings();
      await preparePathProviderAsync();

      final cache = _QwenModelCache();
      modelFile = await cache.getModelFile();
      print('[qwen test] model path: ${modelFile.absolute.path}');
    });

    test(
      'valid request produces callbacks',
      () async {
        final callbacks = await _runQwenChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(fllama.Role.user, 'Say hello in one word.')
          ],
          maxTokens: 8,
        );

        expect(callbacks, isNotEmpty);
        expect(callbacks.last.done, isTrue);
        expect(
          callbacks.map((event) => event.result).join(),
          isNotEmpty,
        );
      },
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'system message after user returns parse error through callback',
      () async {
        final callbacks = await _runQwenChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(fllama.Role.user, 'Hello.'),
            fllama.Message(
              fllama.Role.system,
              'This intentionally comes after the user message.',
            ),
          ],
          maxTokens: 8,
        );

        print('[qwen test] callbacks:');
        for (final event in callbacks) {
          print(
            '[qwen test] done=${event.done} '
            'result=${event.result.replaceAll('\n', '[NL]')} '
            'json=${event.openAiResponseJsonString.replaceAll('\n', '[NL]')}',
          );
        }

        expect(callbacks, isNotEmpty);
        expect(callbacks.last.done, isTrue);
        expect(callbacks.last.openAiResponseJsonString, isEmpty);
        expect(
          callbacks.map((event) => event.result).join('\n'),
          allOf(
            contains('Error:'),
            contains('OAI parse error'),
            contains('System message must be at the beginning'),
          ),
        );
      },
      timeout: const Timeout(Duration(minutes: 10)),
    );
  });
}

Future<List<_FllamaCallbackEvent>> _runQwenChat({
  required String modelPath,
  required List<fllama.Message> messages,
  required int maxTokens,
}) async {
  final callbacks = <_FllamaCallbackEvent>[];
  final done = Completer<List<_FllamaCallbackEvent>>();

  await fllama.fllamaChat(
    fllama.OpenAiRequest(
      modelPath: modelPath,
      messages: messages,
      contextSize: 4096,
      maxTokens: maxTokens,
      numGpuLayers: int.tryParse(
            Platform.environment['FLLAMA_TEST_NUM_GPU_LAYERS'] ?? '',
          ) ??
          99,
      temperature: 0.1,
      topP: 1.0,
      logger: (message) {
        print('[qwen test llama.cpp] $message');
      },
    ),
    (result, openAiResponseJsonString, doneFlag) {
      final event = _FllamaCallbackEvent(
        result: result,
        openAiResponseJsonString: openAiResponseJsonString,
        done: doneFlag,
      );
      callbacks.add(event);
      if (doneFlag && !done.isCompleted) {
        done.complete(callbacks);
      }
    },
  );

  return done.future.timeout(const Duration(minutes: 8));
}

class _FllamaCallbackEvent {
  final String result;
  final String openAiResponseJsonString;
  final bool done;

  const _FllamaCallbackEvent({
    required this.result,
    required this.openAiResponseJsonString,
    required this.done,
  });
}

class _QwenModelCache {
  static const _modelFilename = 'Qwen3.5-0.8B-Q4_K_M.gguf';

  final Directory cacheDirectory;
  final File localSeedFile;
  final Uri downloadUri;

  _QwenModelCache()
      : cacheDirectory = Directory(
          Platform.environment['MODEL_CACHE_DIR'] ??
              (Platform.isMacOS
                  ? '/Users/jpo/Library/Containers/com.example.fllamaExample/Data/.model_cache'
                  : p.join(Directory.current.path, '.model_cache')),
        ),
        localSeedFile = File(
          Platform.environment['QWEN_0_8B_MODEL_PATH'] ??
              '/Users/jpo/Downloads/qwens/$_modelFilename',
        ),
        downloadUri = Uri.parse(
          Platform.environment['QWEN_0_8B_MODEL_URL'] ??
              'https://huggingface.co/telosnex/fllama/resolve/main/$_modelFilename',
        );

  File get cachedModelFile => File(p.join(cacheDirectory.path, _modelFilename));

  Future<File> getModelFile() async {
    await cacheDirectory.create(recursive: true);
    final cached = cachedModelFile;
    if (await cached.exists()) {
      print('[qwen test] using cached model: ${cached.path}');
      return cached;
    }

    if (await localSeedFile.exists()) {
      print(
        '[qwen test] seeding cache from local file: ${localSeedFile.path}',
      );
      try {
        await localSeedFile.copy(cached.path);
        return cached;
      } on FileSystemException catch (e) {
        print(
          '[qwen test] local seed file exists but cannot be copied: $e. '
          'Downloading instead.',
        );
      }
    }

    print('[qwen test] downloading model from $downloadUri');
    await _download(downloadUri, cached);
    return cached;
  }

  Future<void> _download(Uri uri, File destination) async {
    final tempFile = File('${destination.path}.tmp');
    if (await tempFile.exists()) {
      await tempFile.delete();
    }

    final dio = Dio(
      BaseOptions(
        receiveTimeout: const Duration(minutes: 30),
        connectTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
      ),
    );
    (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
      return HttpClient()
        ..badCertificateCallback = (cert, host, port) {
          if (host.endsWith('huggingface.co') || host.endsWith('hf.co')) {
            return true;
          }
          return false;
        };
    };

    try {
      await dio.download(
        uri.toString(),
        tempFile.path,
        onReceiveProgress: (received, total) {
          if (total <= 0) {
            print('[qwen test] downloaded $received bytes');
            return;
          }
          final percent = (received / total * 100).toStringAsFixed(1);
          print('[qwen test] download $percent% ($received / $total bytes)');
        },
      );
      await tempFile.rename(destination.path);
    } catch (_) {
      if (await tempFile.exists()) {
        await tempFile.delete();
      }
      rethrow;
    }
  }
}
