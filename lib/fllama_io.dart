export 'io/fllama_io_gguf.dart';
export 'io/fllama_io_gpu.dart';
export 'io/fllama_io_inference.dart';
export 'io/fllama_io_tokenize.dart';

import 'dart:ffi';
import 'dart:io';

import 'package:fllama_cpp/fllama_universal.dart';
import 'package:fllama_cpp/io/fllama_bindings_generated.dart';
import 'package:fllama_cpp/misc/openai.dart';

typedef FllamaWebLoadCallback =
    void Function(double downloadProgress, double loadProgress);

/// The dynamic library in which the symbols for [FllamaBindings] can be found.
final DynamicLibrary fllamaDylib = () {
  const String fllamaLibName = 'fllama';
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

/// Run chat inference. On native platforms this uses the native fllama backend.
Future<int> fllamaChatWeb(
  OpenAiRequest request,
  FllamaWebLoadCallback loadCallback,
  FllamaInferenceCallback callback,
) async {
  // ignore: avoid_print
  print(
    'WARNING: called fllamaChatWeb on native platform. Using fllamaChat instead.',
  );
  return fllamaChat(request, callback);
}

Future<void> fllamaWebModelDelete(String modelPath) async {
  // ignore: avoid_print
  print('WARNING: called fllamaWebModelDelete on native platform. Ignoring.');
}

Future<bool> fllamaWebIsModelDownloaded(String modelPath) async {
  // ignore: avoid_print
  print(
    'WARNING: called fllamaWebIsModelDownloaded on native platform. Returning false.',
  );
  return false;
}

Future<String?> fllamaWebPickModel() async {
  // ignore: avoid_print
  print(
    'WARNING: called fllamaWebPickModel on native platform. Returning null.',
  );
  return null;
}
