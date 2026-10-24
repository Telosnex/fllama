import 'dart:async';
import 'dart:js_interop';
import 'dart:convert';

import 'package:fllama/fllama.dart';
import 'package:fllama/src/web_parallel_slots.dart';
import 'package:fllama/src/web_runtime_loader.dart';

export 'package:fllama/src/web_runtime_loader.dart' show FllamaWeb;

@JS('fllamaInferenceJs')
external JSPromise<JSNumber> fllamaInferenceJs(
  JSAny request,
  JSFunction callback,
);

Future<List<FllamaGpuMemoryInfo>> fllamaGpuMemoryInfoGetAll() async {
  return const [];
}

/// No GPU backends to allow or forbid on this platform.
bool fllamaSetGpuAllowed(bool allowed) => true;

/// No backend libraries on this platform.
Future<List<String>> fllamaLoadedBackendFiles() async => const [];

/// No GPU packs on this platform.
List<FllamaGpuPackFile> fllamaGpuPackFiles() => const [];

/// No GPU packs on this platform.
Future<String?> fllamaLoadGpuPack(String pack, String directory) async =>
    'This platform does not load GPU packs';

/// No Vulkan on this platform.
Future<bool> fllamaHasVulkanGpu() async => false;

/// On the web, model files are not on a file system that Dart can read.
int? fllamaTrainedContextLength(String modelPath) => null;

// Keep in sync with fllama_inference_request.dart to pass correctly from Dart to JS
extension type _JSFllamaInferenceRequest._(JSObject _) implements JSObject {
  external factory _JSFllamaInferenceRequest({
    required int contextSize,
    required String input,
    required int maxTokens,
    required String modelPath,
    String? modelMmprojPath,
    required int numGpuLayers,
    required int numThreads,
    double? temperature,
    double? penaltyFrequency,
    double? penaltyRepeat,
    double? topP,
    // INTENTIONALLY MISSING: logger
  });
}

/// Runs [FllamaInferenceRequest.openAiRequestJsonString] as a chat, if set,
/// as native fllama does. Else runs [FllamaInferenceRequest.input] as one
/// user message. Returns the request ID soon, for [fllamaCancelInference];
/// [callback] gets the results. See [FllamaInferenceCallback].
///
/// Most callers want [fllamaChat].
Future<int> fllamaInference(
  FllamaInferenceRequest dartRequest,
  FllamaInferenceCallback callback,
) async {
  await loadFllamaWebRuntime();
  final openAiRequestJsonString = dartRequest.openAiRequestJsonString;
  if (openAiRequestJsonString != null) {
    return _runWebChat(
      _JSFllamaWebInferenceRequest(
        openAiRequestJsonString: openAiRequestJsonString,
        messagesAsJsonString: '[]',
        toolsAsJsonString: '[]',
        maxTokens: dartRequest.maxTokens,
        modelPath: dartRequest.modelPath,
        modelMmprojPath: dartRequest.modelMmprojPath,
        contextSize: dartRequest.contextSize,
        nParallel: dartRequest.nParallel != null && dartRequest.nParallel! > 0
            ? dartRequest.nParallel
            : kFllamaWebDefaultParallelSlots,
        temperature: dartRequest.temperature,
        penaltyFrequency: dartRequest.penaltyFrequency,
        penaltyRepeat: dartRequest.penaltyRepeat,
        topP: dartRequest.topP,
      ),
      (_, _) {},
      callback,
    );
  }
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
  );

  final completer = Completer<int>();
  callbackFn(
    String response,
    String responseJson,
    bool done,
    String? errorJson,
  ) {
    callback(
      response,
      responseJson,
      done,
      errorJson == null ? null : FllamaError.fromJson(errorJson),
    );
  }

  fllamaInferenceJs(jsRequest, callbackFn.toJS).toDart.then((value) {
    completer.complete(value.toDartInt);
  });
  return completer.future;
}

// JSAny used to be void. JSVoid does not work.
@JS('fllamaWebModelDeleteJs')
external JSPromise<JSAny> fllamaWebModelDeleteJs(String modelPath);

