// fllama on web: the cases of dev/web_smoke, in stock browsers with
// `flutter drive -d web-server`. The tests are testWidgets: integration_test
// reports only testWidgets results to the driver, and a failing test() still
// ends with "All tests passed". Each test also checks what the browser ran:
// the Dart compiler, the wllama build, cross-origin isolation and threads.
//
// The test serves its files from web/test_models/ of the example (same
// origin, so the COOP/COEP headers of web_dev_config.yaml allow them):
//   Qwen3.5-0.8B-Q4_K_M.gguf, Qwen3.5-0.8B-mmproj-F16.gguf,
//   test_red.png, test_apple.png, test_orange.png, test_title.png,
//   not_a_model.gguf (a copy of test_red.png)
//
// flutter drive -d web-server --browser-name chrome --release \
//   --driver test_driver/integration_test.dart \
//   --target integration_test/web_llm_integration_test.dart [--wasm] \
//   --dart-define=FLLAMA_TEST_EXPECT_COMPILER=dart2js
library;

import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'dart:math';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:fllama_cpp/fllama_cpp.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:telosnex_web_test/telosnex_web_test.dart';

const _wasmBuild = bool.fromEnvironment('dart.tool.dart2wasm');

/// The compiler CI asked for: dart2js or dart2wasm. Empty accepts either.
const _expectedCompiler = String.fromEnvironment('FLLAMA_TEST_EXPECT_COMPILER');

/// A fixed thread count; 0 uses the default (logical CPUs - 1).
const _threadsOverride = int.fromEnvironment('FLLAMA_TEST_THREADS');

const _model = 'Qwen3.5-0.8B-Q4_K_M.gguf';
const _mmproj = 'Qwen3.5-0.8B-mmproj-F16.gguf';
const _timeout = Timeout(Duration(minutes: 15));

