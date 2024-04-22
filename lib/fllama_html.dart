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

@JS('fllamaInferenceJs')
external Future<int> fllamaInferenceJs(dynamic request, Function callback);

typedef FllamaInferenceCallback = void Function(String response, bool done);

// Keep in sync with fllama_inference_request.dart to pass correctly from Dart to JS
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
    String? eosToken,
    // INTENTIONALLY MISSING: logger
  });
}

/// Runs standard LLM inference. The future returns immediately after being
/// called. [callback] is called on each new output token with the response and
/// a boolean indicating whether the response is the final response.
///
/// This is *not* what most people want to use. LLMs post-ChatGPT use a chat
/// template and an EOS token. Use [fllamaChat] instead if you expect this
/// sort of interface, i.e. an OpenAI-like API.
Future<int> fllamaInference(FllamaInferenceRequest dartRequest,
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
    eosToken: dartRequest.eosToken,
  );

  final completer = Completer<int>();
  promiseToFuture(
      fllamaInferenceJs(jsRequest, allowInterop((String response, bool done) {
    callback(response, done);
  }))).then((value) {
    completer.complete(value);
  });
  return completer.future;
}

// Tokenize
@JS('fllamaTokenizeJs')
external Future<int> fllamaTokenizeJs(dynamic modelPath, dynamic input);

/// Returns the number of tokens in [request.input].
///
/// Useful for identifying what messages will be in context when the LLM is run.
Future<int> fllamaTokenize(FllamaTokenizeRequest request) async {
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
@JS('fllamaChatTemplateGetJs')
external Future<String> fllamaChatTemplateGetJs(dynamic modelPath);

/// Returns the chat template embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaSanitizeChatTemplate] for using sensible fallbacks for gguf
/// files that don't have a chat template or have incorrect chat templates.
Future<String> fllamaChatTemplateGet(String modelPath) async {
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaChatTemplateGetJs at ${DateTime.now()}');
    promiseToFuture(fllamaChatTemplateGetJs(modelPath)).then((value) {
      // print(
      // '[fllama_html] fllamaChatTemplateGetJs finished with $value at ${DateTime.now()}');
      completer.complete(value);
    });
    // print('[fllama_html] called fllamaChatTemplateGetJs at ${DateTime.now()}');
    return completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaChatTemplateGetJs caught error: $e');
    rethrow;
  }
}

@JS('fllamaBosTokenGetJs')
external Future<String> fllamaBosTokenGetJs(dynamic modelPath);

/// Returns the EOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaApplyChatTemplate] for using sensible fallbacks for gguf
/// files that don't have an EOS token or have incorrect EOS tokens.
Future<String> fllamaBosTokenGet(String modelPath) {
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaEosTokenGet at ${DateTime.now()}');
    promiseToFuture(fllamaBosTokenGetJs(modelPath)).then((value) {
      // print(
      // '[fllama_html] fllamaEosTokenGet finished with $value at ${DateTime.now()}');
      completer.complete(value);
    });
    // print('[fllama_html] called fllamaEosTokenGet at ${DateTime.now()}');
    return completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaBosTokenGet caught error: $e');
    rethrow;
  }
}

@JS('fllamaEosTokenGetJs')
external Future<String> fllamaEosTokenGetJs(dynamic modelPath);

/// Returns the EOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaApplyChatTemplate] for using sensible fallbacks for gguf
/// files that don't have an EOS token or have incorrect EOS tokens.
Future<String> fllamaEosTokenGet(String modelPath) {
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaEosTokenGet at ${DateTime.now()}');
    promiseToFuture(fllamaEosTokenGetJs(modelPath)).then((value) {
      // print(
      // '[fllama_html] fllamaEosTokenGet finished with $value at ${DateTime.now()}');
      completer.complete(value);
    });
    // print('[fllama_html] called fllamaEosTokenGet at ${DateTime.now()}');
    return completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaEosTokenGet caught error: $e');
    rethrow;
  }
}

@JS('fllamaCancelInferenceJs')
external void fllamaCancelInferenceJs(int requestId);

/// Cancels the inference with the given [requestId].
/// 
/// It is recommended you do _not_ update your state based on this.
/// Use the callbacks, like you would generally.
/// 
/// This is supported via:
/// - Inferences that have not yet started will call their callback with `done` set
///  to `true` and an empty string.
/// - Inferences that have started will call their callback with `done` set to
/// `true` and the final output of the inference.
void fllamaCancelInference(int requestId) {
  fllamaCancelInferenceJs(requestId);
}