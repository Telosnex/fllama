import 'dart:convert';

import 'package:fllama_cpp/misc/openai.dart';
import 'package:test/test.dart';

void main() {
  test('serializes presence and repetition penalties independently', () {
    final request = OpenAiRequest(
      modelPath: 'model.gguf',
      topK: 20,
      topP: 0.95,
      minP: 0,
      presencePenalty: 1.5,
      repeatPenalty: 1,
    );
    final json = jsonDecode(request.toJsonString());
    expect(json['top_k'], 20);
    expect(json['top_p'], 0.95);
    expect(json['min_p'], 0);
    expect(json['presence_penalty'], 1.5);
    expect(json['repeat_penalty'], 1);
  });

  test('leaves unset sampling fields out', () {
    final json = jsonDecode(OpenAiRequest(modelPath: 'm').toJsonString());
    for (final key in [
      'top_k',
      'top_p',
      'min_p',
      'temperature',
      'presence_penalty',
      'repeat_penalty',
      'frequency_penalty',
    ]) {
      expect(json, isNot(contains(key)));
    }
  });
}