String _url(String file) => Uri.base.resolve('test_models/$file').toString();

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  final report = <String, Object?>{};
  // Every test's result (flutter drive passes failed plain test()s) and the
  // page console, which the driver saves to web_console.log as it runs.
  installWebTestSupport(binding);
  final browser = _Browser.read();
  // One CPU stays free, as on native: llama.cpp threads spin at barriers.
  final threads = _threadsOverride > 0
      ? _threadsOverride
      : max(1, browser.hardwareConcurrency - 1);

  setUpAll(() {
    report['browser'] = browser.toJson();
    report['threads'] = threads;
  });

  tearDownAll(() {
    // The console (with llama.cpp's log) is not in the report: the driver
    // writes it to web_console.log, in the CI artifact.
    binding.reportData = {...?binding.reportData, 'web': report};
  });

  /// Runs [request] with [threads] and records it in the report as [name].
  Future<_Run> chat(String name, OpenAiRequest request) async {
    markWebTestStep(name);
    final run = await _chat(request, threads: threads);
    report[name] = run.toJson();
    return run;
  }

  /// The checks of every loaded model: build, isolation, threads.
  void checkRuntime(String name) {
    final info = _runtimeInfo();
    report['$name.runtime'] = info;
    expect(info, isNotNull, reason: 'No model is loaded.');
    expect(
      info!['build'],
      browser.expectedWllamaBuild,
      reason: 'jspi=${browser.jspi}, memory64=${browser.memory64}, '
          'firefox=${browser.firefox}',
    );
    expect(
      info['crossOriginIsolated'],
      isTrue,
      reason: 'web_dev_config.yaml sends COOP/COEP; without them wllama '
          'runs one thread.',
    );
    if (threads > 1) {
      expect(info['multithread'], isTrue);
      expect(info['numThreads'], threads);
    }
  }

  testWidgets('the build is the compiler that the cell asked for',
      (tester) async {
    expect(browser.dartCompiler, isIn(['dart2js', 'dart2wasm']));
    if (_expectedCompiler.isNotEmpty) {
      expect(browser.dartCompiler, _expectedCompiler);
    }
  });

  group('text', () {
    testWidgets('bare_hi: the model replies to hi', (tester) async {
      final run = await chat(
        'bare_hi',
        _request(
          [Message(Role.user, 'hi')],
          maxTokens: 24,
          enableThinking: false,
        ),
      );
      run.expectOk();
      expect(run.content.trim(), isNotEmpty);
      checkRuntime('bare_hi');
    }, timeout: _timeout);

    testWidgets('concurrent_hi: two requests on two slots interleave',
        (tester) async {
      final runs = await _concurrent(
        2,
        (i) => _request(
          [
            Message(
              Role.user,
              'Respond with a short friendly greeting.\n\n'
              'Request index: $i.',
            ),
          ],
          maxTokens: 48,
          nParallel: 2,
          enableThinking: false,
        ),
        threads: threads,
      );
      report['concurrent_hi'] = runs.toJson();
      for (final run in runs.runs) {
        run.expectOk();
      }
      expect(
        runs.interleavings,
        greaterThan(0),
        reason: 'Two slots should stream both replies at the same time.',
      );
      checkRuntime('concurrent_hi');
    }, timeout: _timeout);

    testWidgets('more_requests_than_slots: three requests on one slot finish',
        (tester) async {
      final runs = await _concurrent(
        3,
        (i) => _request(
          [Message(Role.user, 'hi\n\nRequest index: $i.')],
          maxTokens: 24,
          nParallel: 1,
          enableThinking: false,
        ),
        threads: threads,
      );
      report['more_requests_than_slots'] = runs.toJson();
      for (final run in runs.runs) {
        run.expectOk();
        expect(run.content.trim(), isNotEmpty);
      }
    }, timeout: _timeout);

    testWidgets('concurrent_mixed_jinja: one request with its own template',
        (tester) async {
      final runs = await _concurrent(
        2,
        (i) => _request(
          [
            Message(
              Role.user,
              'Respond with a short friendly greeting.\n\n'
              'Request index: $i.',
            ),
          ],
          maxTokens: 48,
          nParallel: 2,
          enableThinking: false,
          jinjaTemplate: i == 0 ? 'chatml' : null,
        ),
        threads: threads,
      );
      report['concurrent_mixed_jinja'] = runs.toJson();
      for (final run in runs.runs) {
        run.expectOk();
        expect(run.content.trim(), isNotEmpty);
      }
    }, timeout: _timeout);
  });

  group('images', () {
    testWidgets('mmproj_hi: the model with mmproj replies to hi',
        (tester) async {
      final run = await chat(
        'mmproj_hi',
        _request(
          [Message(Role.user, 'hi')],
          mmproj: true,
          maxTokens: 48,
          enableThinking: false,
        ),
      );
      run.expectOk();
      expect(run.content.trim(), isNotEmpty);
      checkRuntime('mmproj_hi');
    }, timeout: _timeout);

    testWidgets('solid_red: names the color of a solid red image',
        (tester) async {
      final run = await chat(
        'solid_red',
        _request(
          [
            Message(
              Role.user,
              '${await _imageTag('test_red.png')}\n\n'
              'What single color fills this image? Answer with only the '
              'color name.',
            ),
          ],
          mmproj: true,
          maxTokens: 16,
          enableThinking: false,
        ),
      );
      run.expectOk();
      expect(run.content.trim().toLowerCase(), matches(RegExp(r'^red[.!]?$')));
    }, timeout: _timeout);

    // test_title.png is fllama_header.png at 640 x 320: 200 image tokens,
    // not 800. At 1280 x 640 this case took 2-5 min on CI; at 320 wide the
    // model no longer reads the title.
    testWidgets('image_title: reads the title in test_title.png',
        (tester) async {
      final run = await chat(
        'image_title',
        _request(
          [
            Message(
              Role.user,
              '${await _imageTag('test_title.png')}\n\n'
              'Respond with one word only, the title in the image.',
            ),
          ],
          mmproj: true,
          maxTokens: 128,
          enableThinking: false,
        ),
      );
      run.expectOk();
      expect(run.content.toLowerCase(), matches(RegExp('fll+ama')));
    }, timeout: _timeout);

    testWidgets('multiimage_title: reads the words of two images in order',
        (tester) async {
      final run = await chat(
        'multiimage_title',
        _request(
          [
            Message(
              Role.user,
              '${await _imageTag('test_apple.png')}\n'
              '${await _imageTag('test_orange.png')}\n\n'
              'Two images are attached. Respond with exactly the two words '
              'shown, in order, separated by one space.',
            ),
          ],
          mmproj: true,
          maxTokens: 128,
          enableThinking: false,
        ),
      );
      run.expectOk();
      expect(run.content.toLowerCase(), matches(RegExp('apple orange')));
    }, timeout: _timeout);

    // wllama picks its compat build (Safari's) when JSPI is missing. Hiding
    // WebAssembly.Suspending tests that build in Chrome too. Another context
    // size gives another model key, so the model loads again. Firefox never
    // ran this case in dev/web_smoke.
    testWidgets(
      'compat_solid_red: the compat build names the color of a red image',
      (tester) async {
        final wasm = globalContext['WebAssembly'] as JSObject;
        final suspending = wasm['Suspending'];
        wasm.delete('Suspending'.toJS);
        addTearDown(() {
          if (suspending != null) wasm['Suspending'] = suspending;
        });
        final run = await chat(
          'compat_solid_red',
          _request(
            [
              Message(
                Role.user,
                '${await _imageTag('test_red.png')}\n\n'
                'What single color fills this image? Answer with only the '
                'color name.',
              ),
            ],
            mmproj: true,
            maxTokens: 16,
            contextSize: 2048,
            enableThinking: false,
          ),
        );
        run.expectOk();
        expect(
          run.content.trim().toLowerCase(),
          matches(RegExp(r'^red[.!]?$')),
        );
        final info = _runtimeInfo();
        report['compat_solid_red.runtime'] = info;
        expect(info?['build'], 'compat');
        if (threads > 1) expect(info?['numThreads'], threads);
      },
      skip: browser.firefox,
      timeout: _timeout,
    );
  });

  testWidgets('load_error: a PNG as the model ends with a modelLoad error',
      (tester) async {
    final run = await _chat(
      OpenAiRequest(
        modelPath: _url('test_red.png'),
        messages: [Message(Role.user, 'hi')],
        maxTokens: 8,
        numGpuLayers: 0,
      ),
      threads: threads,
    );
    report['load_error'] = run.toJson();
    expect(run.done, isTrue);
    expect(run.error?.type, FllamaErrorType.modelLoad);
    expect(run.error?.message, isNotEmpty);
  }, timeout: _timeout);

  // load_error ends at the URL check (".gguf"). This file passes it, and
  // the load itself must fail: not_a_model.gguf holds the bytes of a PNG.
  testWidgets(
    'load_error_file: a .gguf file that is not a model ends with a '
    'modelLoad error',
    (tester) async {
      final run = await _chat(
        OpenAiRequest(
          modelPath: _url('not_a_model.gguf'),
          messages: [Message(Role.user, 'hi')],
          maxTokens: 8,
          numGpuLayers: 0,
        ),
        threads: threads,
      );
      report['load_error_file'] = run.toJson();
      expect(run.done, isTrue);
      expect(run.error?.type, FllamaErrorType.modelLoad);
      expect(run.error?.message, isNot(contains('.gguf')),
          reason: 'The URL check must not be what failed.');
    },
    timeout: const Timeout(Duration(minutes: 3)),
  );
}

