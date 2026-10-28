// The driver of the web integration tests: telosnex_web_test's, which saves
// the page console to web_console.log while the tests run, always writes the
// report data, and prints each failure.
//
// progressEveryPoll: a progress line every 30 s, also when the page logged
// nothing new. A long generation can be silent for minutes, and the
// watchdog of web-driver (idle-minutes) would stop it; the job's
// timeout-minutes is the limit instead.
import 'package:telosnex_web_test/driver.dart';

Future<void> main() => webIntegrationDriver(progressEveryPoll: true);
