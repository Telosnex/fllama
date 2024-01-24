import 'fllama_inference_request.dart';

typedef FllamaInferenceCallback = void Function(String response, bool done);

Future<String> fllamaInferenceAsync(
    FllamaInferenceRequest request, FllamaInferenceCallback callback) async {
  throw UnimplementedError();
}