OpenAiRequest _request(
  List<Message> messages, {
  required int maxTokens,
  int contextSize = 4096,
  bool mmproj = false,
  int? nParallel,
  bool? enableThinking,
  String? jinjaTemplate,
}) {
  return OpenAiRequest(
    modelPath: _url(_model),
    mmprojPath: mmproj ? _url(_mmproj) : null,
    messages: messages,
    maxTokens: maxTokens,
    // The sampling of dev/web_smoke, so the expected replies hold.
    temperature: 0,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 1.1,
    repeatPenalty: 1.1,
    contextSize: contextSize,
    // CPU: the runners have no usable WebGPU.
    numGpuLayers: 0,
    nParallel: nParallel,
    enableThinking: enableThinking,
    jinjaTemplate: jinjaTemplate,
  );
}

final _images = <String, String>{};

/// An `<img>` tag with [file] of test_models/ as a data URI.
Future<String> _imageTag(String file) async {
  final base64 = _images[file] ??= base64Encode(
    (await Dio().get<List<int>>(
      _url(file),
      options: Options(responseType: ResponseType.bytes),
    ))
        .data!,
  );
  return '<img src="data:image/png;base64,$base64">';
}

/// The result of [_chat]: every callback, and the reply content.
class _Run {
  final events = <({int atMs, String json, bool done, FllamaError? error})>[];
  final clock = Stopwatch()..start();
  int? firstTokenMs;

