// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:convert';
import 'dart:ffi' show Abi;
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

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
        expect(fllama.fllamaTrainedContextLength(modelPath), 262144);
        expect(
          fllama.fllamaTrainedContextLength(mmprojFile.absolute.path),
          isNull,
          reason: 'An mmproj file has no context length.',
        );
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

        final splitLibraries = Platform.isWindows ||
            Abi.current() == Abi.linuxX64 ||
            Abi.current() == Abi.androidArm64;
        if (splitLibraries) {
          // Exactly one CPU variant, chosen for this CPU (ADR 004, I2).
          expect(loaded.where((f) => f.contains('ggml-cpu')), hasLength(1));
          if (Platform.isAndroid) {
            // Audit item 1: one of ggml's Android variants.
            expect(loaded.single, startsWith('libggml-cpu-android_armv'));
          }
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

    // GPU packs (ADR 004, D13). These run before the chat tests, so the
    // chat tests run on the pack backend when this PC can use it.
    final packFiles = supportedPlatform
        ? fllama.fllamaGpuPackFiles()
        : const <fllama.FllamaGpuPackFile>[];
    final packSkip = packFiles.isEmpty ? 'This build has no GPU pack' : null;

    test(
      'rejects GPU pack files that are missing or changed',
      () async {
        expect(
          await fllama.fllamaLoadGpuPack('no-such-pack', 'unused'),
          contains('no GPU pack named'),
        );

        final empty = await Directory.systemTemp.createTemp('fllama_pack');
        final changed = await _unpackGpuPack(packFiles);
        try {
          final pack = packFiles.first.pack;
          expect(
            await fllama.fllamaLoadGpuPack(pack, empty.path),
            contains('missing or unreadable'),
          );

          final file = File(path.join(changed.path, packFiles.first.name));
          final bytes = await file.readAsBytes();
          bytes[bytes.length ~/ 2] ^= 0xff;
          await file.writeAsBytes(bytes);
          expect(
            await fllama.fllamaLoadGpuPack(pack, changed.path),
            contains('different SHA-256'),
          );
          final loaded = await fllama.fllamaLoadedBackendFiles();
          expect(loaded, isNot(contains(packFiles.first.name)));
        } finally {
          await _deleteTemp(empty);
          await _deleteTemp(changed);
        }
      },
      skip: packSkip,
      timeout: const Timeout(Duration(minutes: 2)),
    );

    test(
      'one request can use the whole context size',
      () async {
        // About 2,500 tokens in a 4,096 context: more than the quarter of it
        // that a slot had before the KV cache was unified.
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(
              fllama.Role.user,
              '${List.filled(2500, 'apple').join(' ')}\n'
              'Reply with OK.',
            ),
          ],
          maxTokens: 4,
          enableThinking: false,
          contextSize: 4096,
        );
        expect(run.error, isNull);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'a new context size is not given the context of a busy model',
      () async {
        // Telosnex TEL: a Context Size change while a request ran was
        // ignored; the next request got the old context.
        final firstToken = Completer<void>();
        final busyDone = Completer<void>();
        await fllama.fllamaChat(
          fllama.OpenAiRequest(
            modelPath: modelFile.absolute.path,
            messages: [
              fllama.Message(fllama.Role.user, 'Count from 1 to 200.'),
            ],
            contextSize: 2048,
            maxTokens: 400,
            numGpuLayers: _testGpuLayers,
            enableThinking: false,
          ),
          (result, json, isDone, _) {
            if (!firstToken.isCompleted) firstToken.complete();
            if (isDone && !busyDone.isCompleted) busyDone.complete();
          },
        );
        await firstToken.future.timeout(const Duration(minutes: 5));
        expect(busyDone.isCompleted, isFalse,
            reason: 'The first request must still run for this test.');

        // About 2,500 tokens: more than a slot of the 2,048 context, less
        // than a slot of the 16,384 one.
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(
              fllama.Role.user,
              '${List.filled(2500, 'apple').join(' ')}\n'
              'Reply with OK.',
            ),
          ],
          maxTokens: 4,
          enableThinking: false,
          contextSize: 16384,
        );
        await busyDone.future.timeout(const Duration(minutes: 2));
        expect(run.error, isNull);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'refuses to load a GPU pack while a request runs',
      () async {
        final dir = await _unpackGpuPack(packFiles);
        final firstToken = Completer<void>();
        final done = Completer<void>();
        final requestId = await fllama.fllamaChat(
          fllama.OpenAiRequest(
            modelPath: modelFile.absolute.path,
            messages: [
              fllama.Message(fllama.Role.user, 'Count from 1 to 200.'),
            ],
            contextSize: 2048,
            maxTokens: 400,
            numGpuLayers: _testGpuLayers,
            enableThinking: false,
          ),
          (result, json, isDone, _) {
            if (!firstToken.isCompleted) firstToken.complete();
            if (isDone && !done.isCompleted) done.complete();
          },
        );
        try {
          await firstToken.future.timeout(const Duration(minutes: 5));
          expect(done.isCompleted, isFalse,
              reason: 'The request must still run for this test.');
          expect(
            await fllama.fllamaLoadGpuPack(packFiles.first.pack, dir.path),
            contains('request is running'),
          );
        } finally {
          fllama.fllamaCancelInference(requestId);
          await done.future.timeout(const Duration(minutes: 2));
          await _deleteTemp(dir);
        }
      },
      skip: packSkip,
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'loads the GPU pack, or runs on the CPU without a usable GPU',
      () async {
        final hasGpu = await fllama.fllamaHasVulkanGpu();
        final dir = await _unpackGpuPack(packFiles);
        try {
          final pack = packFiles.first.pack;
          final error = await fllama.fllamaLoadGpuPack(pack, dir.path);
          final loaded = await fllama.fllamaLoadedBackendFiles();
          print(
            '[fllama integration] Vulkan GPU: $hasGpu, pack load: '
            '${error ?? 'ok'}, backends: $loaded',
          );
          if (hasGpu) {
            expect(error, isNull);
            expect(loaded, contains(packFiles.first.name));
            // A second load of the same pack does nothing.
            expect(await fllama.fllamaLoadGpuPack(pack, dir.path), isNull);
            final gpus = await fllama.fllamaGpuMemoryInfoGetAll();
            expect(gpus.map((gpu) => gpu.backend), contains('Vulkan'));
          } else if (error != null) {
            // Without a Vulkan GPU, ggml-vulkan finds no device and does
            // not register. fllama keeps running on the CPU (I1).
            expect(error, contains('failed to load'));
            expect(loaded, isNot(contains(packFiles.first.name)));
          }
        } finally {
          await _deleteTemp(dir);
        }
      },
      skip: packSkip,
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
        expect(run.error, isNull);
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
        expect(run.error, isNull);

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
        expect(run.error, isNull);
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
      'starts from the sampling settings that the GGUF file recommends',
      () async {
        // A copy of the model whose file recommends top-k 1: always the most
        // likely token. Then even a high temperature gives the same reply.
        final greedy = await _copyWithTopK1(modelFile);
        try {
          Future<String> reply() async {
            final run = await _runChat(
              modelPath: greedy.path,
              messages: [
                fllama.Message(fllama.Role.user, 'Write a poem about rain.'),
              ],
              maxTokens: 24,
              temperature: 2.0,
              topP: null,
              enableThinking: false,
            );
            expect(run.error, isNull);
            return run.responseContent;
          }

          final first = await reply();
          final second = await reply();
          print('[fllama integration] top-k 1 replies: "$first" "$second"');
          expect(first, isNotEmpty);
          expect(second, first);
        } finally {
          await _deleteFile(greedy);
        }
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'applies top-k, min-p and separate penalties from chat JSON',
      () async {
        Future<String> reply() async {
          final run = await _runChat(
            modelPath: modelFile.absolute.path,
            messages: [
              fllama.Message(fllama.Role.user, 'Write a poem about rain.'),
            ],
            maxTokens: 24,
            temperature: 2,
            topK: 1,
            minP: 0,
            presencePenalty: 1.5,
            repeatPenalty: 1,
            enableThinking: false,
          );
          expect(run.error, isNull);
          return run.responseContent;
        }

        final first = await reply();
        expect(first, isNotEmpty);
        expect(await reply(), first);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'makes parallel tool calls when the chat template supports them',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(
              fllama.Role.user,
              'What is the weather in Paris and in Tokyo? Call get_weather '
              'once for each city, both now.',
            ),
          ],
          maxTokens: 160,
          temperature: 0,
          enableThinking: false,
          tools: [
            fllama.Tool(
              name: 'get_weather',
              description: 'Gets the current weather in a city.',
              jsonSchema: jsonEncode({
                'type': 'object',
                'properties': {
                  'city': {'type': 'string'},
                },
                'required': ['city'],
              }),
            ),
          ],
        );
        print('[fllama integration] tool calls: ${run.toolCalls}');
        expect(run.error, isNull);
        expect(run.toolCalls.length, 2);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'reports an invalid request as an error, not as output',
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

        expect(run.events.last.done, isTrue);
        expect(run.error?.type, fllama.FllamaErrorType.invalidRequest);
        expect(
          run.error?.message,
          contains('System message must be at the beginning'),
        );
        expect(run.output, isEmpty);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'reports a prompt longer than the context as an error',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(
              fllama.Role.user,
              List.filled(2500, 'apple').join(' '),
            ),
          ],
          maxTokens: 4,
          enableThinking: false,
          contextSize: 1024,
        );
        expect(run.error?.type, fllama.FllamaErrorType.contextSizeExceeded);
        expect(run.error?.message, contains('context'));
        expect(run.output, isEmpty);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    group('a model that cannot load', () {
      late Directory dir;
      late File notGguf;

      setUp(() async {
        dir = await Directory.systemTemp.createTemp('fllama_bad_model');
        notGguf = File(path.join(dir.path, 'not_a_model.gguf'))
          ..writeAsStringSync('This is not a GGUF file.');
      });

      tearDown(() => _deleteTemp(dir));

      Future<void> expectLoadErrorWithReason() async {
        final run = await _runChat(
          modelPath: notGguf.path,
          messages: [fllama.Message(fllama.Role.user, 'Hi')],
          maxTokens: 4,
        );
        expect(run.error?.type, fllama.FllamaErrorType.modelLoad);
        // llama.cpp's reason, not only that the load failed.
        expect(run.error?.message, contains('invalid magic'));
        expect(run.logs.join('\n'), contains('invalid magic'));
        expect(run.output, isEmpty);
      }

      test(
        'fllamaTokenize throws',
        () => expectLater(
          fllama.fllamaTokenize(
            fllama.FllamaTokenizeRequest(input: 'Hi', modelPath: notGguf.path),
          ),
          throwsA(isA<StateError>()),
        ),
        skip: supportedPlatform ? null : 'Native-platform test',
      );

      test(
        'reports llama.cpp\'s reason',
        expectLoadErrorWithReason,
        skip: supportedPlatform ? null : 'Native-platform test',
      );

      test(
        'reports llama.cpp\'s reason after a tokenize call',
        () async {
          await fllama.fllamaTokenize(
            fllama.FllamaTokenizeRequest(
              input: 'Hello',
              modelPath: modelFile.absolute.path,
            ),
          );
          await expectLoadErrorWithReason();
        },
        skip: supportedPlatform ? null : 'Native-platform test',
      );
    });

    test(
      'stops generating soon after a cancel',
      () async {
        var chunks = 0;
        final firstChunk = Completer<void>();
        final done = Completer<void>();
        fllama.FllamaError? error;
        final id = await fllama.fllamaChat(
          fllama.OpenAiRequest(
            modelPath: modelFile.absolute.path,
            messages: [
              fllama.Message(
                fllama.Role.user,
                'Count from 1 to 2000, one number per line.',
              ),
            ],
            contextSize: 8192,
            maxTokens: 3000,
            numGpuLayers: _testGpuLayers,
            enableThinking: false,
          ),
          (result, json, isDone, e) {
            chunks++;
            if (!firstChunk.isCompleted) firstChunk.complete();
            if (isDone && !done.isCompleted) {
              error = e;
              done.complete();
            }
          },
        );
        await firstChunk.future.timeout(const Duration(minutes: 5));
        final chunksAtCancel = chunks;
        fllama.fllamaCancelInference(id);
        await done.future.timeout(const Duration(minutes: 3));
        print('[fllama integration] chunks after cancel: '
            '${chunks - chunksAtCancel}');
        expect(chunks - chunksAtCancel, lessThan(50));
        expect(error, isNull, reason: 'A cancel is not an error.');
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'accepts a message that is only whitespace',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(fllama.Role.user, 'Hi.'),
            fllama.Message(fllama.Role.assistant, '  \n'),
            fllama.Message(fllama.Role.user, 'Reply with OK.'),
          ],
          maxTokens: 4,
          enableThinking: false,
        );
        expect(run.error, isNull);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'logs when a chat template cannot be used',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [fllama.Message(fllama.Role.user, 'Reply with OK.')],
          maxTokens: 4,
          enableThinking: false,
          jinjaTemplate: '{% if %}',
        );
        expect(run.error, isNull);
        expect(run.logs.join('\n'), contains('ChatML'));
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'logs every line before the last callback',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [fllama.Message(fllama.Role.user, 'Reply with OK.')],
          maxTokens: 4,
          enableThinking: false,
        );
        expect(run.error, isNull);
        expect(run.logs.last, startsWith('[fllama] Done.'));
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    // Audit item 6.
    test(
      'loads a model once for each context size when requests race',
      () async {
        // Context sizes that no other test uses, so neither is loaded yet.
        Future<_ChatRun> ask(int contextSize) => _runChat(
              modelPath: modelFile.absolute.path,
              messages: [fllama.Message(fllama.Role.user, 'Reply with OK.')],
              maxTokens: 2,
              enableThinking: false,
              contextSize: contextSize,
            );
        final runs = await Future.wait([ask(2304), ask(2560)]);
        for (final run in runs) {
          expect(run.error, isNull);
        }
        int loads(_ChatRun run) =>
            run.logs.where((l) => l.contains('loaded meta data')).length;
        print('[fllama integration] loads: ${runs.map(loads).toList()}');
        expect(runs.map(loads).toList(), [1, 1]);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      // Before the fix, the second request deadlocked on the load mutex.
      timeout: const Timeout(Duration(minutes: 3)),
    );

    // Full audit: each isolate numbers its requests from 0, and native
    // fllama keys its request threads by that number.
    test(
      'requests from two isolates both finish',
      () async {
        final modelPath = modelFile.absolute.path;
        final errors = await Future.wait(
          [_chatInIsolate(modelPath), _chatInIsolate(modelPath)],
        );
        expect(errors, [null, null]);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 3)),
    );

    // Audit item 4: llama-server's request fields reach llama.cpp.
    test(
      'stops at a stop string',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(
              fllama.Role.user,
              'Count from 1 to 20, separated by commas.',
            ),
          ],
          maxTokens: 80,
          temperature: 0,
          enableThinking: false,
          stop: [','],
        );
        print('[fllama integration] stop: "${run.responseContent}"');
        expect(run.error, isNull);
        expect(run.responseContent, isNotEmpty);
        expect(run.responseContent, isNot(contains(',')));
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'gives the same reply for the same seed',
      () async {
        Future<String> reply() async {
          final run = await _runChat(
            modelPath: modelFile.absolute.path,
            messages: [
              fllama.Message(fllama.Role.user, 'Write a poem about rain.'),
            ],
            maxTokens: 24,
            temperature: 1.5,
            enableThinking: false,
            seed: 1234,
          );
          expect(run.error, isNull);
          return run.responseContent;
        }

        final first = await reply();
        expect(first, isNotEmpty);
        expect(await reply(), first);
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'replies with JSON that matches a JSON schema',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [fllama.Message(fllama.Role.user, 'What is 2 + 2?')],
          maxTokens: 40,
          temperature: 0,
          enableThinking: false,
          jsonSchema: jsonEncode({
            'type': 'object',
            'properties': {
              'answer': {'type': 'integer'},
            },
            'required': ['answer'],
            'additionalProperties': false,
          }),
        );
        print('[fllama integration] json: "${run.responseContent}"');
        expect(run.error, isNull);
        final decoded = jsonDecode(run.responseContent);
        expect(decoded, isA<Map>());
        expect((decoded as Map)['answer'], isA<int>());
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'replies with text that matches a grammar',
      () async {
        final run = await _runChat(
          modelPath: modelFile.absolute.path,
          messages: [
            fllama.Message(fllama.Role.user, 'Write a poem about rain.'),
          ],
          maxTokens: 40,
          temperature: 0,
          enableThinking: false,
          grammar: 'root ::= "yes" | "no"',
        );
        print('[fllama integration] grammar: "${run.responseContent}"');
        expect(run.error, isNull);
        expect(run.responseContent, anyOf('yes', 'no'));
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );

    test(
      'reuses the cache up to an edited last message',
      () async {
        // Qwen 3.5 is a hybrid model: it can reuse a cached prompt only up to
        // a context checkpoint. Message boundaries let llama.cpp make one at
        // the start of the last user message.
        Future<_ChatRun> ask(String lastMessage) => _runChat(
              modelPath: modelFile.absolute.path,
              messages: [
                fllama.Message(
                  fllama.Role.user,
                  'Remember this list: ${List.filled(800, 'apple').join(' ')}',
                ),
                fllama.Message(fllama.Role.assistant, 'OK.'),
                fllama.Message(fllama.Role.user, lastMessage),
              ],
              maxTokens: 4,
              temperature: 0,
              enableThinking: false,
              contextSize: 8192,
            );

        final pears = List.filled(1200, 'pear').join(' ');
        final first = await ask('$pears\nReply with OK.');
        expect(first.error, isNull);
        final second = await ask('Plums. $pears\nReply with OK.');
        expect(second.error, isNull);
        print('[fllama integration] cached prompt tokens: '
            '${second.cachedPromptTokens}');
        // The first two messages are about 800 tokens.
        expect(second.cachedPromptTokens, greaterThan(700));
      },
      skip: supportedPlatform ? null : 'Native-platform test',
      timeout: const Timeout(Duration(minutes: 10)),
    );
  });
}

