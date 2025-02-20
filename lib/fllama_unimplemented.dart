import 'dart:ffi';

import 'package:ffi/ffi.dart';
import 'package:fllama/fllama.dart';
import 'package:fllama/fllama_io.dart';
import 'package:fllama/io/fllama_io_helpers.dart';

typedef FllamaInferenceCallback = void Function(String response, String openaiResponseJsonString, bool done);
typedef FllamaMlcLoadCallback = void Function(
    double downloadProgress, double loadProgress);
    
/// Returns the chat template embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaSanitizeChatTemplate] for using sensible fallbacks for gguf
/// files that don't have a chat template or have incorrect chat templates.
Future<String> fllamaChatTemplateGet(String modelPath) {
  throw UnimplementedError();
}

/// Returns the BOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaApplyChatTemplate] for using sensible fallbacks for gguf
/// files that don't have an EOS token or have incorrect EOS tokens.
Future<String> fllamaBosTokenGet(String modelPath) async {
  final filenamePointer = stringToPointerChar(modelPath);
  final eosTokenPointer = fllamaBindings.fllama_get_bos_token(filenamePointer);
  calloc.free(filenamePointer);
  if (eosTokenPointer == nullptr) {
    return '';
  }
  return pointerCharToString(eosTokenPointer);
}

/// Returns the EOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaApplyChatTemplate] for using sensible fallbacks for gguf
/// files that don't have an EOS token or have incorrect EOS tokens.
Future<String> fllamaEosTokenGet(String modelPath) {
  throw UnimplementedError();
}

/// Runs standard LLM inference. The future returns immediately after being
/// called. [callback] is called on each new output token with the response and
/// a boolean indicating whether the response is the final response.
///
/// This is *not* what most people want to use. LLMs post-ChatGPT use a chat
/// template and an EOS token. Use [fllamaChat] instead if you expect this
/// sort of interface, i.e. an OpenAI-like API.
Future<int> fllamaInference(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  throw UnimplementedError();
}

/// Use MLC's web JS SDK to do chat inference.
/// If not on web, this will fallback to using [fllamaChat].
///
/// llama.cpp converted to WASM is very slow compared to native inference on the
/// same platform, because it does not use the GPU.
///
/// MLC uses WebGPU to achieve ~native inference speeds.
Future<int> fllamaChatMlcWeb(
    OpenAiRequest request,
    FllamaMlcLoadCallback loadCallback,
    FllamaInferenceCallback callback) async {
  throw UnimplementedError();
}

Future<void> fllamaMlcWebModelDelete(String modelId) async {  
  throw UnimplementedError();
}

Future<bool> fllamaMlcIsWebModelDownloaded(String modelId) async {  
  throw UnimplementedError();
}

/// Cancels the inference with the given [requestId].
///
/// It is recommended you do _not_ update your state based on this.
/// Use the callbacks, like you would generally.
///
/// This is supported via:
/// - Inferences that have not yet started will call their callback with `done`
/// set to `true` and an empty string.
/// - Inferences that have started will call their callback with `done` set to
/// `true` and the final output of the inference.
void fllamaCancelInference(int requestId) {
  throw UnimplementedError();
}

/// Returns the number of tokens in [request.input].
///
/// Useful for identifying what messages will be in context when the LLM is run.
Future<int> fllamaTokenize(FllamaTokenizeRequest request) async {
  throw UnimplementedError();
}
