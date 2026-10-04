// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:convert';
import 'dart:ffi' show Abi;
import 'dart:io';

import 'package:fllama/fllama.dart' as fllama;
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

import 'test/initialize.dart';
import 'test/test_model_manager.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final supportedPlatform = !kIsWeb;

  group('native Qwen 3.5 0.8B integration', () {
    late File modelFile;
    late File mmprojFile;

    setUpAll(() async {
      prepareAllowNetworkRequests();
      if (!supportedPlatform) return;

      final modelManager = TestModelManager(
        cacheDirectory: await _modelCacheDirectory(),
      );
      final files = await Future.wait([
        modelManager.getModel(TestModel.qwen35_08b),
        modelManager.getModel(TestModel.qwen35_08bMmproj),
      ]);
      modelFile = files[0];
      mmprojFile = files[1];
      print('[fllama integration] model: ${modelFile.absolute.path}');
      print('[fllama integration] mmproj: ${mmprojFile.absolute.path}');
    });

    test(
      'reads GGUF metadata and tokenizes text',
      () async {
        final modelPath = modelFile.absolute.path;
        final template = await fllama.fllamaChatTemplateGet(modelPath);
        final eosToken = await fllama.fllamaEosTokenGet(modelPath);
        final tokenCount = await fllama.fllamaTokenize(
          fllama.FllamaTokenizeRequest(
            input: 'Hello from the fllama integration suite.',
            modelPath: modelPath,
          ),
        );

        expect(template, isNotEmpty);
        expect(eosToken, isNotEmpty);
        expect(tokenCount, greaterThan(0));
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 5)),
    );

    test(
      'reports loaded backends and unique GPU device keys',
      () async {
        final loaded = await fllama.fllamaLoadedBackendFiles();
        final gpus = await fllama.fllamaGpuMemoryInfoGetAll();
        print('[fllama integration] backends: $loaded');
        for (final gpu in gpus) {
          print(
            '[fllama integration] gpu: ${gpu.deviceKey} '
            'integrated=${gpu.isIntegrated} '
            'free=${gpu.freeBytes} total=${gpu.totalBytes}',
          );
        }

        final splitLibraries =
            Platform.isWindows || Abi.current() == Abi.linuxX64;
        if (splitLibraries) {
          // Exactly one CPU variant, chosen for this CPU (ADR 004, I2).
          expect(loaded.where((f) => f.contains('ggml-cpu')), hasLength(1));
        } else {
          expect(loaded, isEmpty);
        }

        final keys = [for (final gpu in gpus) gpu.deviceKey];
        expect(keys.toSet(), hasLength(keys.length));
        for (final gpu in gpus) {
          expect(gpu.backend, isNotEmpty);
          expect(
            gpu.deviceKey,
            matches(
              RegExp('^${RegExp.escape('${gpu.backend}|${gpu.description}|')}'
                  r'\d+$'),
            ),
          );
        }
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 2)),
    );

    test(
      'an unknown GPU device key falls back to Auto',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(fllama.Role.user, 'Reply with the word: ok'),
          ],
          maxTokens: 16,
          enableThinking: false,
          gpuDeviceKey: 'NoSuchBackend|No such GPU|0',
        );
        expect(run.events.last.done, isTrue);
        expect(run.events.last.result, isNot(startsWith('Error')));
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 5)),
    );

    test(
      'streams a chat response and OpenAI-compatible JSON',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(
              fllama.Role.user,
              'Reply with a short greeting.',
            ),
          ],
          maxTokens: 24,
        );

        expect(run.events, isNotEmpty);
        expect(run.events.last.done, isTrue);
        expect(run.output.trim(), isNotEmpty);
        expect(run.output, isNot(contains('Error:')));

        final jsonChunks = run.decodedJsonChunks;
        expect(jsonChunks, isNotEmpty);
        expect(
          jsonChunks.any((chunk) => chunk['choices'] is List),
          isTrue,
          reason: 'Expected at least one OpenAI-style choices payload.',
        );
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'identifies a solid red image',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          mmprojPath: mmprojFile.absolute.path,
          messages: [
            fllama.Message(
              fllama.Role.user,
              '<img src="data:image/png;base64,$_solidRedPngBase64">\n\n'
              'What single color fills this image? Answer with only the color name.',
            ),
          ],
          maxTokens: 16,
          temperature: 0,
          enableThinking: false,
        );

        print('[fllama integration] vision output: ${run.output}');
        print(
          '[fllama integration] vision content: ${run.responseContent}',
        );
        expect(run.events, isNotEmpty);
        expect(run.events.last.done, isTrue);
        expect(run.output, isNot(contains('Error:')));
        expect(
          run.responseContent.toLowerCase().trim(),
          matches(RegExp(r'^red[.!]?$')),
          reason: 'The vision model should answer with only "red".',
        );
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'relays an OpenAI parser error through the callback',
      () async {
        final run = await _runChat(
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

        expect(run.events, isNotEmpty);
        expect(run.events.last.done, isTrue);
        expect(run.events.last.openAiResponseJsonString, isEmpty);
        expect(
          run.output,
          allOf(
            contains('Error:'),
            contains('OAI parse error'),
            contains('System message must be at the beginning'),
          ),
        );
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );
  });
}

