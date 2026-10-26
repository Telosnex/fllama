// The driver of the web integration tests. Unlike integrationDriver(), it
// writes the report data and prints the failure details when a test fails.
//
// It also prints the progress of the tests every 30 s: flutter drive prints
// nothing while the tests run, so a CI watchdog cannot tell a slow run from a
// stalled one. The progress is the last "==== test <name>" line of the page
// console (web_llm_integration_test.dart keeps it) and the console's length.
// The new console lines are appended to build/web_console.log on each poll,
// so a run that never ends still leaves its console for the CI artifact.
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';
import 'package:integration_test/common.dart';

const _progressScript = r'''
const from = arguments[0];
const lines = globalThis.__fllamaConsole || [];
let test = '(no test yet)';
for (let i = lines.length - 1; i >= 0; i--) {
  const at = lines[i].indexOf('==== test ');
  if (at >= 0) { test = lines[i].slice(at + 10); break; }
}
const last = lines.length ? lines[lines.length - 1].slice(0, 160) : '';
// The console keeps at most 20,000 lines; it drops the oldest.
const start = Math.max(0, Math.min(from, lines.length));
return JSON.stringify({ test, lines: lines.length, last,
    added: lines.slice(start, start + 5000) });
''';

Future<void> main() async {
  final driver = await FlutterDriver.connect();
  final progress = _printProgress(driver);
  final Response response;
  try {
    response = Response.fromJson(
      await driver.requestData(null, timeout: const Duration(hours: 1)),
    );
  } finally {
    progress.cancel();
  }
  await driver.close();
  File('build/integration_response_data.json')
    ..createSync(recursive: true)
    ..writeAsStringSync(
      const JsonEncoder.withIndent('  ').convert(response.data ?? {}),
    );
  for (final failure in response.failureDetails ?? const <Failure>[]) {
    stdout
      ..writeln('FAILED: ${failure.methodName}')
      ..writeln(failure.details);
  }
  stdout.writeln(
    response.allTestsPassed ? 'All tests passed.' : 'Some tests failed.',
  );
  exit(response.allTestsPassed ? 0 : 1);
}

Timer _printProgress(FlutterDriver driver) {
  if (driver is! WebFlutterDriver) return Timer(Duration.zero, () {});
  final start = DateTime.now();
  final log = File('build/web_console.log')
    ..createSync(recursive: true)
    ..writeAsStringSync('');
  var sent = 0;
  var busy = false;
  return Timer.periodic(const Duration(seconds: 30), (_) async {
    if (busy) return;
    busy = true;
    final seconds = DateTime.now().difference(start).inSeconds;
    try {
      final json = await driver.webDriver.execute(
          _progressScript, [sent]).timeout(const Duration(seconds: 20));
      final p = jsonDecode(json as String) as Map<String, Object?>;
      final added = (p['added']! as List).cast<String>();
      if (added.isNotEmpty) {
        log.writeAsStringSync('${added.join('\n')}\n', mode: FileMode.append);
        sent += added.length;
      }
      stdout.writeln(
        '[progress ${seconds}s] test ${p['test']}, '
        '${p['lines']} console lines; last: ${p['last']}',
      );
    } catch (error) {
      stdout.writeln('[progress ${seconds}s] page did not answer: $error');
    } finally {
      busy = false;
    }
  });
}
