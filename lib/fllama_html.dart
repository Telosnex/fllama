import 'dart:async';

import 'package:fllama/fllama.dart';

@JS()
import 'package:js/js.dart';
import 'package:js/js_util.dart';

@JS()
class Promise<T> {
  external Promise(
      void Function(void Function(T result) resolve, Function reject) executor);
  external Promise then(void Function(T result) onFulfilled,
      [Function onRejected]);
}

@JS('fllamaInferenceAsyncJs')
external Future<void> fllamaInferenceAsyncJs(
    dynamic request, Function callback);

typedef FllamaInferenceCallback = void Function(String response, bool done);

// Keep in sync with fllama_inference_request.dart to pass correctly from Dart to JS
// Keep in sync with llama-app.js to pass correctly from JS to WASM
@JS()
@anonymous
class _JSFllamaInferenceRequest {
  external factory _JSFllamaInferenceRequest({
    required int contextSize,
    required String input,
    required int maxTokens,
    required String modelPath,
    String? modelMmprojPath,
    required int numGpuLayers,
    required int numThreads,
    required double temperature,
    required double penaltyFrequency,
    required double penaltyRepeat,
    required double topP,
    String? grammar,
    // MISSING: grammar, logger
  });
}

Future<void> fllamaInferenceAsync(FllamaInferenceRequest dartRequest,
    FllamaInferenceCallback callback) async {
  final jsRequest = _JSFllamaInferenceRequest(
    contextSize: dartRequest.contextSize,
    input: dartRequest.input,
    maxTokens: dartRequest.maxTokens,
    modelPath: dartRequest.modelPath,
    modelMmprojPath: dartRequest.modelMmprojPath,
    numGpuLayers: dartRequest.numGpuLayers,
    numThreads: dartRequest.numThreads,
    temperature: dartRequest.temperature,
    penaltyFrequency: dartRequest.penaltyFrequency,
    penaltyRepeat: dartRequest.penaltyRepeat,
    topP: dartRequest.topP,
    grammar: dartRequest.grammar,
  );

  fllamaInferenceAsyncJs(jsRequest, allowInterop((String response, bool done) {
    callback(response, done);
  }));
}

// Tokenize
@JS('fllamaTokenizeJs')
external Future<int> fllamaTokenizeJs(dynamic modelPath, dynamic input);
Future<int> fllamaTokenizeAsync(FllamaTokenizeRequest request) async {
  try {
    final completer = Completer<int>();
    // print('[fllama_html] calling fllamaTokenizeJs at ${DateTime.now()}');

    promiseToFuture(fllamaTokenizeJs(request.modelPath, request.input))
        .then((value) {
      // print(
          // '[fllama_html] fllamaTokenizeAsync finished with $value at ${DateTime.now()}');
      completer.complete(value);
    });
    // print('[fllama_html] called fllamaTokenizeJs at ${DateTime.now()}');
    return completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaTokenizeAsync caught error: $e');
    rethrow;
  }
}

// Chat template
@JS('fllamaGetChatTemplateJs')
external Future<String> fllamaGetChatTemplateJs(dynamic modelPath);
Future<String> fllamaGetChatTemplate(String modelPath) async {
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaGetChatTemplateJs at ${DateTime.now()}');
    promiseToFuture(fllamaGetChatTemplateJs(modelPath)).then((value) {
      // print(
          // '[fllama_html] fllamaGetChatTemplateJs finished with $value at ${DateTime.now()}');
      completer.complete(value);
    });
    // print('[fllama_html] called fllamaGetChatTemplateJs at ${DateTime.now()}');
    return completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaGetChatTemplateJs caught error: $e');
    rethrow;
  }
}

@JS('fllamaGetEosTokenJs')
external Future<String> fllamaGetEosTokenJs(dynamic modelPath);
Future<String> fllamaGetEosToken(String modelPath) {
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaGetEosTokenJs at ${DateTime.now()}');
    promiseToFuture(fllamaGetEosTokenJs(modelPath)).then((value) {
      // print(
          // '[fllama_html] fllamaGetEosTokenJs finished with $value at ${DateTime.now()}');
      completer.complete(value);
    });
    // print('[fllama_html] called fllamaGetEosTokenJs at ${DateTime.now()}');
    return completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaGetEosTokenJs caught error: $e');
    rethrow;
  }
}
