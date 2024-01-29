import 'package:fllama/fllama.dart';

typedef FllamaInferenceCallback = void Function(String response, bool done);

Future<String> fllamaInferenceAsync(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  throw UnimplementedError();
}

String fllamaGetChatTemplate(String modelPath) {
  throw UnimplementedError();
}

String fllamaGetEosToken(String modelPath) {
  throw UnimplementedError();
}

Future<String> fllamaChatCompletionAsync(
    OpenAiRequest openAiRequest, FllamaInferenceCallback callback) async {
  throw UnimplementedError();
}
