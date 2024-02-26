import 'package:fllama/fllama.dart';

typedef FllamaInferenceCallback = void Function(String response, bool done);

Future<String> fllamaChatTemplateGet(String modelPath) {
  throw UnimplementedError();
}

Future<String> fllamaEosTokenGet(String modelPath) {
  throw UnimplementedError();
}

Future<void> fllamaInference(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  throw UnimplementedError();
}

Future<int> fllamaTokenize(FllamaTokenizeRequest request) async {
  throw UnimplementedError();
}
