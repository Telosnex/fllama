// ignore_for_file: avoid_print

import 'package:fllama/fllama.dart';

@JS()
import 'package:js/js.dart';

@JS('fllamaInferenceAsyncJs')
external Future<String> fllamaInferenceAsyncJs(
    dynamic request, Function callback);

typedef FllamaInferenceCallback = void Function(String response, bool done);

// Keep in sync with fllama_inference_request.dart to pass correctly from Dart to JS
// Keep in sync with llama-app.js to pass correctly from JS to WASM
@JS()
@anonymous
class JSFllamaInferenceRequest {
  external factory JSFllamaInferenceRequest({
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

Future<String> fllamaInferenceAsync(FllamaInferenceRequest dartRequest,
    FllamaInferenceCallback callback) async {
  final jsRequest = JSFllamaInferenceRequest(
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
  print(
      '[fllama_html] calling fllamaInferenceAsyncJs with JSified request: $jsRequest');

  fllamaInferenceAsyncJs(jsRequest, allowInterop((String response, bool done) {
    callback(response, done);
  }));
  return '';
}


