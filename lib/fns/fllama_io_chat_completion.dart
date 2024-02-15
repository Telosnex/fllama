import 'package:fllama/fllama_io.dart';
import 'package:fllama/model/openai.dart';
import 'package:fllama/fllama_inference_request.dart';
import 'package:jinja/jinja.dart';

Future<String> fllamaChatCompletionAsync(
    OpenAiRequest request, FllamaInferenceCallback callback) async {
  final text = fllamaApplyChatTemplate(request);
  final String grammar;
  if (request.tools.isNotEmpty) {
    if (request.tools.length > 1) {
      // ignore: avoid_print
      print(
          '[fllama] WARNING: More than one tool was specified. No grammar will be enforced. (via fllamaChatCompletionAsync)');
      grammar = '';
    } else {
      grammar = request.tools.first.grammar;
    }
  } else {
    grammar = '';
  }
  final inferenceRequest = FllamaInferenceRequest(
    contextSize: request.contextSize,
    input: text,
    maxTokens: request.maxTokens,
    modelPath: request.modelPath,
    modelMmprojPath: request.mmprojPath,
    numGpuLayers: request.numGpuLayers,
    penaltyFrequency: request.frequencyPenalty,
    penaltyRepeat: request.presencePenalty,
    temperature: request.temperature,
    topP: request.topP,
    grammar: grammar,
    logger: request.logger,
  );
  return fllamaInferenceAsync(inferenceRequest, callback);
}

const chatMlTemplate = '''
{%- for msg in messages -%}
<|im_start|>{{ msg.role }}
{{ msg.content }}<|im_end|>{% if not loop.last %}\n{% endif %}
{%- endfor %}
<|im_start|>assistant
''';

String fllamaApplyChatTemplate(OpenAiRequest request) {
  final builtInChatTemplate = fllamaGetChatTemplate(request.modelPath);

  final String chatTemplate;

  // Order is very important here, be careful.
  // ex. if isNotEmpty branch comes first, the check for an erroroneous
  // template never runs.
  if (builtInChatTemplate
      .contains('Only user and assistant roles are supported!')) {
    // There's a strange chat template first encountered in an early version of
    // LLaVa 1.6 x Mistral 7B.
    //
    // It is likely to be some sort of default template used by .gguf makers.
    //
    // It is too limited to be acceptable, as it strips out system messages.
    // Instead of using it, use ChatML.
    //
    // n.b. LLaVa 1.6 is actually supposed to use ChatML anyway, the template
    // in the model is incorrect.
    //
    // Template: ```{{ bos_token }}{% for message in messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if message['role'] == 'user' %}{{ '[INST] ' + message['content'] + ' [/INST]' }}{% elif message['role'] == 'assistant' %}{{ message['content'] + eos_token}}{% else %}{{ raise_exception('Only user and assistant roles are supported!') }}{% endif %}{% endfor %}```
    chatTemplate = chatMlTemplate;
    // ignore: avoid_print
    print(
        '[fllama] Using ChatML because built-in chat template seems erroneous. (contains "Only user and assistant roles are supported!")');
  } else if (builtInChatTemplate.isNotEmpty) {
    // First observed with https://huggingface.co/brittlewis12/Memphis-CoT-3B-GGUF
    // Replacing with trim() did not work. That was unexpected because the Jinja
    // package seems to indicate Dart instance methods are available.
    chatTemplate = builtInChatTemplate.replaceAll('.strip()', '');
    // ignore: avoid_print
    print('[fllama] Using built-in chat template.');
    // ignore: avoid_print
    print('[fllama] template: $chatTemplate');
  } else {
    // Assume models without one specified intend ChatML.
    // This is the case for Mistral 7B via OpenHermes.
    chatTemplate = chatMlTemplate;
  }

  final jsonMessages = <Map<String, dynamic>>[];
  for (final message in request.messages) {
    jsonMessages.add({
      'role': message.role.openAiName,
      'content': message.text,
    });
  }

  if (request.tools.isNotEmpty) {
    final tools = request.tools.map((tool) {
      return tool.typescriptDefinition;
    }).join('\n\n');
    jsonMessages.add({
      'role': 'user',
      'content':
          '$tools\n\nThose are our tools, Typescript functions that take a JSON object as an argument.\nSilently pick a tool. Now, write a JSON object to use as an argument for that tool, based on our earlier conversation. The answer is validated JSON format representing a JSON object.',
    });
  }

  // There's a strange chat template first encountered in an early version of
  // LLaVa 1.6 x Mistral 7B.
  //
  // It is likely to be some sort of default template used by .gguf makers.
  //
  // It has a raise_exception function that is not defined in the template,
  // so it will cause an error.
  //
  // The template in the LLaVA 1.6 model model was incorrect in several ways,
  // and currently templates like it (templates that contain only user and
  // assistant roles are supported) are replaced with ChatML.
  //
  // However, it seems sensible to maintain this error.
  final globals = <String, Function>{
    'raise_exception': (String message) {
      // ignore: avoid_print
      print('[fllama] chat template asked to raise_exception: $message');
      return '';
    }
  };

  final env = Environment(
    globals: globals,
    loader: null,
    leftStripBlocks: true,
    trimBlocks: true,
    keepTrailingNewLine: true,
  );

  final template = env.fromString(chatTemplate, globals: globals);
  return template.render({
    'messages': jsonMessages,
    'add_generation_prompt': true,
    'eos_token': fllamaGetEosToken(request.modelPath)
  });
}
