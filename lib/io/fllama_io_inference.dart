import 'dart:async';
import 'dart:convert';
import 'dart:ffi';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fllama_universal.dart';
import 'package:fllama/io/fllama_bindings_generated.dart';
import 'package:fllama/io/fllama_io_helpers.dart';

typedef NativeInferenceCallback = Void Function(
    Pointer<Char> response, Pointer<Char> openaiResponseJsonString, Uint8 done);
typedef NativeFllamaInferenceCallback
    = Pointer<NativeFunction<NativeInferenceCallback>>;
typedef FllamaLogCallbackNative = Void Function(Pointer<Char>);
typedef FllamaLogCallbackDart = void Function(Pointer<Char>);

/// Runs standard LLM inference. The future returns immediately after being
/// called. [callback] is called on each new output token with the response and
/// a boolean indicating whether the response is the final response.
///
/// This is *not* what most people want to use. LLMs post-ChatGPT use a chat
/// template and an EOS token. Use [fllamaChat] instead if you expect this
/// sort of interface, i.e. an OpenAI-like API.
Future<int> fllamaInference(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  final SendPort helperIsolateSendPort = await _helperIsolateSendPort;
  final int requestId = _nextInferenceRequestId++;
  final _IsolateInferenceRequest isolateRequest =
      _IsolateInferenceRequest(requestId, request);
  _isolateInferenceCallbacks[requestId] = callback;
  
  // Store the logger callback so we can call it when we get messages from the isolate
  if (request.logger != null) {
    _loggerCallbacks[requestId] = request.logger;
  }
  try {
    helperIsolateSendPort.send(isolateRequest);
  } catch (e) {
    // ignore: avoid_print
    print('[fllama] ERROR sending request to helper isolate: $e');
  }
  return requestId;
}

class _IsolateInferenceRequest {
  final int id;
  final FllamaInferenceRequest request;

  const _IsolateInferenceRequest(this.id, this.request);
}

class _IsolateInferenceCancel {
  final int id;

  const _IsolateInferenceCancel(this.id);
}

class _IsolateLogMessage {
  final int id;  // Request ID to know which logger to call
  final String message;
  
  const _IsolateLogMessage(this.id, this.message);
}

class _IsolateInferenceResponse {
  final int id;
  final String response;
  final String openaiResponseJsonString;
  final bool done;

  const _IsolateInferenceResponse({
    required this.id,
    required this.response,
    required this.openaiResponseJsonString,
    required this.done,
  });
}

/// Counter to identify [_IsolateInferenceRequest]s and [_IsolateInferenceResponse]s.
int _nextInferenceRequestId = 0;

/// Mapping from [_IsolateInferenceRequest] `id`s to the callbacks that are
/// run when each token is generated.
final Map<int, FllamaInferenceCallback> _isolateInferenceCallbacks =
    <int, FllamaInferenceCallback>{};

/// Mapping from request IDs to the original logger callbacks
final Map<int, void Function(String)?> _loggerCallbacks =
    <int, void Function(String)?>{};

