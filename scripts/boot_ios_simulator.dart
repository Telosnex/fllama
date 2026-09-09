// Select and fully boot an available iPhone simulator. Only the UDID goes to
// stdout, so CI can use DEVICE_ID=$(dart scripts/boot_ios_simulator.dart).
import 'dart:convert';
import 'dart:io';

Future<void> main(List<String> args) async {
  try {
    final unsupported = args
        .where((argument) => argument != '--fresh')
        .toList();
    if (unsupported.isNotEmpty) {
      throw ArgumentError('Unsupported arguments: ${unsupported.join(' ')}');
    }
    stdout.writeln(await bootSimulator(fresh: args.contains('--fresh')));
  } catch (error) {
    stderr.writeln('Failed to boot iOS simulator: $error');
    exitCode = 1;
  }
}

typedef Simctl = Future<String> Function(List<String> args, Duration timeout);
typedef SimulatorCandidate = ({String runtime, Map<String, dynamic> device});

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

List<SimulatorCandidate> simulatorCandidates(
  Map<String, dynamic> inventory, {
  bool fresh = false,
}) {
  final candidates = <SimulatorCandidate>[];
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
  int devicePriority(Map<String, dynamic> device) {
    final name = device['name'] as String;
    if (name.contains('Pro')) return 2;
    if (name.contains('Air')) return 0;
    return 1;
  }

  int compareVersion(String a, String b) {
    final av = version(a);
    final bv = version(b);
    for (var i = 0; i < av.length || i < bv.length; i++) {
      final comparison = (i < bv.length ? bv[i] : 0).compareTo(
        i < av.length ? av[i] : 0,
      );
      if (comparison != 0) return comparison;
    }
    return 0;
  }

  candidates.sort((a, b) {
    // Existing-device mode reuses a booted phone. Fresh CI mode tries the
    // newest runtime first regardless of stale preinstalled simulator state.
    if (!fresh) {
      final state = statePriority(b.device).compareTo(statePriority(a.device));
      if (state != 0) return state;
    }
    final runtime = compareVersion(a.runtime, b.runtime);
    if (runtime != 0) return runtime;
    if (fresh) {
      // iPhone Air currently fails first-boot data migration on the Codemagic
      // image (and reproduced locally); prefer a Pro simulator in that runtime.
      final device = devicePriority(
        b.device,
      ).compareTo(devicePriority(a.device));
      if (device != 0) return device;
    }
    return (b.device['name'] as String).compareTo(a.device['name'] as String);
  });
  return candidates;
}

Map<String, dynamic> selectDevice(Map<String, dynamic> inventory) =>
    simulatorCandidates(inventory).first.device;

Future<String> bootSimulator({
  Simctl simctl = runSimctl,
  bool fresh = false,
}) async {
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
  final candidates = simulatorCandidates(inventory, fresh: fresh);
  if (!fresh) return _bootExisting(candidates.first.device, simctl);

  final errors = <String>[];
  final attemptedTargets = <String>{};
  for (final candidate in candidates) {
    final deviceType = candidate.device['deviceTypeIdentifier'] as String?;
    if (deviceType == null) continue;
    // A runtime often has many preinstalled phones of one type. One fresh
    // attempt per runtime/type pair is enough before trying another target.
    if (!attemptedTargets.add('${candidate.runtime}|$deviceType')) continue;

    String? udid;
    try {
      final name = 'fllama CI ${DateTime.now().microsecondsSinceEpoch}';
      udid = (await simctl([
        'create',
        name,
        deviceType,
        candidate.runtime,
      ], const Duration(minutes: 1))).trim();
      if (udid.isEmpty) {
        throw StateError('simctl create returned an empty UDID.');
      }
      stderr.writeln(
        'Created $name ($udid) using ${candidate.runtime} / $deviceType',
      );
      return await _boot(udid, name, simctl);
    } catch (error) {
      errors.add('${candidate.runtime} / $deviceType: $error');
      stderr.writeln(
        'Fresh simulator failed for ${candidate.runtime} / $deviceType: $error',
      );
      if (udid != null && udid.isNotEmpty) {
        await _deleteBestEffort(udid, simctl);
      }
    }
  }
  throw StateError(
    'Could not boot a fresh iPhone simulator from any installed runtime:\n'
    '${errors.join('\n')}',
  );
}

Future<String> _bootExisting(Map<String, dynamic> device, Simctl simctl) async {
  final udid = device['udid'] as String;
  final state = device['state'];
  final name = device['name'] as String;
  stderr.writeln('Using $name ($udid), state=$state');
  if (state != 'Booted' && state != 'Booting') {
    await simctl(['boot', udid], const Duration(minutes: 1));
  }
  return _waitForBoot(udid, name, simctl);
}

Future<String> _boot(String udid, String name, Simctl simctl) async {
  await simctl(['boot', udid], const Duration(minutes: 1));
  return _waitForBoot(udid, name, simctl);
}

Future<String> _waitForBoot(String udid, String name, Simctl simctl) async {
  // Wait for this specific device, with a deadline instead of polling an empty
  // list. Some simctl versions exit zero even for terminal migration failures.
  final status = await simctl([
    'bootstatus',
    udid,
    '-b',
  ], const Duration(minutes: 5));
  stderr.writeln(status);
  if (status.contains('Data Migration Failed')) {
    throw StateError('Simulator $udid failed data migration:\n$status');
  }
  stderr.writeln('$name ($udid) is ready.');
  return udid;
}

Future<void> _deleteBestEffort(String udid, Simctl simctl) async {
  try {
    await simctl(['shutdown', udid], const Duration(minutes: 1));
  } catch (_) {
    // It may already have stopped after a terminal boot failure.
  }
  try {
    await simctl(['delete', udid], const Duration(minutes: 1));
  } catch (error) {
    stderr.writeln('Could not delete failed simulator $udid: $error');
  }
}
