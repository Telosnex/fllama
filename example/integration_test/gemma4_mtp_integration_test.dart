// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:fllama/fllama.dart' as fllama;
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path_provider/path_provider.dart';

import 'test/initialize.dart';

void main() {
  if (kIsWeb) {
    print('Skipping Gemma 4 MTP integration test on web');
    return;
  }

  const skipPlatforms = {
    TargetPlatform.android,
    TargetPlatform.iOS,
    TargetPlatform.windows,
  };
  if (skipPlatforms.contains(defaultTargetPlatform)) {
    print('Skipping Gemma 4 MTP integration test on $defaultTargetPlatform');
    return;
  }

  group('Gemma 4 MTP integration', () {
    late File targetModelFile;
    late File draftModelFile;
    late bool hasModels;

    setUpAll(() async {
      prepareAllowNetworkRequests();
      prepareTestBindings();
      await preparePathProviderAsync();

      final sourceTargetModelFile = File(
        Platform.environment['GEMMA4_12B_MODEL_PATH'] ??
            '/Users/jpo/Documents/Telosnex/models/gemma-4-12b-it-qat-q4_0.gguf',
      );
      final sourceDraftModelFile = File(
        Platform.environment['GEMMA4_12B_DRAFT_MODEL_PATH'] ??
            '/Users/jpo/Documents/Telosnex/models/gemma-4-12B-it-qat-q4_0-assistant-f16.gguf',
      );
      hasModels = await sourceTargetModelFile.exists() &&
          await sourceDraftModelFile.exists();

      print(
          '[gemma4 mtp test] source target: ${sourceTargetModelFile.absolute.path}');
      print(
          '[gemma4 mtp test] source draft:  ${sourceDraftModelFile.absolute.path}');
      if (hasModels) {
        targetModelFile = await _stageForSandbox(sourceTargetModelFile);
        draftModelFile = await _stageForSandbox(sourceDraftModelFile);
        print(
            '[gemma4 mtp test] staged target: ${targetModelFile.absolute.path}');
        print(
            '[gemma4 mtp test] staged draft:  ${draftModelFile.absolute.path}');
      }
      if (!hasModels) {
        print(
          '[gemma4 mtp test] skipping: local 12B target/drafter files are not present. '
          'Set GEMMA4_12B_MODEL_PATH and GEMMA4_12B_DRAFT_MODEL_PATH to run.',
        );
      }
    });

    test(
      'raw completion-style inference draftNMax=12 proves native MTP plumbing',
      () async {
        if (!hasModels) return;

        final baseline = await _runGemmaInference(
          label: 'raw baseline',
          modelPath: targetModelFile.absolute.path,
        );
        final mtp = await _runGemmaInference(
          label: 'raw mtp12',
          modelPath: targetModelFile.absolute.path,
          draftModelPath: draftModelFile.absolute.path,
          draftNMax: 12,
        );

        print('[gemma4 mtp test] raw baseline: ${baseline.summary}');
        print('[gemma4 mtp test] raw mtp12:    ${mtp.summary}');

        expect(baseline.predictedPerSecond, greaterThan(0));
        expect(mtp.predictedPerSecond, greaterThan(0));
        expect(mtp.draftN, greaterThan(0));
        expect(mtp.draftAccepted, greaterThan(0));
        expect(mtp.acceptanceRatio, greaterThan(0.60));

        final minSpeedup = double.tryParse(
              Platform.environment['GEMMA4_MTP_MIN_SPEEDUP'] ?? '',
            ) ??
            1.40;
        expect(
          mtp.predictedPerSecond / baseline.predictedPerSecond,
          greaterThan(minSpeedup),
          reason:
              'Raw fllamaInference should mirror llama-server /completion and '
              'show the native Gemma 4 MTP plumbing works. This is not a '
              'product/chat benchmark; the raw prompt is not Gemma chat-formatted.',
        );
      },
      timeout: const Timeout(Duration(minutes: 25)),
    );

    test(
      'chat path documents 2026-06-08 M4 Max Gemma 4 12B MTP state',
      () async {
        if (!hasModels) return;

        print(_knownStateHeader);
        for (final scenario in _knownStateScenarios) {
          final baseline = await _runGemmaChat(
            label: '${scenario.name} baseline',
            modelPath: targetModelFile.absolute.path,
            prompt: scenario.prompt,
            maxTokens: scenario.maxTokens,
          );
          final mtp = await _runGemmaChat(
            label: '${scenario.name} mtp12 p99',
            modelPath: targetModelFile.absolute.path,
            draftModelPath: draftModelFile.absolute.path,
            draftNMax: _knownDraftNMax,
            draftPMin: _knownDraftPMin,
            prompt: scenario.prompt,
            maxTokens: scenario.maxTokens,
          );

          final speedup = mtp.predictedPerSecond / baseline.predictedPerSecond;
          print('[gemma4 mtp known state] ${scenario.name}: '
              '${scenario.expectedState}');
          print('[gemma4 mtp known state] ${scenario.name} baseline: '
              '${baseline.summary}');
          print('[gemma4 mtp known state] ${scenario.name} mtp12 p99: '
              '${mtp.summary}, speedup=${speedup.toStringAsFixed(2)}x, '
              'accepted_per_output=${mtp.acceptedPerOutputToken.toStringAsFixed(2)}');

          if (baseline.predictedPerSecond <= 0 || mtp.predictedPerSecond <= 0) {
            print('[gemma4 mtp test] ${scenario.name} baseline output: '
                '${baseline.outputSnippet}');
            print('[gemma4 mtp test] ${scenario.name} mtp12 output: '
                '${mtp.outputSnippet}');
            print('[gemma4 mtp test] ${scenario.name} baseline json: '
                '${baseline.jsonSnippet}');
            print('[gemma4 mtp test] ${scenario.name} mtp12 json: '
                '${mtp.jsonSnippet}');
          }

          expect(baseline.predictedPerSecond, greaterThan(0));
          expect(mtp.predictedPerSecond, greaterThan(0));
          expect(mtp.draftN, greaterThan(0));
          expect(mtp.draftAccepted, greaterThan(0));
          expect(
            mtp.acceptanceRatio,
            greaterThanOrEqualTo(scenario.minAcceptanceRatio),
            reason: '${scenario.name}: ${scenario.expectedState}',
          );
          expect(
            speedup,
            greaterThanOrEqualTo(scenario.minSpeedup),
            reason: '${scenario.name}: ${scenario.expectedState}',
          );
          expect(
            speedup,
            lessThanOrEqualTo(scenario.maxSpeedup),
            reason: '${scenario.name}: ${scenario.expectedState}',
          );
        }
      },
      timeout: const Timeout(Duration(minutes: 30)),
    );
  });
}

