import 'dart:async';
import 'dart:convert';
import 'dart:ffi';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama_cpp/fllama_io.dart';
import 'package:fllama_cpp/fllama_universal.dart';
import 'package:fllama_cpp/io/fllama_bindings_generated.dart';
import 'package:fllama_cpp/io/fllama_io_isolate.dart';

typedef NativeInferenceCallback =
    Void Function(
      Pointer<Char> response,
      Pointer<Char> openaiResponseJsonString,
      Pointer<Char> errorJson,
      Uint8 done,
    );
typedef NativeFllamaInferenceCallback =
    Pointer<NativeFunction<NativeInferenceCallback>>;
typedef FllamaLogCallbackNative = Void Function(Pointer<Char>);
typedef FllamaLogCallbackDart = void Function(Pointer<Char>);

/// Runs plain completion of [FllamaInferenceRequest.input], with no chat
/// template. Returns the request ID soon, for [fllamaCancelInference];
/// [callback] gets the results. See [FllamaInferenceCallback].
///
/// Most callers want [fllamaChat], which applies the chat template.
Future<int> fllamaInference(
  FllamaInferenceRequest request,
  FllamaInferenceCallback callback,
) async {
  final SendPort helperIsolateSendPort = await _getHelperIsolateSendPort();
  // Native gives the ID: a per-isolate counter would repeat in another
  // isolate, or after a hot restart, while native still runs the request.
  final int requestId = fllamaBindings.fllama_new_request_id();
  // The logger stays on this isolate: a closure can capture state that
  // cannot be sent to another isolate. Log lines come back as messages.
  final _IsolateInferenceRequest isolateRequest = _IsolateInferenceRequest(
    requestId,
    _withoutLogger(request),
    hasLogger: request.logger != null,
  );
  _isolateInferenceCallbacks[requestId] = callback;

  // Store the logger callback so we can call it when we get messages from the isolate
  if (request.logger != null) {
    _loggerCallbacks[requestId] = request.logger;
  }
  try {
    helperIsolateSendPort.send(isolateRequest);
  } catch (error, stackTrace) {
    _isolateInferenceCallbacks.remove(requestId);
    _loggerCallbacks.remove(requestId);
    Error.throwWithStackTrace(
      StateError(
        'Could not send inference request $requestId to the fllama helper '
        'isolate: $error',
      ),
      stackTrace,
    );
  }
  return requestId;
}

class _IsolateInferenceRequest {
  final int id;
  final FllamaInferenceRequest request;
  final bool hasLogger;

  const _IsolateInferenceRequest(
    this.id,
    this.request, {
    required this.hasLogger,
  });
}

FllamaInferenceRequest _withoutLogger(FllamaInferenceRequest r) =>
    FllamaInferenceRequest(
      contextSize: r.contextSize,
      input: r.input,
      maxTokens: r.maxTokens,
      modelPath: r.modelPath,
      modelMmprojPath: r.modelMmprojPath,
      openAiRequestJsonString: r.openAiRequestJsonString,
      numGpuLayers: r.numGpuLayers,
      numThreads: r.numThreads,
      temperature: r.temperature,
      penaltyFrequency: r.penaltyFrequency,
      penaltyRepeat: r.penaltyRepeat,
      topP: r.topP,
      draftModelPath: r.draftModelPath,
      draftNMax: r.draftNMax,
      draftPMin: r.draftPMin,
      gpuDeviceKey: r.gpuDeviceKey,
    );

class _IsolateInferenceCancel {
  final int id;

  const _IsolateInferenceCancel(this.id);
}

class _IsolateLogMessage {
  final int id; // Request ID to know which logger to call
  final String message;

  const _IsolateLogMessage(this.id, this.message);
}

class _IsolateInferenceResponse {
  final int id;
  final String response;
  final String openaiResponseJsonString;
  final bool done;

  /// The error JSON of the last response, if the request failed.
  final String? errorJson;

  const _IsolateInferenceResponse({
    required this.id,
    required this.response,
    required this.openaiResponseJsonString,
    required this.done,
    this.errorJson,
  });
}

/// Mapping from [_IsolateInferenceRequest] `id`s to the callbacks that are
/// run when each token is generated.
final Map<int, FllamaInferenceCallback> _isolateInferenceCallbacks =
    <int, FllamaInferenceCallback>{};

/// Mapping from request IDs to the original logger callbacks
final Map<int, void Function(String)?> _loggerCallbacks =
    <int, void Function(String)?>{};