/// Downloads and gunzips [files] from the fllama GitHub release into a new
/// temporary directory, as an app does (ADR 004 D14). The files are cached in
/// the system temporary directory by SHA-256.
Future<Directory> _unpackGpuPack(List<fllama.FllamaGpuPackFile> files) async {
  final dir = await Directory.systemTemp.createTemp('fllama_pack');
  for (final file in files) {
    final cached = File(
      path.join(Directory.systemTemp.path, 'fllama_gpu_pack_${file.sha256}'),
    );
    if (!await cached.exists()) {
      print('[fllama integration] downloading ${file.url}');
      final client = HttpClient();
      try {
        final request = await client.getUrl(Uri.parse(file.url));
        final response = await request.close();
        if (response.statusCode != HttpStatus.ok) {
          throw HttpException('HTTP ${response.statusCode}', uri: request.uri);
        }
        final gz = await response.fold<BytesBuilder>(
          BytesBuilder(copy: false),
          (builder, chunk) => builder..add(chunk),
        );
        final temp = File('${cached.path}.tmp$pid');
        await temp.writeAsBytes(gzip.decode(gz.takeBytes()));
        await temp.rename(cached.path);
      } finally {
        client.close();
      }
    }
    await cached.copy(path.join(dir.path, file.name));
  }
  return dir;
}

