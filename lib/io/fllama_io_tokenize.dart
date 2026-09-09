import 'dart:async';
import 'dart:ffi';
import 'dart:isolate';

import 'package:ffi/ffi.dart';
import 'package:fllama/io/fllama_bindings_generated.dart';
import 'package:fllama/io/fllama_io_isolate.dart';
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fllama_universal.dart';

typedef NativeTokenizeCallback = Void Function(Int count);
typedef NativeFllamaTokenizeCallback =
    Pointer<NativeFunction<NativeTokenizeCallback>>;

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

Future<SendPort>? _helperTokenizeIsolateSendPort;

Future<SendPort> _getHelperTokenizeIsolateSendPort() async {
  final existing = _helperTokenizeIsolateSendPort;
  if (existing != null) return existing;

  late final Future<SendPort> startup;
  startup = startFllamaHelperIsolate(
    debugName: 'fllama tokenize',
    entryPoint: _fllamaTokenizeIsolate,
    onMessage: _handleTokenizeIsolateMessage,
    onTerminated: (error, stackTrace) {
      if (identical(_helperTokenizeIsolateSendPort, startup)) {
        _helperTokenizeIsolateSendPort = null;
      }
      final requests = _isolateTokenizeRequests.values.toList(growable: false);
      _isolateTokenizeRequests.clear();
      for (final request in requests) {
        if (!request.isCompleted) {
          request.completeError(error, stackTrace);
        }
      }
    },
  );
  _helperTokenizeIsolateSendPort = startup;

  try {
    return await startup;
  } catch (_) {
    if (identical(_helperTokenizeIsolateSendPort, startup)) {
      _helperTokenizeIsolateSendPort = null;
    }
    rethrow;
  }
}

void _handleTokenizeIsolateMessage(dynamic data) {
  if (data is _IsolateTokenizeResponse) {
    final requestCompleter = _isolateTokenizeRequests.remove(data.id);
    if (requestCompleter == null) {
      // ignore: avoid_print
      print(
        '[fllama] tokenize helper has no completer for request ${data.id}.',
      );
      return;
    }
    requestCompleter.complete(data.result);
    return;
  }

  // ignore: avoid_print
  print(
    '[fllama] tokenize helper sent unsupported message type: '
    '${data.runtimeType}',
  );
}

/// Returns the number of tokens in [request.input].
///
/// Useful for identifying what messages will be in context when the LLM is run.
Future<int> fllamaTokenize(FllamaTokenizeRequest request) async {
  final SendPort helperIsolateSendPort =
      await _getHelperTokenizeIsolateSendPort();

  final requestId = _nextTokenizeRequestId++;
  final isolateRequest = _IsolateTokenizeRequest(requestId, request);

  final completer = Completer<int>();
  _isolateTokenizeRequests[requestId] = completer;
  try {
    helperIsolateSendPort.send(isolateRequest);
  } catch (error, stackTrace) {
    _isolateTokenizeRequests.remove(requestId);
    Error.throwWithStackTrace(
      StateError(
        'Could not send tokenize request $requestId to the fllama helper '
        'isolate: $error',
      ),
      stackTrace,
    );
  }
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
  FllamaTokenizeRequest dartRequest,
) {
  final nativeRequest = calloc<fllama_tokenize_request>();

  // Input and ModelPath should be properly allocated and set to native memory
  nativeRequest.ref.input = dartRequest.input.toNativeUtf8().cast<Char>();
  nativeRequest.ref.model_path = dartRequest.modelPath
      .toNativeUtf8()
      .cast<Char>();

  return nativeRequest;
}