Pointer<fllama_inference_request> _toNative(
  FllamaInferenceRequest dart,
  int requestId, {
  required NativeCallable<FllamaLogCallbackNative>? logger,
}) {
  // Allocate memory for the request structure.
  final Pointer<fllama_inference_request> requestPointer =
      calloc<fllama_inference_request>();
  final fllama_inference_request request = requestPointer.ref;

  request.request_id = requestId;
  request.context_size = dart.contextSize;
  request.max_tokens = dart.maxTokens;
  request.num_gpu_layers = dart.numGpuLayers;
  request.num_threads = dart.numThreads;
  // NaN means not set: native uses the model's recommended value.
  request.temperature = dart.temperature ?? double.nan;
  request.top_p = dart.topP ?? double.nan;
  request.penalty_freq = dart.penaltyFrequency ?? double.nan;
  request.penalty_repeat = dart.penaltyRepeat ?? double.nan;

  // Convert the Dart string to a C string (null-terminated).
  Pointer<Utf8> inputCstr = dart.input.toNativeUtf8();
  Pointer<Utf8> modelPathCstr = dart.modelPath.toNativeUtf8();
  request.input = inputCstr.cast<Char>();
  request.model_path = modelPathCstr.cast<Char>();
  if (dart.modelMmprojPath != null &&
      dart.modelMmprojPath?.isNotEmpty == true) {
    Pointer<Utf8> mmprojPathCstr = dart.modelMmprojPath!.toNativeUtf8();
    request.model_mmproj_path = mmprojPathCstr.cast<Char>();
  }
  if (dart.openAiRequestJsonString != null &&
      dart.openAiRequestJsonString?.isNotEmpty == true) {
    Pointer<Utf8> openAiRequestJsonStringCstr = dart.openAiRequestJsonString!
        .toNativeUtf8();
    request.openai_request_json_string = openAiRequestJsonStringCstr
        .cast<Char>();
  }
  if (dart.draftModelPath != null && dart.draftModelPath?.isNotEmpty == true) {
    Pointer<Utf8> draftModelPathCstr = dart.draftModelPath!.toNativeUtf8();
    request.draft_model_path = draftModelPathCstr.cast<Char>();
    request.draft_n_max = dart.draftNMax ?? 0;
    request.draft_p_min = dart.draftPMin ?? -1;
  }
  if (dart.gpuDeviceKey != null && dart.gpuDeviceKey!.isNotEmpty) {
    request.gpu_device_key = dart.gpuDeviceKey!.toNativeUtf8().cast<Char>();
  }
  if (logger != null) {
    request.dart_logger = logger.nativeFunction;
  }
  return requestPointer;
}

/// The SendPort belonging to the current helper isolate.
Future<SendPort>? _helperIsolateSendPort;

Future<SendPort> _getHelperIsolateSendPort() async {
  final existing = _helperIsolateSendPort;
  if (existing != null) return existing;

  late final Future<SendPort> startup;
  startup = startFllamaHelperIsolate(
    debugName: 'fllama inference',
    entryPoint: _fllamaInferenceIsolate,
    onMessage: _handleInferenceIsolateMessage,
    onTerminated: (error, stackTrace) {
      if (identical(_helperIsolateSendPort, startup)) {
        _helperIsolateSendPort = null;
      }
      _failPendingInferenceRequests(error, stackTrace);
    },
  );
  _helperIsolateSendPort = startup;

  try {
    return await startup;
  } catch (_) {
    if (identical(_helperIsolateSendPort, startup)) {
      _helperIsolateSendPort = null;
    }
    rethrow;
  }
}

void _handleInferenceIsolateMessage(dynamic data) {
  if (data is _IsolateLogMessage) {
    final logger = _loggerCallbacks[data.id];
    if (logger != null && data.message.trim().isNotEmpty) {
      logger(data.message);
    }
    return;
  }
  if (data is _IsolateInferenceResponse) {
    final callback = _isolateInferenceCallbacks[data.id];
    if (callback != null) {
      final errorJson = data.errorJson;
      callback(
        data.response,
        data.openaiResponseJsonString,
        data.done,
        errorJson == null ? null : FllamaError.fromJson(errorJson),
      );
    }
    if (data.done) {
      _isolateInferenceCallbacks.remove(data.id);
      _loggerCallbacks.remove(data.id);
    }
    return;
  }

  // ignore: avoid_print
  print(
    '[fllama] inference helper sent unsupported message type: '
    '${data.runtimeType}',
  );
}

