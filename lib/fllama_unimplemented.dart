import 'package:fllama/fllama.dart';

typedef FllamaInferenceCallback = void Function(String response, bool done);

Future<String> fllamaGetChatTemplate(String modelPath) {
  throw UnimplementedError();
}

Future<String> fllamaGetEosToken(String modelPath) {
  throw UnimplementedError();
}

Future<void> fllamaInferenceAsync(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  throw UnimplementedError();
}

Future<int> fllamaTokenizeAsync(FllamaTokenizeRequest request) async {
  throw UnimplementedError();
}
