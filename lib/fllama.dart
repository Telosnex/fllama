// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama/fllama_bindings_generated.dart';

typedef NativeInferenceCallback = Void Function(
    Pointer<Char> response, Uint8 done);
typedef NativeFllamaInferenceCallback
    = Pointer<NativeFunction<NativeInferenceCallback>>;

class FllamaInferenceRequest {
  int contextSize; // llama.cpp handled 0 fine. StableLM Zephyr became default (4096).
  String? ggmlMetalPath;
  String input;
  int maxTokens;
  String modelPath;
  int numGpuLayers;
  double temperature;
  double topP;

  FllamaInferenceRequest({
    this.ggmlMetalPath,
    required this.contextSize,
    required this.input,
    required this.maxTokens,
    required this.modelPath,
    required this.numGpuLayers,
    required this.temperature,
    required this.topP,
  });

  fllama_inference_request toFllamaInferenceRequest() {
    // Allocate memory for the request structure.
    final Pointer<fllama_inference_request> requestPointer =
        calloc<fllama_inference_request>();
    final fllama_inference_request request = requestPointer.ref;

    request.context_size = contextSize;
    request.max_tokens = maxTokens;
    request.num_gpu_layers = numGpuLayers;
    request.temperature = temperature;
    request.top_p = topP;

    // Convert the Dart string to a C string (null-terminated).
    Pointer<Utf8> inputCstr = input.toNativeUtf8();
    Pointer<Utf8> modelPathCstr = modelPath.toNativeUtf8();
    Pointer<Utf8> ggmlMetalPathCstr = ggmlMetalPath?.toNativeUtf8() ?? nullptr;
    request.input = inputCstr.cast<Char>();
    request.model_path = modelPathCstr.cast<Char>();
    request.ggml_metal_path =
        ggmlMetalPath == null ? nullptr : ggmlMetalPathCstr.cast<Char>();
    print('Max tokens: $maxTokens');
    print('Num GPU layers: $numGpuLayers');
    print('Temperature: $temperature');
    print('Top P: $topP');
    print('Input: $input');
    print('Model path: $modelPath');
    print('GGML Metal path: $ggmlMetalPath');
    return request;
  }
}

// This callback type will be used in Dart to receive incremental results
typedef FllamaInferenceCallback = void Function(String response, bool done);
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
    print('[fflama] ERROR sending request to helper isolate: $e');
  }
  return completer.future;
}

const String _libName = 'fllama';

/// The dynamic library in which the symbols for [FllamaBindings] can be found.
final DynamicLibrary _dylib = () {
  if (Platform.isMacOS || Platform.isIOS) {
    return DynamicLibrary.open('$_libName.framework/$_libName');
  }
  if (Platform.isAndroid || Platform.isLinux) {
    return DynamicLibrary.open('lib$_libName.so');
  }
  if (Platform.isWindows) {
    return DynamicLibrary.open('$_libName.dll');
  }
  throw UnsupportedError('Unknown platform: ${Platform.operatingSystem}');
}();

typedef NativeHttpCallback = Void Function(Pointer<Char>);
typedef HttpGetNativeFunction = Void Function(
    Pointer<Utf8>, Pointer<NativeFunction<NativeHttpCallback>>);

/// The bindings to the native functions in [_dylib].
final FllamaBindings _bindings = FllamaBindings(_dylib);

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
        print(
            '[fllama inference isolate] [#${data.id}] received response. done? ${data.done}');
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
        // On the helper isolate listen to requests and respond to them.
        if (data is! _IsolateInferenceRequest) {
          throw UnsupportedError(
              'Unsupported message type: ${data.runtimeType}');
        }

        late final NativeCallable<NativeInferenceCallback> callback;
        void onResponse(Pointer<Char> responsePointer, int done) {
          // This is responsePointer.cast<Utf8>().toDartString(), inlined, in
          // order to allow malformed UTF-8.
          final codeUnits = responsePointer.cast<Uint8>();
          var length = 0;
          while (codeUnits[length] != 0) {
            length++;
          }
          final partial =
              utf8.decode(codeUnits.asTypedList(length), allowMalformed: true);
          final _IsolateInferenceResponse response =
              _IsolateInferenceResponse(data.id, partial, done == 1);
          sendPort.send(response);
        }

        callback = NativeCallable<NativeInferenceCallback>.listener(onResponse);
        _bindings.fllama_inference(
          data.request.toFllamaInferenceRequest(),
          callback.nativeFunction,
        );
      });

    // Send the port to the main isolate on which we can receive requests.
    sendPort.send(helperReceivePort.sendPort);
  }, receivePort.sendPort);

  // Wait until the helper isolate has sent us back the SendPort on which we
  // can start sending requests.
  return completer.future;
}();