const _knownStateDate = '2026-06-08';
const _knownHardware = 'MacBook Pro M4 Max';
const _knownTargetModel = 'gemma-4-12b-it-qat-q4_0.gguf';
const _knownDraftModel = 'gemma-4-12B-it-qat-q4_0-assistant-f16.gguf';
const _knownDraftNMax = 12;
const _knownDraftPMin = 0.99;
const _knownContextSize = 16000;
const _knownTemperature = 0.0;
const _knownTopP = 1.0;
const _knownPresencePenalty = 1.1;

const _knownStateHeader = '[gemma4 mtp known state] date=$_knownStateDate, '
    'hardware=$_knownHardware, target=$_knownTargetModel, '
    'draft=$_knownDraftModel, endpoint=fllamaChat/OpenAI chat, '
    'context=$_knownContextSize, temp=$_knownTemperature, top_p=$_knownTopP, '
    'presence_penalty=$_knownPresencePenalty, '
    'draft_n_max=$_knownDraftNMax, draft_p_min=$_knownDraftPMin';

const _knownStateScenarios = [
  _GemmaMtpKnownStateScenario(
    name: 'math',
    prompt: 'What is 1048576^0.05',
    maxTokens: 100,
    minSpeedup: 1.15,
    maxSpeedup: 1.60,
    minAcceptanceRatio: 0.80,
    expectedState:
        'short deterministic reasoning: MTP should still be materially faster '
        'with p_min=0.99',
  ),
  _GemmaMtpKnownStateScenario(
    name: 'eggs-story',
    prompt: 'Write a fun story about eggs and Palpatine',
    maxTokens: 100,
    minSpeedup: 0.88,
    maxSpeedup: 1.18,
    minAcceptanceRatio: 0.75,
    expectedState:
        'creative/story prompt: p_min=0.99 gates low-confidence drafts; '
        'expect near-baseline, not a reliable speedup',
  ),
  _GemmaMtpKnownStateScenario(
    name: 'quicksort-instruction',
    prompt: 'Write a detailed step-by-step explanation of how the quicksort '
        'algorithm works, including its time complexity and a Python '
        'implementation.',
    maxTokens: 100,
    minSpeedup: 0.88,
    maxSpeedup: 1.18,
    minAcceptanceRatio: 0.75,
    expectedState:
        'long instruction/code-ish prompt: p_min=0.99 should prevent the '
        'n_max=12 over-drafting regression; expect roughly baseline',
  ),
];