Pointer<fllama_inference_request> _toNative(
    FllamaInferenceRequest dart, int requestId, [Map<int, NativeCallable>? loggerCallbacks, SendPort? sendPort]) {
  // Allocate memory for the request structure.
  final Pointer<fllama_inference_request> requestPointer =
      calloc<fllama_inference_request>();
  final fllama_inference_request request = requestPointer.ref;

  request.request_id = requestId;
  request.context_size = dart.contextSize;
  request.max_tokens = dart.maxTokens;
  request.num_gpu_layers = dart.numGpuLayers;
  request.num_threads = dart.numThreads;
  request.temperature = dart.temperature;
  request.top_p = dart.topP;
  request.penalty_freq = dart.penaltyFrequency;
  request.penalty_repeat = dart.penaltyRepeat;

  // Convert the Dart string to a C string (null-terminated).
  Pointer<Utf8> inputCstr = dart.input.toNativeUtf8();
  Pointer<Utf8> modelPathCstr = dart.modelPath.toNativeUtf8();
  request.input = inputCstr.cast<Char>();
  request.model_path = modelPathCstr.cast<Char>();
  if (dart.grammar != null && dart.grammar?.isNotEmpty == true) {
    Pointer<Utf8> grammarCstr = dart.grammar!.toNativeUtf8();
    request.grammar = grammarCstr.cast<Char>();
  }
  if (dart.modelMmprojPath != null &&
      dart.modelMmprojPath?.isNotEmpty == true) {
    Pointer<Utf8> mmprojPathCstr = dart.modelMmprojPath!.toNativeUtf8();
    request.model_mmproj_path = mmprojPathCstr.cast<Char>();
  }
  if (dart.eosToken != null && dart.eosToken?.isNotEmpty == true) {
    Pointer<Utf8> eosTokenCstr = dart.eosToken!.toNativeUtf8();
    request.eos_token = eosTokenCstr.cast<Char>();
  }
  if (dart.openAiRequestJsonString != null &&
      dart.openAiRequestJsonString?.isNotEmpty == true) {
    Pointer<Utf8> openAiRequestJsonStringCstr =
        dart.openAiRequestJsonString!.toNativeUtf8();
    request.openai_request_json_string =
        openAiRequestJsonStringCstr.cast<Char>();
  }
  if (dart.logger != null) {
    void onResponse(Pointer<Char> responsePointer) {
      final message = pointerCharToString(responsePointer);
      // Send log message back to main isolate if we have a sendPort
      if (sendPort != null) {
        sendPort.send(_IsolateLogMessage(requestId, message));
      } else {
        // Fallback to calling the logger directly (won't show in tests)
        dart.logger!(message);
      }
    }

    final NativeCallable<FllamaLogCallbackNative> callback =
        NativeCallable<FllamaLogCallbackNative>.listener(onResponse);
    request.dart_logger = callback.nativeFunction;
    // Store the callback to prevent garbage collection
    if (loggerCallbacks != null) {
      loggerCallbacks[requestId] = callback;
    }
  }
  return requestPointer;
}

/// The SendPort belonging to the helper isolate.
Future<SendPort> _helperIsolateSendPort = () async {
  // The helper isolate is going to send us back a SendPort, which we want to
  // wait for.
  final Completer<SendPort> completer = Completer<SendPort>();

  // Receive port on the main isolate to receive messages from the helper.
  // We receive two types of messages:
  // 1. A port to send messages on.
  // 2. Responses to requests we sent.
  final ReceivePort receivePort = ReceivePort()
    ..listen((dynamic data) {
      if (data is SendPort) {
        // The helper isolate sent us the port on which we can sent it requests.
        completer.complete(data);
        return;
      }
      if (data is _IsolateLogMessage) {
        // Call the original logger callback with the message from the isolate
        final logger = _loggerCallbacks[data.id];
        if (logger != null) {
          logger(data.message);
        }
        return;
      }
      if (data is _IsolateInferenceResponse) {
        final callback = _isolateInferenceCallbacks[data.id];
        if (callback != null) {
          callback(data.response, data.openaiResponseJsonString, data.done);
        }
        if (data.done) {
          _isolateInferenceCallbacks.remove(data.id);
          _loggerCallbacks.remove(data.id);  // Clean up the logger callback
          // Note: NativeCallable cleanup happens in the isolate when inference is done
          return;
        } else {
          return;
        }
      }
      throw UnsupportedError('Unsupported message type: ${data.runtimeType}');
    });

  // Start the helper isolate.
  await Isolate.spawn(_fllamaInferenceIsolate, receivePort.sendPort);

  // Wait until the helper isolate has sent us back the SendPort on which we
  // can start sending requests.
  return completer.future;
}();