  bool get done => events.isNotEmpty && events.last.done;
  FllamaError? get error => events.isEmpty ? null : events.last.error;

  String get content {
    final buffer = StringBuffer();
    for (final event in events) {
      if (event.json.isEmpty) continue;
      final Object? decoded;
      try {
        decoded = jsonDecode(event.json);
      } on FormatException {
        continue;
      }
      for (final chunk in decoded is List ? decoded : [decoded]) {
        if (chunk is! Map) continue;
        final choices = chunk['choices'];
        if (choices is! List) continue;
        for (final choice in choices) {
          if (choice is! Map) continue;
          final delta = choice['delta'];
          final message = choice['message'];
          if (delta is Map && delta['content'] is String) {
            buffer.write(delta['content']);
          } else if (message is Map && message['content'] is String) {
            buffer.write(message['content']);
          }
        }
      }
    }
    return buffer.toString();
  }

  Map<String, Object?>? get timings {
    for (final event in events.reversed) {
      if (event.json.isEmpty) continue;
      try {
        final decoded = jsonDecode(event.json);
        for (final chunk in decoded is List ? decoded : [decoded]) {
          if (chunk is Map && chunk['timings'] is Map) {
            return (chunk['timings'] as Map).cast<String, Object?>();
          }
        }
      } on FormatException {
        continue;
      }
    }
    return null;
  }

  void expectOk() {
    expect(done, isTrue, reason: 'The request did not finish.');
    expect(error, isNull, reason: '${error?.type}: ${error?.message}');
    for (final event in events) {
      if (event.json.isEmpty) continue;
      expect(() => jsonDecode(event.json), returnsNormally,
          reason: 'Invalid JSON chunk: ${event.json}');
    }
  }

  Map<String, Object?> toJson() => {
        'done': done,
        'error': error == null ? null : '${error!.type}: ${error!.message}',
        'ms': clock.elapsedMilliseconds,
        'firstTokenMs': firstTokenMs,
        'content': content,
        'predictedPerSecond': timings?['predicted_per_second'],
      };
}

Future<_Run> _chat(OpenAiRequest request, {required int threads}) async {
  final run = _Run();
  final done = Completer<void>();
  final inference = FllamaInferenceRequest.fromOpenAiRequest(request)
    ..numThreads = threads;
  await fllamaInference(inference, (response, json, isDone, error) {
    if (response.isNotEmpty) run.firstTokenMs ??= run.clock.elapsedMilliseconds;
    run.events.add((
      atMs: run.clock.elapsedMilliseconds,
      json: json,
      done: isDone,
      error: error,
    ));
    if (isDone && !done.isCompleted) done.complete();
  });
  await done.future;
  return run;
}

class _Concurrent {
  final List<_Run> runs;

  /// The request of each streamed chunk, in arrival order.
  final List<int> order;