String get _prompt =>
    Platform.environment['GEMMA4_MTP_TEST_PROMPT'] ??
    _knownStateScenarios.last.prompt;

int get _maxTokens =>
    int.tryParse(Platform.environment['GEMMA4_MTP_TEST_MAX_TOKENS'] ?? '') ??
    300;

double get _draftPMin =>
    double.tryParse(
        Platform.environment['GEMMA4_MTP_TEST_DRAFT_P_MIN'] ?? '') ??
    _knownDraftPMin;

class _GemmaMtpKnownStateScenario {
  final String name;
  final String prompt;
  final int maxTokens;
  final double minSpeedup;
  final double maxSpeedup;
  final double minAcceptanceRatio;
  final String expectedState;

  const _GemmaMtpKnownStateScenario({
    required this.name,
    required this.prompt,
    required this.maxTokens,
    required this.minSpeedup,
    required this.maxSpeedup,
    required this.minAcceptanceRatio,
    required this.expectedState,
  });
}

void _logLlamaCpp(String message) {
  print('[gemma4 mtp test llama.cpp] $message');
}

Future<File> _stageForSandbox(File source) async {
  final documents = await getApplicationDocumentsDirectory();
  final stagingDir =
      Directory('${documents.path}/fllama_gemma4_mtp_test_models');
  await stagingDir.create(recursive: true);
  final staged = File('${stagingDir.path}/${source.uri.pathSegments.last}');
  if (await staged.exists() && await staged.length() == await source.length()) {
    return staged;
  }
  if (await staged.exists()) await staged.delete();

  // Try a hard link first so local runs do not duplicate ~7GB of model files.
  // If the sandbox or filesystem rejects it, fall back to a normal copy.
  final ln =
      await Process.run('ln', [source.absolute.path, staged.absolute.path]);
  if (ln.exitCode == 0 && await staged.exists()) return staged;

  print(
    '[gemma4 mtp test] hard-link failed (${ln.exitCode}); copying ${source.path}...',
  );
  return source.copy(staged.path);
}

Future<_GemmaMtpRun> _runGemmaInference({
  required String label,
  required String modelPath,
  String? draftModelPath,
  int? draftNMax,
}) async {
  final callbacks = <_FllamaCallbackEvent>[];
  final done = Completer<void>();

  await fllama.fllamaInference(
    fllama.FllamaInferenceRequest(
      modelPath: modelPath,
      draftModelPath: draftModelPath,
      draftNMax: draftNMax,
      draftPMin: draftModelPath == null ? null : _draftPMin,
      input: _prompt,
      contextSize: int.tryParse(
            Platform.environment['GEMMA4_MTP_TEST_CONTEXT_SIZE'] ?? '',
          ) ??
          16000,
      maxTokens: _maxTokens,
      numGpuLayers: int.tryParse(
            Platform.environment['FLLAMA_TEST_NUM_GPU_LAYERS'] ?? '',
          ) ??
          99,
      temperature: 0,
      topP: 1.0,
      penaltyFrequency: 0.0,
      penaltyRepeat: 1.1,
      logger: _logLlamaCpp,
    ),
    (result, responseJson, doneFlag) {
      callbacks.add(
        _FllamaCallbackEvent(
          result: result,
          openAiResponseJsonString: responseJson,
          done: doneFlag,
        ),
      );
      if (doneFlag && !done.isCompleted) done.complete();
    },
  );

  await done.future.timeout(const Duration(minutes: 20));
  return _GemmaMtpRun.fromCallbacks(label, callbacks);
}