/// Deletes a temporary directory if Windows allows it. After a failed
/// ggml_backend_load, Windows can keep the DLL file open until the process
/// ends.
Future<void> _deleteTemp(Directory dir) async {
  try {
    await dir.delete(recursive: true);
  } on FileSystemException catch (e) {
    print('[fllama integration] could not delete ${dir.path}: ${e.osError}');
  }
}

/// A copy of the GGUF file [model] with one more metadata value:
/// general.sampling.top_k = 1. Tensor offsets are relative to the start of
/// the tensor data, so only the header changes.
Future<File> _copyWithTopK1(File model) async {
  // The header of the test model, with its tokenizer, is a few MB.
  final raf = await model.open();
  final head = await raf.read(32 << 20);
  await raf.close();
  final data = ByteData.sublistView(head);
  var pos = 0;
  int u32() => data.getUint32((pos += 4) - 4, Endian.little);
  int u64() => data.getUint64((pos += 8) - 8, Endian.little);
  String str() {
    final length = u64();
    pos += length;
    return utf8.decode(head.sublist(pos - length, pos));
  }

  const sizes = {0: 1, 1: 1, 2: 2, 3: 2, 4: 4, 5: 4, 6: 4, 7: 1, 10: 8, 11: 8};
  void skip(int type) {
    if (type == 8) {
      str();
    } else if (type == 9) {
      final elementType = u32();
      final count = u64();
      for (var i = 0; i < count; i++) {
        skip(elementType);
      }
    } else {
      pos += sizes[type] ?? 8;
    }
  }

  expect(u32(), 0x46554747, reason: 'GGUF magic');
  u32();
  final tensorCount = u64();
  final keyCountAt = pos;
  final keyCount = u64();
  var alignment = 32;
  for (var i = 0; i < keyCount; i++) {
    final key = str();
    final type = u32();
    if (key == 'general.alignment') {
      alignment = data.getUint32(pos, Endian.little);
    }
    skip(type);
  }
  final keysEnd = pos;
  for (var i = 0; i < tensorCount; i++) {
    str();
    final dimensions = u32();
    pos += 8 * dimensions + 4 + 8; // Dimensions, type, offset.
  }
  final tensorInfosEnd = pos;
  int aligned(int n) => (n + alignment - 1) ~/ alignment * alignment;

  final key = utf8.encode('general.sampling.top_k');
  final extra = BytesBuilder()
    ..add((ByteData(8)..setUint64(0, key.length, Endian.little))
        .buffer
        .asUint8List())
    ..add(key)
    ..add((ByteData(4)..setUint32(0, 5, Endian.little)).buffer.asUint8List())
    ..add((ByteData(4)..setInt32(0, 1, Endian.little)).buffer.asUint8List());
  final header = BytesBuilder()
    ..add(head.sublist(0, keyCountAt))
    ..add((ByteData(8)..setUint64(0, keyCount + 1, Endian.little))
        .buffer
        .asUint8List())
    ..add(head.sublist(keyCountAt + 8, keysEnd))
    ..add(extra.takeBytes())
    ..add(head.sublist(keysEnd, tensorInfosEnd));
  final headerBytes = header.takeBytes();
  final padding = aligned(headerBytes.length) - headerBytes.length;

  final dir = await Directory.systemTemp.createTemp('fllama_top_k_1');
  final copy = File(path.join(dir.path, 'top_k_1.gguf'));
  final sink = copy.openWrite();
  sink.add(headerBytes);
  sink.add(Uint8List(padding));
  await sink.addStream(model.openRead(aligned(tensorInfosEnd)));
  await sink.close();
  return copy;
}