/// Cancels the inference with the given [requestId].
///
/// It is recommended you do _not_ update your state based on this.
/// Use the callbacks, like you would generally.
///
/// This is supported via:
/// - Inferences that have not yet started will call their callback with `done`
/// set to `true` and an empty string.
/// - Inferences that have started will call their callback with `done` set to
/// `true` and the final output of the inference.
void fllamaCancelInference(int requestId) async {
  final SendPort helperIsolateSendPort = await _helperIsolateSendPort;
  final _IsolateInferenceCancel isolateCancel =
      _IsolateInferenceCancel(requestId);
  helperIsolateSendPort.send(isolateCancel);
}

// GLOBAL map to keep logger callbacks alive across ALL isolate invocations
final Map<int, NativeCallable> _globalLoggerCallbacks = {};

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

      final nativeRequestPointer = _toNative(data.request, data.id, _globalLoggerCallbacks, sendPort);
      final nativeRequest = nativeRequestPointer.ref;
      late final NativeCallable<NativeInferenceCallback> callback;
      void onResponse(Pointer<Char> responsePointer,
          Pointer<Char> openaiReponseJsonStringPointer, int done) {
        // Clean up logger callback when inference is done
        if (done == 1) {
          final loggerCallback = _globalLoggerCallbacks.remove(data.id);
          loggerCallback?.close();
        }
        // This is responsePointer.cast<Utf8>().toDartString(), inlined, in
        // order to allow only valid UTF-8.
        var decodedString = '';

        {
          final codeUnits = responsePointer.cast<Uint8>();

          var length = 0;
          while (codeUnits[length] != 0) {
            length++;
          }

          while (length > 0) {
            try {
              decodedString = utf8.decode(codeUnits.asTypedList(length),
                  allowMalformed: false);
              // if the decode succeeds, exit the loop
              break;
            } catch (e) {
              // If an exception is caught, try with one less byte
              length--;
            }
          }

          // If length becomes zero, it means decoding failed at every attempt - use an empty string
          if (length == 0) {
            decodedString = '';
          }
        }

        var decodedOpenaiResponseJsonString = '';

        {
          final codeUnits = openaiReponseJsonStringPointer.cast<Uint8>();

          var length = 0;
          while (codeUnits[length] != 0) {
            length++;
          }

          while (length > 0) {
            try {
              decodedOpenaiResponseJsonString = utf8
                  .decode(codeUnits.asTypedList(length), allowMalformed: false);
              // if the decode succeeds, exit the loop
              break;
            } catch (e) {
              // If an exception is caught, try with one less byte
              length--;
            }
          }

          // If length becomes zero, it means decoding failed at every attempt - use an empty string
          if (length == 0) {
            decodedOpenaiResponseJsonString = '';
          }
        }

        final _IsolateInferenceResponse response = _IsolateInferenceResponse(
          id: data.id,
          response: decodedString,
          openaiResponseJsonString: decodedOpenaiResponseJsonString,
          done: done == 1,
        );
        sendPort.send(response);
        if (done == 1) {
          calloc.free(nativeRequest.input);
          calloc.free(nativeRequest.model_path);
          if (nativeRequest.grammar != nullptr) {
            calloc.free(nativeRequest.grammar);
          }
          if (nativeRequest.model_mmproj_path != nullptr) {
            calloc.free(nativeRequest.model_mmproj_path);
          }
          calloc.free(nativeRequestPointer);
        }
      }

      callback = NativeCallable<NativeInferenceCallback>.listener(onResponse);

      fllamaBindings.fllama_inference(
        nativeRequest,
        callback.nativeFunction,
      );
      
      // DON'T clean up logger callback here - inference hasn't happened yet!
      // It gets cleaned up when we receive the done response in the main isolate
    } catch (e, s) {
      // ignore: avoid_print
      print('[fllama inference isolate] ERROR: $e. STACK: $s');
    }
  });

  // Send the port to the main isolate on which we can receive requests.
  sendPort.send(helperReceivePort.sendPort);
}
