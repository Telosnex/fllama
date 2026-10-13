import 'dart:js_interop';

import 'web_runtime.g.dart';

/// Browser-only configuration of the fllama web runtime.
abstract final class FllamaWeb {
  /// The directory of the fllama web runtime files: `fllama_web_init.js` and
  /// `wllama/`.
  ///
  /// In a Flutter web build, the fllama build hook installs them in
  /// `web/native_prebuilt/fllama/` of the app, which is the default
  /// (native_prebuilt ADR 002). A relative URI resolves against the document
  /// base URI. Set it before the first fllama call.
  static Uri runtimeUri = Uri.parse('native_prebuilt/fllama/');
}

Future<void>? _loaded;
var _isLoaded = false;

/// Whether the fllama web runtime has loaded.
bool get fllamaWebRuntimeLoaded => _isLoaded;

/// Imports `fllama_web_init.js` once, with the query `v=<webRuntimeVersion>`
/// (ADR 002 D7). It defines the `window.fllama*Js` functions. A failed import
/// is retried on the next call.
Future<void> loadFllamaWebRuntime() {
  return _loaded ??= () async {
    try {
      await importModule(fllamaWebInitUrl().toString().toJS).toDart;
      _isLoaded = true;
    } catch (_) {
      _loaded = null;
      rethrow;
    }
  }();
}

/// The URL of `fllama_web_init.js`: [FllamaWeb.runtimeUri] resolved against
/// [baseUri] (default: the document base URI), with the version query.
Uri fllamaWebInitUrl({String? baseUri}) =>
    Uri.parse(baseUri ?? _documentBaseUri)
        .resolveUri(FllamaWeb.runtimeUri)
        .resolve('fllama_web_init.js')
        .replace(queryParameters: {'v': webRuntimeVersion});

@JS('document.baseURI')
external String get _documentBaseUri;
