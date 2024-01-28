export 'fns/fllama_io_chat_template.dart';
export 'fns/fllama_io_chat_completion.dart';
export 'fns/fllama_io_inference.dart';
export 'fns/fllama_io_tokenize.dart';

import 'dart:ffi';
import 'dart:io';

import 'package:fllama/fllama_bindings_generated.dart';

typedef FllamaInferenceCallback = void Function(String response, bool done);

const String fllamaLibName = 'fllama';

/// The dynamic library in which the symbols for [FllamaBindings] can be found.
final DynamicLibrary fllamaDylib = () {
  if (Platform.isMacOS || Platform.isIOS) {
    return DynamicLibrary.open('$fllamaLibName.framework/$fllamaLibName');
  }
  if (Platform.isAndroid || Platform.isLinux) {
    return DynamicLibrary.open('lib$fllamaLibName.so');
  }
  if (Platform.isWindows) {
    return DynamicLibrary.open('$fllamaLibName.dll');
  }
  throw UnsupportedError('Unknown platform: ${Platform.operatingSystem}');
}();

/// The bindings to the native functions in [fllamaDylib].
final FllamaBindings fllamaBindings = FllamaBindings(fllamaDylib);
