import 'dart:async';
import 'dart:convert';

import 'package:test/test.dart';

import '../scripts/boot_ios_simulator.dart';

Map<String, dynamic> device(
  String udid, {
  String state = 'Shutdown',
  String name = 'iPhone 16',
  bool available = true,
}) => {'udid': udid, 'state': state, 'name': name, 'isAvailable': available};

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

  test('cold boot waits for selected device', () async {
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
    'zero-exit bootstatus migration failure is not accepted as ready',
    () async {
      await expectLater(
        bootSimulator(
          simctl: (args, timeout) async {
            if (args.first == 'list') {
              return jsonEncode({
                'devices': {
                  'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
                    device('broken', state: 'Booting'),
                  ],
                },
              });
            }
            return 'Status=3, isTerminal=YES\nData Migration Failed';
          },
        ),
        throwsA(
          isA<StateError>().having(
            (e) => e.message,
            'message',
            contains('failed data migration'),
          ),
        ),
      );
    },
  );

  test('booting device is not booted again and timeout propagates', () async {
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
  });
}