/// Deletes [file] and its directory if the OS allows it. Windows can keep a
/// loaded model file open.
Future<void> _deleteFile(File file) async {
  try {
    await file.parent.delete(recursive: true);
  } on FileSystemException catch (e) {
    print('[fllama integration] could not delete ${file.path}: ${e.osError}');
  }
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

/// Runs a short chat on a new isolate. Returns its error, or null.
Future<String?> _chatInIsolate(String modelPath) => Isolate.run(() async {
      final run = await _runChat(
        modelPath: modelPath,
        messages: [fllama.Message(fllama.Role.user, 'Reply with OK.')],
        maxTokens: 4,
        enableThinking: false,
      );
      return run.error?.toString();
    });

Future<_ChatRun> _runChat({
  required String modelPath,
  String? mmprojPath,
  required List<fllama.Message> messages,
  required int maxTokens,
  double temperature = 0.1,
  double? topP = 1.0,
  int? topK,
  double? minP,
  double? presencePenalty,
  double? repeatPenalty,
  bool? enableThinking,
  String? gpuDeviceKey,
  int contextSize = 2048,
  List<fllama.Tool> tools = const [],
  String? jinjaTemplate,
  int? seed,
  List<String>? stop,
  String? jsonSchema,
  String? grammar,
}) async {
  final events = <_CallbackEvent>[];
  final logs = <String>[];
  final done = Completer<void>();

  await fllama.fllamaChat(
    fllama.OpenAiRequest(
      modelPath: modelPath,
      mmprojPath: mmprojPath,
      messages: messages,
      contextSize: contextSize,
      maxTokens: maxTokens,
      numGpuLayers: _testGpuLayers,
      temperature: temperature,
      topP: topP,
      topK: topK,
      minP: minP,
      presencePenalty: presencePenalty,
      repeatPenalty: repeatPenalty,
      tools: tools,
      enableThinking: enableThinking,
      gpuDeviceKey: gpuDeviceKey,
      jinjaTemplate: jinjaTemplate,
      seed: seed,
      stop: stop,
      jsonSchema: jsonSchema,
      grammar: grammar,
      logger: (message) {
        logs.add(message);
        print('[llama.cpp] $message');
      },
    ),
    (result, openAiResponseJsonString, doneFlag, error) {
      events.add(
        _CallbackEvent(
          result: result,
          openAiResponseJsonString: openAiResponseJsonString,
          done: doneFlag,
          error: error,
        ),
      );
      if (doneFlag && !done.isCompleted) done.complete();
    },
  );

  await done.future.timeout(const Duration(minutes: 8));
  // Logs come on the same isolate, before the last callback.
  await Future<void>.delayed(Duration.zero);
  return _ChatRun(events, logs);
}

class _ChatRun {
  final List<_CallbackEvent> events;

  /// Log lines that reached the request's logger.
  final List<String> logs;

  const _ChatRun(this.events, [this.logs = const []]);

  /// timings.cache_n of the last chunk: prompt tokens reused from the cache.
  int? get cachedPromptTokens {
    for (final chunk in decodedJsonChunks.reversed) {
      final timings = chunk['timings'];
      if (timings is Map && timings['cache_n'] is int) {
        return timings['cache_n'] as int;
      }
    }
    return null;
  }

  String get output => events.last.result;

  fllama.FllamaError? get error => events.last.error;

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

  /// The tool calls in the streamed deltas, by index: name and arguments.
  List<String> get toolCalls {
    final calls = <int, StringBuffer>{};
    for (final chunk in decodedJsonChunks) {
      final choices = chunk['choices'];
      if (choices is! List) continue;
      for (final choice in choices) {
        if (choice is! Map) continue;
        final delta = choice['delta'];
        final toolCalls = delta is Map ? delta['tool_calls'] : null;
        if (toolCalls is! List) continue;
        for (final call in toolCalls) {
          if (call is! Map) continue;
          final buffer = calls.putIfAbsent(
            call['index'] as int? ?? 0,
            StringBuffer.new,
          );
          final function = call['function'];
          if (function is Map) {
            buffer.write(function['name'] ?? '');
            buffer.write(function['arguments'] ?? '');
          }
        }
      }
    }
    return [for (final buffer in calls.values) buffer.toString()];
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
  final fllama.FllamaError? error;

  const _CallbackEvent({
    required this.result,
    required this.openAiResponseJsonString,
    required this.done,
    this.error,
  });
}

// A 64x64 RGB PNG whose every pixel is #ff0000. Keeping it inline makes the
// multimodal integration input deterministic and avoids asset-bundle setup.
const _solidRedPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAS0lEQVR42u3PQQkA'
    'AAgAsetfWiP4FgYrsKZeS0BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA'
    'QEBAQEBAQEBAQEBAQEDgsqnc8OJg6Ln3AAAAAElFTkSuQmCC';
