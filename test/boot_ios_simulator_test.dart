import 'dart:async';
import 'dart:convert';

import 'package:test/test.dart';

import '../scripts/boot_ios_simulator.dart';

Map<String, dynamic> device(
  String udid, {
  String state = 'Shutdown',
  String name = 'iPhone 16',
  bool available = true,
  String type = 'com.apple.CoreSimulator.SimDeviceType.iPhone-16',
}) => {
  'udid': udid,
  'state': state,
  'name': name,
  'isAvailable': available,
  'deviceTypeIdentifier': type,
};

void main() {
  test('selects newest available iPhone when nothing is booted', () {
    final inventory = {
      'devices': {
        'com.apple.CoreSimulator.SimRuntime.iOS-18-6': [device('old')],
        'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [device('new')],
        'com.apple.CoreSimulator.SimRuntime.iOS-27-0': [
          device('unavailable', available: false),
          device('ipad', name: 'iPad Pro'),
        ],
        'com.apple.CoreSimulator.SimRuntime.tvOS-27-0': [device('not-ios')],
      },
    };
    expect(selectDevice(inventory)['udid'], 'new');
  });

  test('reuses booted iPhone over newer shutdown device', () {
    expect(
      selectDevice({
        'devices': {
          'com.apple.CoreSimulator.SimRuntime.iOS-18-6': [
            device('booted', state: 'Booted'),
          ],
          'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [device('new')],
        },
      })['udid'],
      'booted',
    );
  });

  test('fresh mode orders candidates by newest runtime, not state', () {
    final candidates = simulatorCandidates({
      'devices': {
        'com.apple.CoreSimulator.SimRuntime.iOS-18-6': [
          device('booted', state: 'Booted'),
        ],
        'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [device('new')],
      },
    }, fresh: true);
    expect(candidates.first.device['udid'], 'new');
  });

  test('fresh mode prefers Pro over Air in the same runtime', () {
    final candidates = simulatorCandidates({
      'devices': {
        'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
          device('air', name: 'iPhone Air', type: 'air-type'),
          device('pro', name: 'iPhone 17 Pro Max', type: 'pro-type'),
        ],
      },
    }, fresh: true);
    expect(candidates.map((candidate) => candidate.device['udid']), [
      'pro',
      'air',
    ]);
  });

  test('missing simulator has actionable error', () {
    expect(
      () => selectDevice({'devices': <String, dynamic>{}}),
      throwsA(
        isA<StateError>().having(
          (e) => e.message,
          'message',
          contains('No available iPhone simulator'),
        ),
      ),
    );
  });

  test('cold boot waits for selected existing device', () async {
    final calls = <List<String>>[];
    final udid = await bootSimulator(
      simctl: (args, timeout) async {
        calls.add(args);
        if (args.first == 'list') {
          return jsonEncode({
            'devices': {
              'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [device('cold')],
            },
          });
        }
        if (args.first == 'bootstatus') {
          expect(timeout, const Duration(minutes: 5));
        }
        return '';
      },
    );
    expect(udid, 'cold');
    expect(calls, [
      ['list', 'devices', 'available', '--json'],
      ['boot', 'cold'],
      ['bootstatus', 'cold', '-b'],
    ]);
  });

  test(
    'fresh mode creates rather than migrating a preinstalled device',
    () async {
      final calls = <List<String>>[];
      final udid = await bootSimulator(
        fresh: true,
        simctl: (args, timeout) async {
          calls.add(args);
          return switch (args.first) {
            'list' => jsonEncode({
              'devices': {
                'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
                  device('stale'),
                ],
              },
            }),
            'create' => 'fresh-id\n',
            _ => '',
          };
        },
      );
      expect(udid, 'fresh-id');
      expect(calls, [
        ['list', 'devices', 'available', '--json'],
        [
          'create',
          startsWith('fllama CI '),
          'com.apple.CoreSimulator.SimDeviceType.iPhone-16',
          'com.apple.CoreSimulator.SimRuntime.iOS-26-0',
        ],
        ['boot', 'fresh-id'],
        ['bootstatus', 'fresh-id', '-b'],
      ]);
    },
  );

  test(
    'fresh mode falls back after migration failure and deletes failure',
    () async {
      final calls = <List<String>>[];
      final udid = await bootSimulator(
        fresh: true,
        simctl: (args, timeout) async {
          calls.add(args);
          if (args.first == 'list') {
            return jsonEncode({
              'devices': {
                'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
                  device('new', type: 'new-type'),
                ],
                'com.apple.CoreSimulator.SimRuntime.iOS-18-6': [
                  device('old', type: 'old-type'),
                ],
              },
            });
          }
          if (args.first == 'create') {
            return args.last.contains('26-0') ? 'failed-id' : 'working-id';
          }
          if (args.first == 'bootstatus' && args[1] == 'failed-id') {
            return 'Status=3, isTerminal=YES\nData Migration Failed';
          }
          return '';
        },
      );
      expect(udid, 'working-id');
      expect(calls, contains(equals(['shutdown', 'failed-id'])));
      expect(calls, contains(equals(['delete', 'failed-id'])));
      expect(calls, contains(equals(['bootstatus', 'working-id', '-b'])));
    },
  );

  test(
    'booting existing device is not booted again and timeout propagates',
    () async {
      final calls = <List<String>>[];
      await expectLater(
        bootSimulator(
          simctl: (args, timeout) async {
            calls.add(args);
            if (args.first == 'list') {
              return jsonEncode({
                'devices': {
                  'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
                    device('starting', state: 'Booting'),
                  ],
                },
              });
            }
            expect(timeout, const Duration(minutes: 5));
            throw TimeoutException('bootstatus');
          },
        ),
        throwsA(isA<TimeoutException>()),
      );
      expect(calls.last, ['bootstatus', 'starting', '-b']);
      expect(calls, hasLength(2));
    },
  );
}
