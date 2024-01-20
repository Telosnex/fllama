import 'dart:async';
import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama/fllama_bindings_generated.dart';

class FllamaInferenceRequest {
  int numThreads;
  int numThreadsBatch;
  int numGpuLayers;
  String input;
  String modelPath;

  FllamaInferenceRequest({
    required this.numThreads,
    required this.numThreadsBatch,
    required this.numGpuLayers,
    required this.input,
    required this.modelPath,
  });

  fllama_inference_request toFllamaInferenceRequest() {
    fllama_inference_request request = calloc<fllama_inference_request>().ref;
    request.num_threads = numThreads;
    request.num_threads_batch = numThreadsBatch;
    request.num_gpu_layers = numGpuLayers;
    Pointer<Utf8> inputStr = input.toNativeUtf8();
    request.input = inputStr.cast<Char>();
    return request;
  }
}

Future<String> fllamaInferenceAsync(FllamaInferenceRequest request) async {
  print('G');
  final SendPort helperIsolateSendPort = await _helperIsolateSendPort;
  print('H');

  final int requestId = _nextInferenceRequestId++;
  print('I');
  final _IsolateInferenceRequest isolateRequest =
      _IsolateInferenceRequest(requestId, request);
  print('J');

  final Completer<String> completer = Completer<String>();
  print('K');

  _isolateInferenceRequests[requestId] = completer;
  print('L');
  try {
    helperIsolateSendPort.send(isolateRequest);
  } catch (e) {
    print(e);
  }
  print('M');

  print('Sent inference request $requestId');
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
  final String result;

  const _IsolateInferenceResponse(this.id, this.result);
}

/// Counter to identify [_IsolateInferenceRequest]s and [_IsolateInferenceResponse]s.
int _nextInferenceRequestId = 0;

/// Mapping from [_IsolateInferenceRequest] `id`s to the completers corresponding to the correct future of the pending request.
final Map<int, Completer<String>> _isolateInferenceRequests =
    <int, Completer<String>>{};

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
        // The helper isolate sent us a response to a request we sent.
        final Completer<String> completer = _isolateInferenceRequests[data.id]!;
        _isolateInferenceRequests.remove(data.id);
        completer.complete(data.result);
        return;
      }
      throw UnsupportedError('Unsupported message type: ${data.runtimeType}');
    });

  // Start the helper isolate.
  await Isolate.spawn((SendPort sendPort) async {
    final ReceivePort helperReceivePort = ReceivePort()
      ..listen((dynamic data) {
        // On the helper isolate listen to requests and respond to them.
        if (data is _IsolateInferenceRequest) {
          final Pointer<Char> result = _bindings
              .fllama_inference(data.request.toFllamaInferenceRequest());
          // Turn Pointer<Char> to String.
          final String resultString = result.cast<Utf8>().toDartString();
          final _IsolateInferenceResponse response =
              _IsolateInferenceResponse(data.id, resultString);
          sendPort.send(response);
          return;
        }
        throw UnsupportedError('Unsupported message type: ${data.runtimeType}');
      });

    // Send the port to the main isolate on which we can receive requests.
    sendPort.send(helperReceivePort.sendPort);
  }, receivePort.sendPort);

  // Wait until the helper isolate has sent us back the SendPort on which we
  // can start sending requests.
  return completer.future;
}();
