import 'dart:async';
import 'dart:convert';
import 'dart:ffi';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fllama_unimplemented.dart';
import 'package:fllama/fllama_bindings_generated.dart';
import 'package:fllama/fllama_inference_request.dart';

typedef NativeInferenceCallback = Void Function(
    Pointer<Char> response, Uint8 done);
typedef NativeFllamaInferenceCallback
    = Pointer<NativeFunction<NativeInferenceCallback>>;

// This callback type will be used in Dart to receive incremental results
Future<String> fllamaInferenceAsync(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  final SendPort helperIsolateSendPort = await _helperIsolateSendPort;
  final int requestId = _nextInferenceRequestId++;
  final _IsolateInferenceRequest isolateRequest =
      _IsolateInferenceRequest(requestId, request);
  final Completer<String> completer = Completer<String>();
  _isolateInferenceRequests[requestId] = completer;
  _isolateInferenceCallbacks[requestId] = callback;
  try {
    helperIsolateSendPort.send(isolateRequest);
  } catch (e) {
    // ignore: avoid_print
    print('[fflama] ERROR sending request to helper isolate: $e');
  }
  return completer.future;
}

/// A request to compute `sum`.
///
/// Typically sent from one isolate to another.
class _IsolateInferenceRequest {
  final int id;
  final FllamaInferenceRequest request;

  const _IsolateInferenceRequest(this.id, this.request);
}

/// A response with the result of `sum`.
///
/// Typically sent from one isolate to another.
class _IsolateInferenceResponse {
  final int id;
  final String response;
  final bool done;

  const _IsolateInferenceResponse(this.id, this.response, this.done);
}

/// Counter to identify [_IsolateInferenceRequest]s and [_IsolateInferenceResponse]s.
int _nextInferenceRequestId = 0;

/// Mapping from [_IsolateInferenceRequest] `id`s to the completers
/// corresponding to the correct future of the pending request.
final Map<int, Completer<String>> _isolateInferenceRequests =
    <int, Completer<String>>{};
final Map<int, FllamaInferenceCallback> _isolateInferenceCallbacks =
    <int, FllamaInferenceCallback>{};

fllama_inference_request _toNative(FllamaInferenceRequest dart) {
  // Allocate memory for the request structure.
  final Pointer<fllama_inference_request> requestPointer =
      calloc<fllama_inference_request>();
  final fllama_inference_request request = requestPointer.ref;

  request.context_size = dart.contextSize;
  request.max_tokens = dart.maxTokens;
  request.num_gpu_layers = dart.numGpuLayers;
  request.temperature = dart.temperature;
  request.top_p = dart.topP;

  // Convert the Dart string to a C string (null-terminated).
  Pointer<Utf8> inputCstr = dart.input.toNativeUtf8();
  Pointer<Utf8> modelPathCstr = dart.modelPath.toNativeUtf8();
  request.input = inputCstr.cast<Char>();
  request.model_path = modelPathCstr.cast<Char>();
  return request;
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
          final Completer<String> completer =
              _isolateInferenceRequests[data.id]!;
          completer.complete(data.response);
          _isolateInferenceRequests.remove(data.id);
          return;
        } else {
          return;
        }
      }
      throw UnsupportedError('Unsupported message type: ${data.runtimeType}');
    });

  // Start the helper isolate.
  await Isolate.spawn((SendPort sendPort) async {
    final ReceivePort helperReceivePort = ReceivePort()
      ..listen((dynamic data) {
        try {
          // On the helper isolate listen to requests and respond to them.
          if (data is! _IsolateInferenceRequest) {
            throw UnsupportedError(
                'Unsupported message type: ${data.runtimeType}');
          }

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
          }

          callback =
              NativeCallable<NativeInferenceCallback>.listener(onResponse);
          fllamaBindings.fllama_inference(
            _toNative(data.request),
            callback.nativeFunction,
          );
        } catch (e, s) {
          // ignore: avoid_print
          print('[fllama inference isolate] ERROR: $e. STACK: $s');
        }
      });

    // Send the port to the main isolate on which we can receive requests.
    sendPort.send(helperReceivePort.sendPort);
  }, receivePort.sendPort);

  // Wait until the helper isolate has sent us back the SendPort on which we
  // can start sending requests.
  return completer.future;
}();
