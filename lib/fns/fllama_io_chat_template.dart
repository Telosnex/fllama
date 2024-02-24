import 'dart:ffi';

import 'package:ffi/ffi.dart';
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fns/fllama_io_helpers.dart';
import 'package:fllama/fns/fllama_universal.dart';

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
String fllamaGetChatTemplate(String modelPath) {
  final filenamePointer = stringToPointerChar(modelPath);
  final templatePointer =
      fllamaBindings.fflama_get_chat_template(filenamePointer);
  if (templatePointer == nullptr) {
    calloc.free(filenamePointer);
    return '';
  }
  final builtInChatTemplate = pointerCharToString(templatePointer);
  final answer = fllamaSanitizeChatTemplate(builtInChatTemplate);
  calloc.free(filenamePointer);
  return answer;
}

String fllamaGetEosToken(String modelPath) {
  final template = fllamaGetChatTemplate(modelPath);
  if (template == chatMlTemplate) {
    return '<|im_end|>';
  }
  final filenamePointer = stringToPointerChar(modelPath);
  final pointerChar = fllamaBindings.fflama_get_eos_token(filenamePointer);
  calloc.free(filenamePointer);
  return pointerCharToString(pointerChar);
}
