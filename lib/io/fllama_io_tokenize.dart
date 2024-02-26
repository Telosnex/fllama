import 'dart:async';
import 'dart:ffi';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama/io/fllama_bindings_generated.dart';
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fllama_universal.dart';

typedef NativeTokenizeCallback = Void Function(Int count);
typedef NativeFllamaTokenizeCallback
    = Pointer<NativeFunction<NativeTokenizeCallback>>;

// Inner workings - No need for direct access, hence private
class _IsolateTokenizeRequest {
  final int id;
  final FllamaTokenizeRequest request;

  _IsolateTokenizeRequest(this.id, this.request);
}

class _IsolateTokenizeResponse {
  final int id;
  final int result;

  _IsolateTokenizeResponse(this.id, this.result);
}

int _nextTokenizeRequestId = 0; // Unique ID for each request
final Map<int, Completer<int>> _isolateTokenizeRequests =
    <int, Completer<int>>{};

Future<SendPort> _helperTokenizeIsolateSendPort = (() async {
  final completer = Completer<SendPort>();
  final receivePort = ReceivePort();

  await Isolate.spawn(_fllamaTokenizeIsolate, receivePort.sendPort);

  receivePort.listen((dynamic data) {
    if (data is SendPort) {
      completer.complete(data);
    } else if (data is _IsolateTokenizeResponse) {
      final Completer<int>? requestCompleter =
          _isolateTokenizeRequests.remove(data.id);

      if (requestCompleter == null) {
        // ignore: avoid_print
        print(
            '[fllama] fllama_io_tokenize ERROR: No completer found for request ID: ${data.id}');
        return;
      }
      requestCompleter.complete(data.result);
    } else {
      // ignore: avoid_print
      print(
          '[fllama] fllama_io_tokenize ERROR: Unexpected data from isolate: $data');
    }
  });

  return completer.future;
}());

Future<int> fllamaTokenizeAsync(FllamaTokenizeRequest request) async {
  final SendPort helperIsolateSendPort = await _helperTokenizeIsolateSendPort;

  final requestId = _nextTokenizeRequestId++;
  final isolateRequest = _IsolateTokenizeRequest(requestId, request);

  final completer = Completer<int>();
  _isolateTokenizeRequests[requestId] = completer;
  helperIsolateSendPort.send(isolateRequest);
  return completer.future;
}

// Background isolate entry function for tokenization
void _fllamaTokenizeIsolate(SendPort mainIsolateSendPort) {
  final helperReceivePort = ReceivePort();
  mainIsolateSendPort.send(helperReceivePort.sendPort);

  helperReceivePort.listen((dynamic data) {
    if (data is _IsolateTokenizeRequest) {
      final request = _toNativeTokenizeRequest(data.request);

      // Invoke the actual FFI function here; ensure proper signature and binding exist
      int answer = fllamaBindings.fllama_tokenize(request.ref);
      mainIsolateSendPort.send(_IsolateTokenizeResponse(data.id, answer));

      // Clean-up allocated memory
      calloc.free(request.ref.input);
      calloc.free(request.ref.model_path);
      calloc.free(request);
    }
  });
}

Pointer<fllama_tokenize_request> _toNativeTokenizeRequest(
    FllamaTokenizeRequest dartRequest) {
  final nativeRequest = calloc<fllama_tokenize_request>();

  // Input and ModelPath should be properly allocated and set to native memory
  nativeRequest.ref.input = dartRequest.input.toNativeUtf8().cast<Char>();
  nativeRequest.ref.model_path =
      dartRequest.modelPath.toNativeUtf8().cast<Char>();

  return nativeRequest;
}