@JS('fllamaWebIsModelDownloadedJs')
external JSPromise<JSBoolean> fllamaWebIsModelDownloadedJs(String modelPath);

@JS('fllamaWebPickModelJs')
external JSPromise<JSString> fllamaWebPickModelJs();

@JS('fllamaChatWebJs')
external JSPromise<JSNumber> fllamaChatWebJs(
  // ignore: library_private_types_in_public_api
  _JSFllamaWebInferenceRequest request,
  JSFunction loadCallback,
  JSFunction callback,
);

extension type _JSFllamaWebInferenceRequest._(JSObject _) implements JSObject {
  external _JSFllamaWebInferenceRequest({
    required String openAiRequestJsonString,
    required String messagesAsJsonString,
    required String toolsAsJsonString,
    required int maxTokens,
    required String modelPath,
    String? modelMmprojPath,
    required int contextSize,
    int? nParallel,
    double? temperature,
    double? penaltyFrequency,
    double? penaltyRepeat,
    double? topP,
  });
}

typedef FllamaWebLoadCallback =
    void Function(double downloadProgress, double loadProgress);

Future<bool> fllamaWebIsModelDownloaded(String modelPath) async {
  await loadFllamaWebRuntime();
  return fllamaWebIsModelDownloadedJs(modelPath).toDart.then((value) {
    return value.toDart;
  });
}

/// Pick a local GGUF in the browser and return an opaque modelPath token.
///
/// The selected File stays in JavaScript memory and is passed directly to
/// wllama. This avoids copying multi-GB GGUF bytes through Dart. Browsers do
/// not expose the full local filesystem path; the token may include the file
/// name for display only.
Future<String?> fllamaWebPickModel() async {
  await loadFllamaWebRuntime();
  final token = await fllamaWebPickModelJs().toDart.then((value) {
    return value.toDart;
  });
  return token.isEmpty ? null : token;
}

/// Run chat inference on web using wllama.
///
/// [OpenAiRequest.modelPath] should be a GGUF URL, a blob URL, or a token
/// returned by [fllamaWebPickModel].
Future<int> fllamaChatWeb(
  OpenAiRequest request,
  FllamaWebLoadCallback loadCallback,
  FllamaInferenceCallback callback,
) async {
  await loadFllamaWebRuntime();
  final messagesAsMaps = request.messages
      .map((e) => {'role': e.role.openAiName, 'content': e.text})
      .toList();
  final toolsAsMaps = request.tools
      .map(
        (e) => {
          'type': 'function',
          'function': {
            'name': e.name,
            'description': e.description,
            'parameters': e.jsonSchema,
          },
        },
      )
      .toList();
  final jsRequest = _JSFllamaWebInferenceRequest(
    openAiRequestJsonString: request.toJsonString(),
    toolsAsJsonString: jsonEncode(toolsAsMaps),
    messagesAsJsonString: jsonEncode(messagesAsMaps),
    maxTokens: request.maxTokens,
    modelPath: request.modelPath,
    modelMmprojPath: request.mmprojPath,
    contextSize: request.contextSize,
    nParallel: fllamaWebParallelSlots(request),
    temperature: request.temperature,
    penaltyFrequency: request.frequencyPenalty,
    penaltyRepeat: request.repeatPenalty,
    topP: request.topP,
  );
  return _runWebChat(jsRequest, loadCallback, callback);
}

Future<int> _runWebChat(
  _JSFllamaWebInferenceRequest jsRequest,
  FllamaWebLoadCallback loadCallback,
  FllamaInferenceCallback callback,
) {
  final completer = Completer<int>();
  firstCallback(double downloadProgress, double loadProgress) {
    loadCallback(downloadProgress, loadProgress);
  }

  secondCallback(
    String response,
    String responseJson,
    bool done,
    String? errorJson,
  ) {
    callback(
      response,
      responseJson,
      done,
      errorJson == null ? null : FllamaError.fromJson(errorJson),
    );
  }

  fllamaChatWebJs(
    jsRequest,
    firstCallback.toJS,
    secondCallback.toJS,
  ).toDart.then((value) {
    completer.complete(value.toDartInt);
  });
  return completer.future;
}

