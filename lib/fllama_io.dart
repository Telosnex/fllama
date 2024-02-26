export 'io/fllama_io_inference.dart';
export 'io/fllama_io_tokenize.dart';

import 'dart:ffi';
import 'dart:io';

import 'package:ffi/ffi.dart';
import 'package:fllama/io/fllama_bindings_generated.dart';
import 'package:fllama/io/fllama_io_helpers.dart';
import 'package:fllama/fllama_universal.dart';

typedef FllamaInferenceCallback = void Function(String response, bool done);

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

// Returns empty string if no template provided / error when loading model.
// Cases:
// - Phi 2 has no template, either intended or in the model.
// - Mistral 7B via OpenHermes has no template and intends ChatML.

// example from StableLM Zephyr 3B:
// {% for message in messages %}
// {% if message['role'] == 'user' %}
// {{ '<|user|>
// ' + message['content'] + eos_token }}
// {% elif message['role'] == 'system' %}
// {{ '<|system|>
// ' + message['content'] + eos_token }}
// {% elif message['role'] == 'assistant' %}
// {{ '<|assistant|>
// '  + message['content'] + eos_token }}
// {% endif %}
// {% if loop.last and add_generation_prompt %}
// {{ '<|assistant|>' }}
// {% endif %}
// {% endfor %}
Future<String> fllamaGetChatTemplate(String modelPath) {
  final filenamePointer = stringToPointerChar(modelPath);
  final templatePointer =
      fllamaBindings.fllama_get_chat_template(filenamePointer);
  if (templatePointer == nullptr) {
    calloc.free(filenamePointer);
    return Future.value('');
  }
  final builtInChatTemplate = pointerCharToString(templatePointer);
  final answer = fllamaSanitizeChatTemplate(builtInChatTemplate);
  calloc.free(filenamePointer);
  return Future.value(answer);
}

Future<String> fllamaGetEosToken(String modelPath) async {
  final template =  await fllamaGetChatTemplate(modelPath);
  if (template == chatMlTemplate) {
    return '<|im_end|>';
  }
  final filenamePointer = stringToPointerChar(modelPath);
  final pointerChar = fllamaBindings.fllama_get_eos_token(filenamePointer);
  calloc.free(filenamePointer);
  return pointerCharToString(pointerChar);
}