void _failPendingInferenceRequests(Object error, StackTrace stackTrace) {
  final callbacks = _isolateInferenceCallbacks.values.toList(growable: false);
  _isolateInferenceCallbacks.clear();
  _loggerCallbacks.clear();
  final message = 'Error: $error';

  for (final callback in callbacks) {
    try {
      callback('', '', true, FllamaError(FllamaErrorType.other, message));
    } catch (callbackError) {
      // ignore: avoid_print
      print(
        '[fllama] inference callback threw while reporting helper isolate '
        'failure: $callbackError\n$stackTrace',
      );
    }
  }
}

/// Cancels the inference with the given [requestId].
///
/// The request then ends soon with its last callback: `done` set, the text
/// so far, and no error. A request that has not started ends with no text.
void fllamaCancelInference(int requestId) async {
  final SendPort helperIsolateSendPort = await _getHelperIsolateSendPort();
  final _IsolateInferenceCancel isolateCancel = _IsolateInferenceCancel(
    requestId,
  );
  helperIsolateSendPort.send(isolateCancel);
}

/// Decodes a string that native code allocated for Dart, then frees it.
/// Returns '' for nullptr. Invalid UTF-8 becomes U+FFFD.
String _takeNativeString(Pointer<Char> pointer) {
  if (pointer == nullptr) return '';
  try {
    final bytes = pointer.cast<Uint8>();
    var length = 0;
    while (bytes[length] != 0) {
      length++;
    }
    return utf8.decode(bytes.asTypedList(length), allowMalformed: true);
  } finally {
    malloc.free(pointer);
  }
}

void _freeNativeRequest(Pointer<fllama_inference_request> pointer) {
  final request = pointer.ref;
  for (final string in [
    request.input,
    request.model_path,
    request.model_mmproj_path,
    request.openai_request_json_string,
    request.gpu_device_key,
    request.draft_model_path,
  ]) {
    if (string != nullptr) calloc.free(string);
  }
  calloc.free(pointer);
}

void _fllamaInferenceIsolate(SendPort sendPort) async {
  final ReceivePort helperReceivePort = ReceivePort();
  helperReceivePort.listen((dynamic data) {
    try {
      if (data is _IsolateInferenceCancel) {
        fllamaBindings.fllama_inference_cancel(data.id);
        return;
      }

      // On the helper isolate listen to requests and respond to them.
      if (data is! _IsolateInferenceRequest) {
        throw UnsupportedError('Unsupported message type: ${data.runtimeType}');
      }

      NativeCallable<FllamaLogCallbackNative>? logger;
      if (data.hasLogger) {
        logger = NativeCallable<FllamaLogCallbackNative>.listener((
          Pointer<Char> message,
        ) {
          sendPort.send(
            _IsolateLogMessage(data.id, _takeNativeString(message)),
          );
        });
      }
      final nativeRequestPointer = _toNative(
        data.request,
        data.id,
        logger: logger,
      );
      late final NativeCallable<NativeInferenceCallback> callback;
      void onResponse(
        Pointer<Char> responsePointer,
        Pointer<Char> openaiResponseJsonPointer,
        Pointer<Char> errorJsonPointer,
        int done,
      ) {
        final errorJson = errorJsonPointer == nullptr
            ? null
            : _takeNativeString(errorJsonPointer);
        sendPort.send(
          _IsolateInferenceResponse(
            id: data.id,
            response: _takeNativeString(responsePointer),
            openaiResponseJsonString: _takeNativeString(
              openaiResponseJsonPointer,
            ),
            done: done == 1,
            errorJson: errorJson,
          ),
        );
        if (done == 1) {
          // Native makes no call for the request after the last callback
          // (fllama.h). Its earlier log calls came before this one.
          _freeNativeRequest(nativeRequestPointer);
          callback.close();
          logger?.close();
        }
      }

      callback = NativeCallable<NativeInferenceCallback>.listener(onResponse);

      fllamaBindings.fllama_inference(
        nativeRequestPointer.ref,
        callback.nativeFunction,
      );
    } catch (error, stackTrace) {
      // ignore: avoid_print
      print('[fllama inference isolate] ERROR: $error. STACK: $stackTrace');
      if (data is _IsolateInferenceRequest) {
        sendPort.send(
          _IsolateInferenceResponse(
            id: data.id,
            response: '',
            openaiResponseJsonString: '',
            done: true,
            errorJson: jsonEncode({
              'type': 'other',
              'message': 'fllama inference helper failed: $error',
            }),
          ),
        );
      }
    }
  });

  // Send the port to the main isolate on which we can receive requests.
  sendPort.send(helperReceivePort.sendPort);
}
