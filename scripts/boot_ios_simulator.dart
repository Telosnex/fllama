// Select and fully boot an available iPhone simulator. Only the UDID goes to
// stdout, so CI can use DEVICE_ID=$(dart scripts/boot_ios_simulator.dart).
import 'dart:convert';
import 'dart:io';

Future<void> main() async {
  try {
    stdout.writeln(await bootSimulator());
  } catch (error) {
    stderr.writeln('Failed to boot iOS simulator: $error');
    exitCode = 1;
  }
}

typedef Simctl = Future<String> Function(List<String> args, Duration timeout);

Future<String> runSimctl(List<String> args, Duration timeout) async {
  final process = await Process.start('xcrun', ['simctl', ...args]);
  final output = process.stdout.transform(utf8.decoder).join();
  final errors = process.stderr.transform(utf8.decoder).join();
  final code = await process.exitCode.timeout(
    timeout,
    onTimeout: () {
      process.kill(ProcessSignal.sigkill);
      throw ProcessException('xcrun', [
        'simctl',
        ...args,
      ], 'Timed out after $timeout');
    },
  );
  final result = await output;
  final error = await errors;
  if (code != 0) {
    throw ProcessException(
      'xcrun',
      ['simctl', ...args],
      '$result\n$error',
      code,
    );
  }
  return result;
}

Map<String, dynamic> selectDevice(Map<String, dynamic> inventory) {
  final candidates = <({String runtime, Map<String, dynamic> device})>[];
  final runtimes = inventory['devices'] as Map<String, dynamic>;
  for (final entry in runtimes.entries) {
    if (!entry.key.contains('.iOS-')) continue;
    for (final device in (entry.value as List).cast<Map<String, dynamic>>()) {
      if (device['isAvailable'] == true &&
          (device['name'] as String).startsWith('iPhone')) {
        candidates.add((runtime: entry.key, device: device));
      }
    }
  }
  if (candidates.isEmpty) {
    throw StateError(
      'No available iPhone simulator. Install an iOS simulator runtime.\n'
      '${const JsonEncoder.withIndent('  ').convert(inventory)}',
    );
  }

  int statePriority(Map<String, dynamic> device) => switch (device['state']) {
    'Booted' => 2,
    'Booting' => 1,
    _ => 0,
  };
  List<int> version(String runtime) =>
      runtime.split('.iOS-').last.split('-').map(int.parse).toList();

  candidates.sort((a, b) {
    // Reuse a booted/booting iPhone; otherwise prefer the newest installed iOS.
    final state = statePriority(b.device).compareTo(statePriority(a.device));
    if (state != 0) return state;
    final av = version(a.runtime);
    final bv = version(b.runtime);
    for (var i = 0; i < av.length || i < bv.length; i++) {
      final comparison = (i < bv.length ? bv[i] : 0).compareTo(
        i < av.length ? av[i] : 0,
      );
      if (comparison != 0) return comparison;
    }
    return (b.device['name'] as String).compareTo(a.device['name'] as String);
  });
  return candidates.first.device;
}

Future<String> bootSimulator({Simctl simctl = runSimctl}) async {
  final inventory =
      jsonDecode(
            await simctl([
              'list',
              'devices',
              'available',
              '--json',
            ], const Duration(minutes: 1)),
          )
          as Map<String, dynamic>;
  final device = selectDevice(inventory);
  final udid = device['udid'] as String;
  stderr.writeln('Using ${device['name']} ($udid), state=${device['state']}');
  if (device['state'] != 'Booted' && device['state'] != 'Booting') {
    await simctl(['boot', udid], const Duration(minutes: 1));
  }
  // Launching Simulator.app does not guarantee a device has booted. Wait for
  // this specific device, with a deadline instead of polling an empty list.
  final status = await simctl([
    'bootstatus',
    udid,
    '-b',
  ], const Duration(minutes: 5));
  stderr.writeln(status);
  // Some simctl versions exit zero even for terminal migration failures.
  if (status.contains('Data Migration Failed')) {
    throw StateError('Simulator $udid failed data migration:\n$status');
  }
  return udid;
}
