@TestOn('browser')
@Timeout(Duration(seconds: 90))
library;

import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';

import 'package:fllama/fllama.dart';
import 'package:fllama/src/web_runtime.g.dart';
import 'package:fllama/src/web_runtime_loader.dart';
import 'package:test/test.dart';

/// The fllama web runtime on the files in lib/web/ (native_prebuilt ADR 002
/// D13). Install the generated files first:
/// `dart run native_prebuilt:web install-dev`.
///
/// The model is stories15M-q4_0.gguf from ggml-org/models, in
/// test/web_models/ (not in git; the release workflow downloads it).
void main() {
  final model = Uri.base.resolve('web_models/stories15M-q4_0.gguf').toString();
  setUpAll(() {
    FllamaWeb.runtimeUri = Uri.parse('packages/fllama/web/');
    // The test runner loads more files than the default buffer of 250
    // resource entries holds. Start with an empty, larger buffer.
    _clearResourceTimings();
    _setResourceTimingBufferSize(10000);
  });

  test('the init URL has the webVersion query', () {
    expect(
      fllamaWebInitUrl(baseUri: 'https://a.b/app/x.html').toString(),
      'https://a.b/app/packages/fllama/web/fllama_web_init.js'
      '?v=$webRuntimeVersion',
    );
  });

  test('fllamaTokenize estimates 1 token for each 4 characters', () async {
    final count = await fllamaTokenize(
      FllamaTokenizeRequest(input: 'Once upon a time', modelPath: model),
    );
    expect(count, 4);
  });

  // Audit item 2: fllamaChat on web sent `input` ('') and dropped the
  // conversation in openAiRequestJsonString.
  test('fllamaChat sends the conversation to the model', () async {
    final message = List.filled(
      5,
      'Lily went to the park with her dog and saw a big red ball.',
    ).join(' ');
    final done = Completer<int>();
    await fllamaChat(
      OpenAiRequest(
        modelPath: model,
        maxTokens: 4,
        messages: [Message(Role.user, message)],
      ),
      (response, responseJson, isDone, error) {
        if (error != null && !done.isCompleted) done.completeError(error);
        if (responseJson.isEmpty || done.isCompleted) return;
        final timings = (jsonDecode(responseJson) as Map)['timings'];
        if (timings is Map && timings['prompt_n'] is int) {
          done.complete(timings['prompt_n'] as int);
        }
      },
    );
    // The message alone is about 75 tokens; the template around an empty
    // message is 28. stories15M has a context of 128 tokens.
    expect(await done.future, greaterThan(70));
  });

  // Full audit: a cancel ends with done and no error, as on native.
  test('a cancelled chat ends with no error', () async {
    final done = Completer<FllamaError?>();
    late int requestId;
    var cancelled = false;
    requestId = await fllamaChat(
      OpenAiRequest(
        modelPath: model,
        maxTokens: 100,
        messages: [Message(Role.user, 'Once upon a time')],
      ),
      (response, responseJson, isDone, error) {
        if (isDone) {
          if (!done.isCompleted) done.complete(error);
          return;
        }
        if (!cancelled && response.isNotEmpty) {
          cancelled = true;
          fllamaCancelInference(requestId);
        }
      },
    );
    expect(await done.future, isNull);
    expect(cancelled, isTrue);
  });

  // Audit item 4: wllama parses requests as llama-server does.
  test('a grammar constrains the reply', () async {
    final done = Completer<String>();
    await fllamaChat(
      OpenAiRequest(
        modelPath: model,
        maxTokens: 8,
        messages: [Message(Role.user, 'Once upon a time')],
        grammar: 'root ::= "yes" | "no"',
      ),
      (response, responseJson, isDone, error) {
        if (!isDone || done.isCompleted) return;
        error == null ? done.complete(response) : done.completeError(error);
      },
    );
    expect(await done.future, anyOf('yes', 'no'));
  });

  // Audit item 8: the picker waited forever when the user closed it.
  test('fllamaWebPickModel returns null when the user cancels', () async {
    await loadFllamaWebRuntime();
    _eval('''
      (() => {
        const click = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function () {
          HTMLInputElement.prototype.click = click;
          setTimeout(() => this.dispatchEvent(new Event('cancel')), 0);
        };
      })()
    ''');
    expect(
      await fllamaWebPickModel().timeout(const Duration(seconds: 5)),
      isNull,
    );
  });

  // ADR 002 D7, I3.
  test('the runtime files load with the webVersion query', () async {
    await loadFllamaWebRuntime();
    final loaded = [
      for (final entry in _resourceEntries().toDart)
        Uri.parse((entry as _Entry).name),
    ].where((u) => u.path.contains('/packages/fllama/web/'));
    expect(loaded.map((u) => u.path.split('/web/').last).toSet(), {
      'fllama_web_init.js',
      'wllama/index.js',
    });
    for (final url in loaded) {
      expect(url.queryParameters['v'], webRuntimeVersion, reason: '$url');
    }
  });
}

@JS('eval')
external void _eval(String source);

@JS('performance.clearResourceTimings')
external void _clearResourceTimings();

@JS('performance.setResourceTimingBufferSize')
external void _setResourceTimingBufferSize(int size);

@JS('performance.getEntriesByType')
external JSArray<JSObject> _entries(String type);

JSArray<JSObject> _resourceEntries() => _entries('resource');

extension type _Entry._(JSObject _) implements JSObject {
  external String get name;
}
