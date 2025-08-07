import 'dart:async';

void logTest(String message) {
  // ignore: avoid_print
  print('[*** TEST ***] $message');
}

/// Creates a response handler for fllama chat that tracks timing information
///
/// Returns a tuple containing:
/// 1. The handler function to pass to fllama chat
/// 2. A Completer that will be completed with the raw output when done
///
/// Example usage:
/// ```dart
/// final (handler, completionCompleter) = createLlmResponseHandler();
///
/// await fllamaChat(request, handler);
/// final rawOutput = await completionCompleter.future.timeout(Duration(minutes: 5));
/// ```
(Function(String, String, bool), Completer<String>) createLlmResponseHandler() {
  final completionCompleter = Completer<String>();
  final chatStartTime = DateTime.now();
  DateTime? firstResponseTime;
  DateTime? doneTime;
  bool hasReceivedFirstResponse = false;
  final StringBuffer outputBuffer = StringBuffer();

  handler(String token, String openaiResponseJsonString, bool done) {
    outputBuffer.write(token);
    
    // Track first non-empty response
    if (!hasReceivedFirstResponse && token.isNotEmpty) {
      firstResponseTime = DateTime.now();
      hasReceivedFirstResponse = true;
      final latencyMs = firstResponseTime!
          .difference(chatStartTime)
          .inMilliseconds;
      logTest(
        'Duration between chat call and first non-empty response: ${latencyMs}ms',
      );
    }

    if (done) {
      doneTime = DateTime.now();
      final fullOutput = outputBuffer.toString();
      completionCompleter.complete(fullOutput);

      // Only show first 500 chars to avoid massive output
      final preview = fullOutput.length > 500 
          ? '${fullOutput.substring(0, 500)}... (${fullOutput.length} total chars)'
          : fullOutput;
      logTest('Final output:\n```\n$preview\n```');

      // Log timing information
      if (firstResponseTime != null) {
        final completionMs = doneTime!
            .difference(firstResponseTime!)
            .inMilliseconds;
        logTest(
          'Duration between first response and completion: ${completionMs}ms',
        );

        final totalMs = doneTime!.difference(chatStartTime).inMilliseconds;
        logTest('Total generation duration: ${totalMs}ms');
      }
    }
  }

  return (handler, completionCompleter);
}
