import 'dart:convert';

import 'package:fllama/fllama_universal.dart';
import 'package:fllama/misc/openai.dart';
import 'package:fllama/src/web_parallel_slots.dart';
import 'package:test/test.dart';

void main() {
  group('OpenAiRequest messages', () {
    List<dynamic> messagesOf(OpenAiRequest request) =>
        jsonDecode(request.toJsonString())['messages'] as List<dynamic>;

    test('keep content that is only whitespace', () {
      // llama.cpp rejects a message with neither content nor tool calls.
      final messages = messagesOf(
        OpenAiRequest(
          modelPath: 'm',
          messages: [Message(Role.assistant, '  \n')],
        ),
      );
      expect(messages.single['content'], '  \n');
    });

    test('keep empty content next to tool calls', () {
      final messages = messagesOf(
        OpenAiRequest(
          modelPath: 'm',
          messages: [
            Message(
              Role.assistant,
              '',
              toolCalls: [
                {
                  'id': 'a',
                  'type': 'function',
                  'function': {'name': 'f', 'arguments': '{}'},
                },
              ],
            ),
          ],
        ),
      );
      expect(messages.single['content'], '');
      expect(messages.single['tool_calls'], hasLength(1));
    });
  });

  test('chat requests let llama.cpp choose the thread count', () {
    final request = FllamaInferenceRequest.fromOpenAiRequest(
      OpenAiRequest(modelPath: 'm'),
    );
    // -1: llama.cpp uses one thread per physical core, as llama-server.
    expect(request.numThreads, -1);
  });

  group('web parallel slots', () {
    test('default to 1, because wllama splits the context between slots', () {
      expect(fllamaWebParallelSlots(OpenAiRequest(modelPath: 'm')), 1);
    });

    test('follow OpenAiRequest.nParallel', () {
      expect(
        fllamaWebParallelSlots(OpenAiRequest(modelPath: 'm', nParallel: 3)),
        3,
      );
    });
  });

  group('FllamaError.fromJson', () {
    test('reads the type and message', () {
      final error = FllamaError.fromJson(
        '{"type": "exceed_context_size", "message": "too long"}',
      );
      expect(error.type, FllamaErrorType.contextSizeExceeded);
      expect(error.message, 'too long');
    });

    test('keeps text that is not JSON as the message', () {
      final error = FllamaError.fromJson('Error: broken');
      expect(error.type, FllamaErrorType.other);
      expect(error.message, 'Error: broken');
    });

    test('uses other for an unknown type', () {
      expect(
        FllamaError.fromJson('{"type": "new", "message": "x"}').type,
        FllamaErrorType.other,
      );
    });
  });
}