Future<void> fllamaWebModelDelete(String modelPath) async {
  await loadFllamaWebRuntime();
  await fllamaWebModelDeleteJs(modelPath).toDart;
}

// Tokenize
@JS('fllamaTokenizeJs')
external JSPromise<JSNumber> fllamaTokenizeJs(String modelPath, String input);

/// Returns the number of tokens in [request.input].
///
/// Useful for identifying what messages will be in context when the LLM is run.
Future<int> fllamaTokenize(FllamaTokenizeRequest request) async {
  await loadFllamaWebRuntime();
  try {
    final completer = Completer<int>();
    // print('[fllama_html] calling fllamaTokenizeJs at ${DateTime.now()}');

    fllamaTokenizeJs(request.modelPath, request.input).toDart.then((value) {
      // print(
      // '[fllama_html] fllamaTokenizeAsync finished with $value at ${DateTime.now()}');
      completer.complete(value.toDartInt);
    });
    // print('[fllama_html] called fllamaTokenizeJs at ${DateTime.now()}');
    return await completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaTokenizeAsync caught error: $e');
    rethrow;
  }
}

// Chat template
@JS('fllamaChatTemplateGetJs')
external JSPromise<JSString> fllamaChatTemplateGetJs(String modelPath);

/// Returns the chat template embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaSanitizeChatTemplate] for using sensible fallbacks for gguf
/// files that don't have a chat template or have incorrect chat templates.
Future<String> fllamaChatTemplateGet(String modelPath) async {
  await loadFllamaWebRuntime();
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaChatTemplateGetJs at ${DateTime.now()}');
    fllamaChatTemplateGetJs(modelPath).toDart.then((value) {
      // print(
      // '[fllama_html] fllamaChatTemplateGetJs finished with $value at ${DateTime.now()}');
      completer.complete(value.toDart);
    });
    // print('[fllama_html] called fllamaChatTemplateGetJs at ${DateTime.now()}');
    return await completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaChatTemplateGetJs caught error: $e');
    rethrow;
  }
}

@JS('fllamaBosTokenGetJs')
external JSPromise<JSString?> fllamaBosTokenGetJs(String modelPath);

/// Returns the EOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
Future<String> fllamaBosTokenGet(String modelPath) async {
  await loadFllamaWebRuntime();
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaEosTokenGet at ${DateTime.now()}');
    fllamaBosTokenGetJs(modelPath).toDart.then((value) {
      // print(
      // '[fllama_html] fllamaEosTokenGet finished with $value at ${DateTime.now()}');
      completer.complete(value?.toDart ?? '');
    });
    // print('[fllama_html] called fllamaEosTokenGet at ${DateTime.now()}');
    return await completer.future;
  } catch (e) {
    // ignore: avoid_print
    print('[fllama_html] fllamaBosTokenGet caught error: $e');
    rethrow;
  }
}

@JS('fllamaEosTokenGetJs')
external JSPromise<JSString> fllamaEosTokenGetJs(String modelPath);

/// Returns the EOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
Future<String> fllamaEosTokenGet(String modelPath) async {
  await loadFllamaWebRuntime();
  try {
    final completer = Completer<String>();
    // print('[fllama_html] calling fllamaEosTokenGet at ${DateTime.now()}');
    fllamaEosTokenGetJs(modelPath).toDart.then((value) {
      // print(
      // '[fllama_html] fllamaEosTokenGet finished with $value at ${DateTime.now()}');
      completer.complete(value.toDart);
    });
    // print('[fllama_html] called fllamaEosTokenGet at ${DateTime.now()}');
    return await completer.future;
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
/// The request then ends soon with its last callback: `done` set, the text
/// so far, and no error. A request that has not started ends with no text.
void fllamaCancelInference(int requestId) {
  // Before the runtime loads, no inference exists to cancel.
  if (!fllamaWebRuntimeLoaded) return;
  fllamaCancelInferenceJs(requestId);
}