Future<_GemmaMtpRun> _runGemmaChat({
  required String label,
  required String modelPath,
  String? draftModelPath,
  int? draftNMax,
  double? draftPMin,
  String? prompt,
  int? maxTokens,
}) async {
  final callbacks = <_FllamaCallbackEvent>[];
  final done = Completer<void>();

  await fllama.fllamaChat(
    fllama.OpenAiRequest(
      modelPath: modelPath,
      draftModelPath: draftModelPath,
      draftNMax: draftNMax,
      draftPMin: draftModelPath == null ? null : (draftPMin ?? _draftPMin),
      messages: [fllama.Message(fllama.Role.user, prompt ?? _prompt)],
      contextSize: int.tryParse(
            Platform.environment['GEMMA4_MTP_TEST_CONTEXT_SIZE'] ?? '',
          ) ??
          16000,
      maxTokens: maxTokens ?? _maxTokens,
      numGpuLayers: int.tryParse(
            Platform.environment['FLLAMA_TEST_NUM_GPU_LAYERS'] ?? '',
          ) ??
          99,
      temperature: 0,
      topP: 1.0,
      frequencyPenalty: 0.0,
      // Mirrors the example app's OpenAI presence_penalty setting.
      presencePenalty: 1.1,
      logger: _logLlamaCpp,
    ),
    (result, openAiResponseJsonString, doneFlag) {
      callbacks.add(
        _FllamaCallbackEvent(
          result: result,
          openAiResponseJsonString: openAiResponseJsonString,
          done: doneFlag,
        ),
      );
      if (doneFlag && !done.isCompleted) done.complete();
    },
  );

  await done.future.timeout(const Duration(minutes: 20));
  return _GemmaMtpRun.fromCallbacks(label, callbacks);
}

class _GemmaMtpRun {
  final String label;
  final double predictedPerSecond;
  final int predictedN;
  final int draftN;
  final int draftAccepted;
  final int callbackCount;
  final int outputCharacters;
  final String outputSnippet;
  final String jsonSnippet;

  const _GemmaMtpRun({
    required this.label,
    required this.predictedPerSecond,
    required this.predictedN,
    required this.draftN,
    required this.draftAccepted,
    required this.callbackCount,
    required this.outputCharacters,
    required this.outputSnippet,
    required this.jsonSnippet,
  });

  double get acceptanceRatio => draftN <= 0 ? 0 : draftAccepted / draftN;
  double get acceptedPerOutputToken =>
      predictedN <= 0 ? 0 : draftAccepted / predictedN;

  String get summary =>
      'predicted=${predictedPerSecond.toStringAsFixed(1)} t/s, '
      'predicted_n=$predictedN, '
      'draft=$draftAccepted/$draftN '
      '(${(acceptanceRatio * 100).toStringAsFixed(0)}%), '
      'callbacks=$callbackCount, output_chars=$outputCharacters';

  factory _GemmaMtpRun.fromCallbacks(
    String label,
    List<_FllamaCallbackEvent> callbacks,
  ) {
    final timings = <String, dynamic>{};
    final output = StringBuffer();

    for (final callback in callbacks) {
      output.write(callback.result);
      final jsonString = callback.openAiResponseJsonString;
      if (jsonString.isEmpty) continue;
      dynamic decoded;
      try {
        decoded = jsonDecode(jsonString);
      } catch (error) {
        print(
            '[gemma4 mtp test $label] failed to decode callback JSON: $error');
        print('[gemma4 mtp test $label] JSON: $jsonString');
        continue;
      }
      final chunks = decoded is List ? decoded : [decoded];
      for (final chunk in chunks) {
        if (chunk is! Map) continue;
        _mergeTimings(timings, chunk['timings']);
        final usage = chunk['usage'];
        if (usage is Map) _mergeTimings(timings, usage['timings']);
      }
    }

    return _GemmaMtpRun(
      label: label,
      predictedPerSecond: _asDouble(timings['predicted_per_second']),
      predictedN: _asInt(timings['predicted_n']),
      draftN: _asInt(timings['draft_n']),
      draftAccepted: _asInt(timings['draft_n_accepted']),
      callbackCount: callbacks.length,
      outputCharacters: output.length,
      outputSnippet: output.toString().replaceAll('\n', r'\n'),
      jsonSnippet: callbacks
          .map((callback) => callback.openAiResponseJsonString)
          .where((json) => json.isNotEmpty)
          .join('\n')
          .replaceAll('\n', r'\n'),
    );
  }
}

void _mergeTimings(Map<String, dynamic> timings, dynamic value) {
  if (value is Map) timings.addAll(Map<String, dynamic>.from(value));
}

double _asDouble(dynamic value) => value is num ? value.toDouble() : 0;
int _asInt(dynamic value) => value is num ? value.toInt() : 0;

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
