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

  // Audit item 5: chat templates match a tool result to its call by id.
  test('a tool message sends tool_call_id', () {
    final json = jsonDecode(
      OpenAiRequest(
        modelPath: 'm',
        messages: [Message(Role.tool, '{"t": 21}', toolCallId: 'call_1')],
      ).toJsonString(),
    );
    expect((json['messages'] as List).single['tool_call_id'], 'call_1');
  });

  // Audit item 4: llama-server's request fields.
  test('sends seed, stop, grammar and a JSON schema', () {
    final schema = {
      'type': 'object',
      'properties': {
        'answer': {'type': 'integer'},
      },
    };
    final json = jsonDecode(
      OpenAiRequest(
        modelPath: 'm',
        seed: 7,
        stop: ['\n\n', 'END'],
        jsonSchema: jsonEncode(schema),
      ).toJsonString(),
    );
    expect(json['seed'], 7);
    expect(json['stop'], ['\n\n', 'END']);
    expect(json['response_format'], {
      'type': 'json_schema',
      'json_schema': {'schema': schema},
    });
    expect(
      jsonDecode(
        OpenAiRequest(modelPath: 'm', grammar: 'root ::= "a"').toJsonString(),
      )['grammar'],
      'root ::= "a"',
    );
  });

  test('leaves unset request fields out', () {
    final json = jsonDecode(OpenAiRequest(modelPath: 'm').toJsonString());
    for (final key in ['seed', 'stop', 'grammar', 'response_format']) {
      expect(json, isNot(contains(key)));
    }
    final message =
        (jsonDecode(
                  OpenAiRequest(
                    modelPath: 'm',
                    messages: [Message(Role.user, 'hi')],
                  ).toJsonString(),
                )['messages']
                as List)
            .single;
    expect(message, isNot(contains('tool_call_id')));
  });
}
