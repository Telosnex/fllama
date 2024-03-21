import 'package:fllama/fllama.dart';

typedef FllamaInferenceCallback = void Function(String response, bool done);

/// Returns the chat template embedded in the .gguf file.
/// If none is found, returns an empty string.
/// 
/// See [fllamaSanitizeChatTemplate] for using sensible fallbacks for gguf
/// files that don't have a chat template or have incorrect chat templates.
Future<String> fllamaChatTemplateGet(String modelPath) {
  throw UnimplementedError();
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

/// Returns the number of tokens in [request.input].
/// 
/// Useful for identifying what messages will be in context when the LLM is run.
Future<int> fllamaTokenize(FllamaTokenizeRequest request) async {
  throw UnimplementedError();
}
