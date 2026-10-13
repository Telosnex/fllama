@TestOn('browser')
@Timeout(Duration(seconds: 90))
library;

import 'dart:js_interop';

import 'package:fllama/fllama.dart';
import 'package:fllama/src/web_runtime.g.dart';
import 'package:fllama/src/web_runtime_loader.dart';
import 'package:test/test.dart';

/// The fllama web runtime on the files in lib/web/ (native_prebuilt ADR 002
/// D13). Install the generated files first:
/// `dart run native_prebuilt:web install-dev`.
///
/// The model is stories15M-q4_0.gguf from ggml-org/models, in
/// test/web_models/ (not in git; the release workflow downloads it).
void main() {
  final model = Uri.base.resolve('web_models/stories15M-q4_0.gguf').toString();
  setUpAll(() {
    FllamaWeb.runtimeUri = Uri.parse('packages/fllama/web/');
    // The test runner loads more files than the default buffer of 250
    // resource entries holds. Start with an empty, larger buffer.
    _clearResourceTimings();
    _setResourceTimingBufferSize(10000);
  });

  test('the init URL has the webVersion query', () {
    expect(
      fllamaWebInitUrl(baseUri: 'https://a.b/app/x.html').toString(),
      'https://a.b/app/packages/fllama/web/fllama_web_init.js'
      '?v=$webRuntimeVersion',
    );
  });

  test('wllama loads the model and tokenizes', () async {
    final count = await fllamaTokenize(
      FllamaTokenizeRequest(input: 'Once upon a time', modelPath: model),
    );
    expect(count, inInclusiveRange(3, 8));
  });

  // ADR 002 D7, I3.
  test('the runtime files load with the webVersion query', () async {
    await loadFllamaWebRuntime();
    final loaded = [
      for (final entry in _resourceEntries().toDart)
        Uri.parse((entry as _Entry).name),
    ].where((u) => u.path.contains('/packages/fllama/web/'));
    expect(loaded.map((u) => u.path.split('/web/').last).toSet(), {
      'fllama_web_init.js',
      'wllama/index.js',
    });
    for (final url in loaded) {
      expect(url.queryParameters['v'], webRuntimeVersion, reason: '$url');
    }
  });
}

@JS('performance.clearResourceTimings')
external void _clearResourceTimings();

@JS('performance.setResourceTimingBufferSize')
external void _setResourceTimingBufferSize(int size);

@JS('performance.getEntriesByType')
external JSArray<JSObject> _entries(String type);

JSArray<JSObject> _resourceEntries() => _entries('resource');

extension type _Entry._(JSObject _) implements JSObject {
  external String get name;
}
