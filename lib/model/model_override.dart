import 'package:fllama/fllama.dart';

/// Overrides default settings for a model.
///
/// This is a frustrating but necessary part for keeping up with the latest
/// models.
///
/// For instance, over the last week, 2 cutting edge local models came out:
/// Llama 3 8B and Phi-3 3.8B.
///
/// There's a cacophony of errors across the original model makers, the chat
/// templates embedded in GGUFs they provided, and llama.cpp itself.
///
/// Recognizing the model via their special chat template tokens allows us to
/// A) override erroneous templates
/// B) inject special prompts to show the model how to end its messages.
sealed class ModelOverride {
  /// Chat template to use.
  String get template;

  /// Placed before the first message.
  String get bosToken;

  /// Placed after the last message.
  String get eosToken;

  bool matches(String template);
}

/// Overrides for the Llama 3 model.
///
/// Source: https://llama.meta.com/docs/model-cards-and-prompt-formats/meta-llama-3/
class Llama3ChatTemplate extends ModelOverride {
  @override
  String get template => '''
<|begin_of_text|>{% for message in messages %}<|start_header_id|>{{ message['role'] }}<|end_header_id|>

{{ message['content'] }}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>
''';

  @override
  String get bosToken => '';

  @override
  String get eosToken => '';

  @override
  bool matches(String template) {
    const sigil = '<|start_header_id|>';
    return template.contains(sigil);
  }
}

/// Overrides for the Phi 3 model.
///
/// Source: https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf
class Phi3ChatTemplate extends ModelOverride {
  @override
  String get template => '''
{% for message in messages %}<|{{ message['role'] }}|>
{% if message['content'] %}{{ message['content'] }}{% else %}[Empty message]{% endif %}<|end|>
{% endfor %}<|assistant|>
''';

  @override
  String get bosToken => '<s>';

  @override
  String get eosToken => '';

  @override
  List<Message> get messages => [
      
      ];

  @override
  bool matches(String template) {
    const sigil = '<|end|>';
    return template.contains(sigil);
  }
}
