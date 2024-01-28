enum Role {
  assistant,
  system,
  user;

  String get openAiName {
    switch (this) {
      case Role.assistant:
        return 'assistant';
      case Role.system:
        return 'system';
      case Role.user:
        return 'user';
    }
  }
}

class Message {
  final Role role;
  final String text;

  Message(this.role, this.text);
}

class Tool {
  final String jsonSchema;
  final String name;

  Tool(this.name, this.jsonSchema);
}

class OpenAiRequest {
  final List<Message> messages;
  final List<Tool> tools;
  final double temperature;
  final int maxTokens;
  final double topP;
  final double frequencyPenalty;
  final double presencePenalty;
  final String modelPath;
  final int numGpuLayers;

  OpenAiRequest({
    this.messages = const [],
    this.tools = const [],
    // Randomness of the output.
    // Higher numbers mean more likelihood of non-top tokens being chosen.
    // 0 <= temperature <= any positive number
    this.temperature = 0.7,
    // 333 * 3/4 word per token ~= 250 words ~= 1 page ~= 1 minute reading time
    this.maxTokens = 333,
    // Percent of tokens to consider. 1.0 means all tokens are considered.
    // 0.05 means only the top 5% of tokens are considered.
    this.topP = 1.0,
    this.frequencyPenalty = 0.0,
    // Match default penalty_repeat of 1.1 in llama.cpp.
    this.presencePenalty = 1.1,
    // Not in OpenAI, but used by Fllama.
    required this.modelPath,
    this.numGpuLayers = 0,
  });
}