Future<Directory> _modelCacheDirectory() async {
  // Mobile apps cannot access Codemagic's host filesystem even if the simulator
  // happens to inherit MODEL_CACHE_DIR. They receive the cached files from the
  // host's local model server and keep their copies in the app sandbox.
  if (defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS) {
    final supportDirectory = await getApplicationSupportDirectory();
    return Directory(path.join(supportDirectory.path, '.model_cache'));
  }

  final configuredPath = Platform.environment['MODEL_CACHE_DIR'];
  if (configuredPath != null && configuredPath.isNotEmpty) {
    return Directory(configuredPath);
  }
  return Directory(path.join(Directory.current.path, '.model_cache'));
}

int get _testGpuLayers {
  const configuredAtBuild = String.fromEnvironment(
    'FLLAMA_TEST_NUM_GPU_LAYERS',
  );
  return int.tryParse(
        Platform.environment['FLLAMA_TEST_NUM_GPU_LAYERS'] ?? configuredAtBuild,
      ) ??
      -1;
}

Future<_ChatRun> _runChat({
  required String modelPath,
  String? mmprojPath,
  required List<fllama.Message> messages,
  required int maxTokens,
  double temperature = 0.1,
  bool? enableThinking,
  String? gpuDeviceKey,
}) async {
  final events = <_CallbackEvent>[];
  final done = Completer<void>();

  await fllama.fllamaChat(
    fllama.OpenAiRequest(
      modelPath: modelPath,
      mmprojPath: mmprojPath,
      messages: messages,
      contextSize: 2048,
      maxTokens: maxTokens,
      numGpuLayers: _testGpuLayers,
      temperature: temperature,
      topP: 1.0,
      enableThinking: enableThinking,
      gpuDeviceKey: gpuDeviceKey,
      logger: (message) => print('[llama.cpp] $message'),
    ),
    (result, openAiResponseJsonString, doneFlag) {
      events.add(
        _CallbackEvent(
          result: result,
          openAiResponseJsonString: openAiResponseJsonString,
          done: doneFlag,
        ),
      );
      if (doneFlag && !done.isCompleted) done.complete();
    },
  );

  await done.future.timeout(const Duration(minutes: 8));
  return _ChatRun(events);
}

class _ChatRun {
  final List<_CallbackEvent> events;

  const _ChatRun(this.events);

  String get output => events.last.result;

  String get responseContent {
    final buffer = StringBuffer();
    for (final chunk in decodedJsonChunks) {
      final choices = chunk['choices'];
      if (choices is! List) continue;
      for (final choice in choices) {
        if (choice is! Map) continue;
        final delta = choice['delta'];
        final message = choice['message'];
        final content = delta is Map && delta['content'] is String
            ? delta['content'] as String
            : message is Map && message['content'] is String
                ? message['content'] as String
                : null;
        if (content != null) buffer.write(content);
      }
    }
    return buffer.toString();
  }

  List<Map<String, dynamic>> get decodedJsonChunks {
    final chunks = <Map<String, dynamic>>[];
    for (final event in events) {
      if (event.openAiResponseJsonString.isEmpty) continue;
      final decoded = jsonDecode(event.openAiResponseJsonString);
      final values = decoded is List ? decoded : [decoded];
      for (final value in values) {
        if (value is Map) chunks.add(Map<String, dynamic>.from(value));
      }
    }
    return chunks;
  }
}

class _CallbackEvent {
  final String result;
  final String openAiResponseJsonString;
  final bool done;

  const _CallbackEvent({
    required this.result,
    required this.openAiResponseJsonString,
    required this.done,
  });
}

// A 64x64 RGB PNG whose every pixel is #ff0000. Keeping it inline makes the
// multimodal integration input deterministic and avoids asset-bundle setup.
const _solidRedPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAS0lEQVR42u3PQQkA'
    'AAgAsetfWiP4FgYrsKZeS0BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA'
    'QEBAQEBAQEBAQEBAQEDgsqnc8OJg6Ln3AAAAAElFTkSuQmCC';
