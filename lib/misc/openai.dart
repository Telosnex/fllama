import 'package:fllama/misc/openai_tool.dart';

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

class OpenAiRequest {
  final List<Message> messages;
  final List<Tool> tools;
  final double temperature;
  final int maxTokens;
  final double topP;
  final double frequencyPenalty;
  final double presencePenalty;
  // Not in OpenAI, but used by llama.
  final String modelPath;
  final String? mmprojPath;
  final int numGpuLayers;
  final int contextSize;
  final Function(String)? logger;

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
    //
    // Following arguments aren't actually in OpenAI, but are used by Fllama.
    //
    //
    // Path to model's gguf.
    required this.modelPath,
    // Path to mmproj's gguf. (optional, only used for multimodal models)
    this.mmprojPath,
    // Number of layers to run on GPU. 0 means all layers on CPU. 99 means all
    // layers on GPU.
    this.numGpuLayers = 0,
    // ultra-safe for mobile inference, but rather small: ChatGPT launched with
    // 4096, today it has 16384. 1000 tokens ~= 3 pages ~= 750 words ~= 3 
    // minutes reading time.
    this.contextSize = 2048, 
    // Optional logger.
    this.logger,
  });
}
