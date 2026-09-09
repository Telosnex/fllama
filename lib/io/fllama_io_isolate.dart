import 'dart:async';
import 'dart:isolate';

const Duration fllamaHelperIsolateStartupTimeout = Duration(seconds: 30);

/// Starts a long-lived helper isolate and waits for its request [SendPort].
///
/// Helper isolates must send their request port as their first message. Startup
/// errors, early exits, and failure to send that port are surfaced rather than
/// leaving callers waiting on a completer forever. Once startup succeeds,
/// [onTerminated] reports an unexpected isolate error or exit.
Future<SendPort> startFllamaHelperIsolate({
  required String debugName,
  required void Function(SendPort) entryPoint,
  required void Function(dynamic message) onMessage,
  required void Function(Object error, StackTrace stackTrace) onTerminated,
  Duration startupTimeout = fllamaHelperIsolateStartupTimeout,
}) {
  final startup = Completer<SendPort>();
  final messages = ReceivePort('$debugName messages');
  final errors = ReceivePort('$debugName errors');
  final exits = ReceivePort('$debugName exits');

  Isolate? isolate;
  var started = false;
  var terminated = false;
  late final Timer timer;

  void closePorts() {
    timer.cancel();
    messages.close();
    errors.close();
    exits.close();
  }

  void terminate(Object error, StackTrace stackTrace) {
    if (terminated) return;
    terminated = true;
    closePorts();
    isolate?.kill(priority: Isolate.immediate);

    if (!startup.isCompleted) {
      startup.completeError(error, stackTrace);
    } else {
      onTerminated(error, stackTrace);
    }
  }

  messages.listen((dynamic message) {
    if (!started) {
      if (message is! SendPort) {
        terminate(
          StateError(
            '$debugName helper isolate sent ${message.runtimeType} before its '
            'startup SendPort.',
          ),
          StackTrace.current,
        );
        return;
      }
      started = true;
      timer.cancel();
      startup.complete(message);
      return;
    }
    onMessage(message);
  });

  errors.listen((dynamic message) {
    final remoteError = message is List && message.isNotEmpty
        ? message.first.toString()
        : message.toString();
    final remoteStack = message is List && message.length > 1
        ? StackTrace.fromString(message[1].toString())
        : StackTrace.current;
    terminate(
      StateError('$debugName helper isolate failed: $remoteError'),
      remoteStack,
    );
  });

  exits.listen((dynamic _) {
    terminate(
      StateError('$debugName helper isolate exited unexpectedly.'),
      StackTrace.current,
    );
  });

  timer = Timer(startupTimeout, () {
    terminate(
      TimeoutException(
        '$debugName helper isolate did not send its startup SendPort within '
        '$startupTimeout.',
        startupTimeout,
      ),
      StackTrace.current,
    );
  });

  unawaited(() async {
    try {
      final spawnedIsolate = await Isolate.spawn<SendPort>(
        entryPoint,
        messages.sendPort,
        debugName: debugName,
        errorsAreFatal: true,
        onError: errors.sendPort,
        onExit: exits.sendPort,
      );
      isolate = spawnedIsolate;
      if (terminated) {
        spawnedIsolate.kill(priority: Isolate.immediate);
      }
    } catch (error, stackTrace) {
      terminate(
        StateError('Could not spawn $debugName helper isolate: $error'),
        stackTrace,
      );
    }
  }());

  return startup.future;
}