  _Concurrent(this.runs, this.order);

  int get interleavings {
    var n = 0;
    for (var i = 1; i < order.length; i++) {
      if (order[i] != order[i - 1]) n++;
    }
    return n;
  }

  Map<String, Object?> toJson() => {
        'interleavings': interleavings,
        'runs': [for (final r in runs) r.toJson()],
      };
}

/// Starts [count] requests at once and waits for all of them.
Future<_Concurrent> _concurrent(
  int count,
  OpenAiRequest Function(int index) request, {
  required int threads,
}) async {
  final order = <int>[];
  final runs = <_Run>[];
  final futures = <Future<void>>[];
  for (var i = 0; i < count; i++) {
    final run = _Run();
    runs.add(run);
    final done = Completer<void>();
    final inference = FllamaInferenceRequest.fromOpenAiRequest(request(i))
      ..numThreads = threads;
    await fllamaInference(inference, (response, json, isDone, error) {
      if (json.isNotEmpty && !isDone) order.add(i);
      if (response.isNotEmpty) {
        run.firstTokenMs ??= run.clock.elapsedMilliseconds;
      }
      run.events.add((
        atMs: run.clock.elapsedMilliseconds,
        json: json,
        done: isDone,
        error: error,
      ));
      if (isDone && !done.isCompleted) done.complete();
    });
    futures.add(done.future);
  }
  await Future.wait(futures);
  return _Concurrent(runs, order);
}

/// fllamaWebRuntimeInfoJs of fllama_web_init.js, or null.
Map<String, Object?>? _runtimeInfo() {
  final info = globalContext.callMethod<JSAny?>('fllamaWebRuntimeInfoJs'.toJS);
  final dart = info?.dartify();
  return dart is Map ? dart.cast<String, Object?>() : null;
}

/// What the browser supports, read before any model loads.
class _Browser {
  final String userAgent;
  final int hardwareConcurrency;
  final bool crossOriginIsolated;
  final bool jspi;
  final bool memory64;
  final bool webGpu;

  _Browser({
    required this.userAgent,
    required this.hardwareConcurrency,
    required this.crossOriginIsolated,
    required this.jspi,
    required this.memory64,
    required this.webGpu,
  });

  factory _Browser.read() {
    final wasm = globalContext['WebAssembly'] as JSObject;
    // A module with one 64-bit memory: valid only with Memory64.
    final memory64 = wasm
        .callMethod<JSBoolean>(
          'validate'.toJS,
          Uint8List.fromList([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0, 0, 0, //
            0x05, 0x03, 0x01, 0x04, 0x01,
          ]).toJS,
        )
        .toDart;
    final navigator = globalContext['navigator'] as JSObject;
    return _Browser(
      userAgent: (navigator['userAgent'] as JSString).toDart,
      hardwareConcurrency:
          (navigator['hardwareConcurrency'] as JSNumber?)?.toDartInt ?? 1,
      crossOriginIsolated:
          (globalContext['crossOriginIsolated'] as JSBoolean?)?.toDart ?? false,
      jspi: wasm.has('Suspending'),
      memory64: memory64,
      webGpu: navigator.has('gpu'),
    );
  }

  String get dartCompiler => _wasmBuild ? 'dart2wasm' : 'dart2js';

  bool get firefox => userAgent.contains('Firefox/');

  /// wllama uses its compat build when JSPI or Memory64 is missing, and
  /// never on Firefox.
  String get expectedWllamaBuild =>
      firefox || (jspi && memory64) ? 'default' : 'compat';

  Map<String, Object?> toJson() => {
        'userAgent': userAgent,
        'hardwareConcurrency': hardwareConcurrency,
        'dartCompiler': dartCompiler,
        'crossOriginIsolated': crossOriginIsolated,
        'jspi': jspi,
        'memory64': memory64,
        'webGpu': webGpu,
        'expectedWllamaBuild': expectedWllamaBuild,
      };
}
