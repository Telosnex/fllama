import 'package:fllama/fllama.dart';
import 'package:fllama/misc/gbnf.dart';
import 'package:jinja/jinja.dart';

/// Parameters needed to run standard LLM inference. Use with [fllamaInference].
///
/// This is *not* what most people want to use. LLMs post-ChatGPT use a chat
/// template and an EOS token. Use [fllamaChat] instead if you expect this
/// sort of interface, i.e. an OpenAI-like API. It translates an OpenAI-like
/// request into a inference request.
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
  String? eosToken;

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
    this.eosToken,
    this.modelMmprojPath,
    this.numThreads = 2,
    this.logger,
  });
}

/// Represents a request to tokenize a string.
///
/// This is useful for identifying what messages will be in context when the LLM
/// is run. Use with [fllamaTokenize].
class FllamaTokenizeRequest {
  final String input;
  final String modelPath;

  FllamaTokenizeRequest({required this.input, required this.modelPath});
}

/// Run the LLM using the standard LLM chat interface. This is the most common
/// way to use FLLAMA.
///
/// What is the difference between this and inference? It automatically handles:
/// - Using the chat template in the GGUF (fallback to ChatML if none is found).
/// - Using the EOS token in the GGUF (fallback to ChatML EOS if none is found).
/// - If a tool / function is supplied, force the model to only output JSON that
///   is valid according to the tool's JSON schema.
Future<void> fllamaChat(
    OpenAiRequest request, FllamaInferenceCallback callback) async {
  final template = fllamaSanitizeChatTemplate(
      await fllamaChatTemplateGet(request.modelPath));
  final eosToken = template == chatMlTemplate
      ? chatMlEosToken
      : await fllamaEosTokenGet(request.modelPath);
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
          '[fllama] WARNING: More than one tool was specified. No grammar will be enforced. (via fllamaChat)');
      grammar = '';
    } else {
      grammar = request.tools.first.grammar;
      // ignore: avoid_print
      print('[fllama] Grammar to be enforced: $grammar');
    }
  } else {
    // ignore: avoid_print
    print('[fllama] No tools were specified. No grammar will be enforced.');
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
    eosToken: eosToken,
  );
  fllamaInference(inferenceRequest, callback);
}

/// Returns a string representing the input to an LLM model after applying the
/// chat template.
///
/// - [chatTemplate] is the raw chat template from the GGUF.
/// - [eosToken] is the raw EOS token from the GGUF.
/// - [request] is the OpenAI-like request.
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

const chatMlEosToken = '<|im_end|>';

/// Convert a JSON schema to GBNF, a grammar format used by llama.cpp to enforce
/// that the model returns certain outputs.
String fllamaJsonSchemaToGrammar(String jsonSchema) {
  return convertToJsonGrammar(jsonSchema);
}

/// Given a chat template embedded in a .gguf file, returns the chat template
/// itself, or a sensible fallback if the chat template is incorrect or missing.
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
    print('[fllama] Using built-in chat template: $chatTemplate');
    // ignore: avoid_print
  } else {
    // Assume models without one specified intend ChatML.
    // This is the case for Mistral 7B via OpenHermes.
    chatTemplate = chatMlTemplate;
    // ignore: avoid_print
    print('[fllama] Using ChatML because no built-in chat template was found.');
  }
  return chatTemplate;
}
