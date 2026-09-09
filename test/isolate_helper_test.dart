import 'dart:async';
import 'dart:isolate';

import 'package:fllama/io/fllama_io_isolate.dart';
import 'package:test/test.dart';

void main() {
  test('returns the helper request port and relays later messages', () async {
    final response = Completer<String>();
    final sendPort = await startFllamaHelperIsolate(
      debugName: 'echo test',
      entryPoint: _echoHelper,
      onMessage: (message) {
        if (!response.isCompleted) response.complete(message as String);
      },
      onTerminated: (error, stackTrace) {
        if (!response.isCompleted) response.completeError(error, stackTrace);
      },
      startupTimeout: const Duration(seconds: 1),
    );

    sendPort.send('ping');

    expect(await response.future, 'pong');
  });

  test('reports an isolate error before startup', () async {
    await expectLater(
      startFllamaHelperIsolate(
        debugName: 'throwing test',
        entryPoint: _throwingHelper,
        onMessage: (_) {},
        onTerminated: (_, __) {},
        startupTimeout: const Duration(seconds: 1),
      ),
      throwsA(
        isA<StateError>().having(
          (error) => error.toString(),
          'message',
          allOf(contains('throwing test'), contains('startup failed')),
        ),
      ),
    );
  });

  test('times out when an isolate never sends its startup port', () async {
    await expectLater(
      startFllamaHelperIsolate(
        debugName: 'silent test',
        entryPoint: _silentHelper,
        onMessage: (_) {},
        onTerminated: (_, __) {},
        startupTimeout: const Duration(milliseconds: 50),
      ),
      throwsA(
        isA<TimeoutException>().having(
          (error) => error.toString(),
          'message',
          contains('silent test'),
        ),
      ),
    );
  });
}

void _echoHelper(SendPort mainIsolateSendPort) {
  final requests = ReceivePort();
  mainIsolateSendPort.send(requests.sendPort);
  requests.listen((message) {
    if (message == 'ping') mainIsolateSendPort.send('pong');
  });
}

void _throwingHelper(SendPort _) {
  throw StateError('startup failed');
}

void _silentHelper(SendPort _) {
  final keepAlive = ReceivePort();
  keepAlive.listen((_) {});
}
