import 'package:fllama/fllama.dart';
import 'package:fllama/misc/gbnf.dart';
import 'package:jinja/jinja.dart';

class FllamaInferenceRequest {
  int contextSize; // llama.cpp handled 0 fine. StableLM Zephyr became default (4096).
  String input;
  int maxTokens;
  String modelPath;
  String? modelMmprojPath;
  int numGpuLayers;
  /// Number of threads to use for inference.
  /// 
  /// 2 by default based on testing performed 2024 Feb 15, and model loading
  /// taking ~3 minutes when thread count exceeds 2 on Pixel Fold.
  /// 
  /// See class code for benchmarks from 2024 Feb 15.
  // Pixel Fold x StableLM 3B Zephyr, 2024 Feb 15:
  // - 99 gpu layers works, doesn't seem to affect performance or system load.
  // - default of 4 threads makes model loading take forever
  // - 1 thread / 0 layers: 4.7 
  // - 1 thread / 99 layers: 4.5
  // - 2 threads / 0 layers: 7.7
  // M2 Ultra MBP 2024 x LLaVA 1.6 Mistral 7B, 2024 Feb 15:
  // - 2 threads / 0 layers: 6.54
  // - 2 threads / 99 layers: 38.9
  // - 4 threads / 99 layers: 35.5
  // - 8 threads / 99 layers: 38.9
  int numThreads;
  double temperature;
  double penaltyFrequency;
  double penaltyRepeat;
  double topP;
  String? grammar;
  Function(String)? logger;

  FllamaInferenceRequest({
    required this.contextSize,
    required this.input,
    required this.maxTokens,
    required this.modelPath,
    required this.numGpuLayers,
    required this.penaltyFrequency,
    required this.penaltyRepeat,
    required this.temperature,
    required this.topP,
    this.grammar,
    this.modelMmprojPath,
    this.numThreads = 2,
    this.logger,
  });
}

class FllamaTokenizeRequest {
  final String input;
  final String modelPath;

  FllamaTokenizeRequest({required this.input, required this.modelPath});
}

Future<void> fllamaChatCompletionAsync(
    OpenAiRequest request, FllamaInferenceCallback callback) async {
  final template = await fllamaGetChatTemplate(request.modelPath);
  final eosToken = await fllamaGetEosToken(request.modelPath);
  final text = fllamaApplyChatTemplate(
    chatTemplate: template,
    eosToken: eosToken,
    request: request,
  );
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
  fllamaInferenceAsync(inferenceRequest, callback);
}

String fllamaApplyChatTemplate({
  required String chatTemplate,
  required OpenAiRequest request,
  required String eosToken,
}) {
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
    'eos_token': eosToken,
  });
}

const chatMlTemplate = '''
{%- for msg in messages -%}
<|im_start|>{{ msg.role }}
{{ msg.content }}<|im_end|>{% if not loop.last %}\n{% endif %}
{%- endfor %}
<|im_start|>assistant
''';

String fllamaJsonSchemaToGrammar(String jsonSchema) {
  return convertToJsonGrammar(jsonSchema);
}

String fllamaSanitizeChatTemplate(String builtInChatTemplate) {
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
  return chatTemplate;
}
