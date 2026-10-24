import 'dart:convert';

import 'package:fllama/misc/openai.dart';
import 'package:test/test.dart';

void main() {
  // Audit item 3: wllama, like llama-server, reads enable_thinking only from
  // chat_template_kwargs. Native fllama reads the top-level field.
  for (final enabled in [true, false]) {
    test('enableThinking: $enabled reaches both native and web', () {
      final json = jsonDecode(
        OpenAiRequest(modelPath: 'm', enableThinking: enabled).toJsonString(),
      );
      expect(json['enable_thinking'], enabled);
      expect(json['chat_template_kwargs'], {'enable_thinking': enabled});
    });
  }

  test('no enableThinking leaves the template default', () {
    final json = jsonDecode(OpenAiRequest(modelPath: 'm').toJsonString());
    expect(json, isNot(contains('enable_thinking')));
    expect(json, isNot(contains('chat_template_kwargs')));
  });
}
