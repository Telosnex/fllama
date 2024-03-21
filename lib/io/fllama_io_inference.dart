import 'dart:async';
import 'dart:convert';
import 'dart:ffi';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fllama_universal.dart';
import 'package:fllama/io/fllama_bindings_generated.dart';
import 'package:fllama/io/fllama_io_helpers.dart';
import 'package:uuid/uuid.dart';

typedef NativeInferenceCallback = Void Function(
    Pointer<Char> response, Uint8 done);
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
Future<void> fllamaInference(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  final SendPort helperIsolateSendPort = await _helperIsolateSendPort;
  final int requestId = _nextInferenceRequestId++;
  final _IsolateInferenceRequest isolateRequest =
      _IsolateInferenceRequest(requestId, request);
  _isolateInferenceCallbacks[requestId] = callback;
  try {
    helperIsolateSendPort.send(isolateRequest);
  } catch (e) {
    // ignore: avoid_print
    print('[fllama] ERROR sending request to helper isolate: $e');
  }
}

class _IsolateInferenceRequest {
  final int id;
  final FllamaInferenceRequest request;

  const _IsolateInferenceRequest(this.id, this.request);
}

class _IsolateInferenceResponse {
  final int id;
  final String response;
  final bool done;

  const _IsolateInferenceResponse(this.id, this.response, this.done);
}

/// Counter to identify [_IsolateInferenceRequest]s and [_IsolateInferenceResponse]s.
int _nextInferenceRequestId = 0;

/// Mapping from [_IsolateInferenceRequest] `id`s to the callbacks that are
/// run when each token is generated.
final Map<int, FllamaInferenceCallback> _isolateInferenceCallbacks =
    <int, FllamaInferenceCallback>{};

Pointer<fllama_inference_request> _toNative(FllamaInferenceRequest dart) {
  // Allocate memory for the request structure.
  final Pointer<fllama_inference_request> requestPointer =
      calloc<fllama_inference_request>();
  final fllama_inference_request request = requestPointer.ref;

  request.context_size = dart.contextSize;
  request.max_tokens = dart.maxTokens;
  request.num_gpu_layers = dart.numGpuLayers;
  request.num_threads = dart.numThreads;
  request.temperature = dart.temperature;
  request.top_p = dart.topP;
  request.penalty_freq = dart.penaltyFrequency;
  request.penalty_repeat = dart.penaltyRepeat;

  // Convert the Dart string to a C string (null-terminated).
  Pointer<Utf8> requestIdCstr = const Uuid().v4().toNativeUtf8();
  Pointer<Utf8> inputCstr = dart.input.toNativeUtf8();
  Pointer<Utf8> modelPathCstr = dart.modelPath.toNativeUtf8();
  request.input = inputCstr.cast<Char>();
  request.model_path = modelPathCstr.cast<Char>();
  request.request_id = requestIdCstr.cast<Char>();
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
  if (dart.logger != null) {
    void onResponse(Pointer<Char> responsePointer) {
      if (dart.logger != null) {
        dart.logger!(pointerCharToString(responsePointer));
      }
    }

    final NativeCallable<FllamaLogCallbackNative> callback =
        NativeCallable<FllamaLogCallbackNative>.listener(onResponse);
    request.dart_logger = callback.nativeFunction;
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
      if (data is _IsolateInferenceResponse) {
        final callback = _isolateInferenceCallbacks[data.id];
        if (callback != null) {
          callback(data.response, data.done);
        }
        if (data.done) {
          _isolateInferenceCallbacks.remove(data.id);
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

void _fllamaInferenceIsolate(SendPort sendPort) async {
  final ReceivePort helperReceivePort = ReceivePort();
  helperReceivePort.listen((dynamic data) {
    try {
      // On the helper isolate listen to requests and respond to them.
      if (data is! _IsolateInferenceRequest) {
        throw UnsupportedError('Unsupported message type: ${data.runtimeType}');
      }

      final nativeRequestPointer = _toNative(data.request);
      final nativeRequest = nativeRequestPointer.ref;
      late final NativeCallable<NativeInferenceCallback> callback;
      void onResponse(Pointer<Char> responsePointer, int done) {
        // This is responsePointer.cast<Utf8>().toDartString(), inlined, in
        // order to allow only valid UTF-8.
        final codeUnits = responsePointer.cast<Uint8>();
        var length = 0;
        while (codeUnits[length] != 0) {
          length++;
        }

        var decodedString = '';
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

        final _IsolateInferenceResponse response =
            _IsolateInferenceResponse(data.id, decodedString, done == 1);
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
    } catch (e, s) {
      // ignore: avoid_print
      print('[fllama inference isolate] ERROR: $e. STACK: $s');
    }
  });

  // Send the port to the main isolate on which we can receive requests.
  sendPort.send(helperReceivePort.sendPort);
}
