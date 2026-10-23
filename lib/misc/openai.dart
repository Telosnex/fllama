import 'dart:convert';

import 'package:fllama/misc/openai_tool.dart';

enum Role {
  assistant,
  system,
  tool,
  user;

  String get openAiName {
    switch (this) {
      case Role.assistant:
        return 'assistant';
      case Role.system:
        return 'system';
      case Role.user:
        return 'user';
      case Role.tool:
        return 'tool';
    }
  }
}

class Message {
  final Role role;

  /// Message text.
  ///
  /// For multimodal image input, include one or more data-URI image tags in
  /// user message text and set [OpenAiRequest.mmprojPath]:
  ///
  /// ```dart
  /// Message(
  ///   Role.user,
  ///   '<img src="data:image/jpeg;base64,...">\n\nWhat is this?',
  /// )
  /// ```
  ///
  /// Native llama.cpp consumes this image-tag form directly. On web, fllama
  /// converts matching `<img src="data:image/...;base64,...">` tags into
  /// wllama v3 image content parts before calling `createChatCompletion`.
  final String text;

  /// Optional name of tool in the message.
  final String? toolResponseName;
  final List<Map<String, dynamic>>? toolCalls;

  Message(this.role, this.text, {this.toolCalls, this.toolResponseName});
}

/// Corresponds to COMMON_CHAT_TOOL_CHOICE_* in llama.cpp.
///
/// In OpenAI's API, required must specify a tool name and guarantees a
/// response with that tool.
///
/// To replicate that behavior, pass required with a single tool in [tools].
enum ToolChoice {
  auto,
  none,
  required;

  String get jsonName {
    switch (this) {
      case ToolChoice.auto:
        return 'auto';
      case ToolChoice.none:
        return 'none';
      case ToolChoice.required:
        return 'required';
    }
  }
}

class OpenAiRequest {
  final List<Message> messages;
  final List<Tool> tools;
  final int maxTokens;

  /// Sampling. null uses the value that the GGUF file recommends, else
  /// llama.cpp's default, as llama-server does.
  final double? temperature;
  final double? topP;
  final int? topK;
  final double? minP;
  final double? frequencyPenalty;

  /// Additive penalty for a token that already appeared. 0 is off.
  final double? presencePenalty;

  /// Multiplicative repetition penalty. 1 is off.
  final double? repeatPenalty;
  // Not in OpenAI, but used by llama.
  final String modelPath;
  final String? mmprojPath;
  final int numGpuLayers;
  final int contextSize;
  final int? nParallel;
  final String? jinjaTemplate;
  final Function(String)? logger;
  final ToolChoice? toolChoice;

  /// Whether templates that support reasoning should start a thinking block.
  /// null preserves the backend default.
  final bool? enableThinking;

  /// Optional: path to an MTP assistant/drafter GGUF to enable Multi-Token
  /// Prediction speculative decoding. Native-only; ignored on web.
  final String? draftModelPath;

  /// Optional: tokens to draft per step when [draftModelPath] is set.
  final int? draftNMax;

  /// Optional: minimum drafter top-token probability required to keep drafting.
  /// Higher values stop low-confidence long drafts before they become expensive
  /// rejected work. For Gemma 4 chat on Metal, ~0.95–0.99 is much safer than
  /// llama.cpp's default 0.0 when [draftNMax] is large.
  final double? draftPMin;

  /// Optional: [FllamaGpuMemoryInfo.deviceKey] of the GPU that the model may
  /// use. null is Auto. Native-only; ignored on web.
  final String? gpuDeviceKey;

  String toJsonString() {
    final Map<String, dynamic> json = {
      'messages': messages
          .map(
            (m) => {
              'role': m.role.openAiName,
              // Always set: llama.cpp rejects a message with neither content
              // nor tool calls, such as a reply that was only thinking.
              'content': m.text,
              if (m.toolResponseName != null) 'name': m.toolResponseName,
              if (m.toolCalls?.isNotEmpty == true) 'tool_calls': m.toolCalls,
            },
          )
          .toList(),
      'tools': tools.map((t) {
        return {
          'type': 'function',
          'function': {
            'name': t.name,
            'description': t.description,
            'parameters': jsonDecode(t.jsonSchema),
          },
        };
      }).toList(),
      'max_tokens': maxTokens,
      if (temperature != null) 'temperature': temperature,
      if (topP != null) 'top_p': topP,
      if (topK != null) 'top_k': topK,
      if (minP != null) 'min_p': minP,
      if (repeatPenalty != null) 'repeat_penalty': repeatPenalty,
      if (frequencyPenalty != null) 'frequency_penalty': frequencyPenalty,
      if (presencePenalty != null) 'presence_penalty': presencePenalty,
      if (toolChoice != null) 'tool_choice': toolChoice?.jsonName,
      if (jinjaTemplate != null) 'jinja_template': jinjaTemplate,
      if (enableThinking != null) 'enable_thinking': enableThinking,
    };
    return jsonEncode(json);
  }

  OpenAiRequest({
    this.messages = const [],
    this.tools = const [],
    this.toolChoice,
    // Randomness of the output.
    // Higher numbers mean more likelihood of non-top tokens being chosen.
    // 0 <= temperature <= any positive number
    this.temperature,
    // 333 * 3/4 word per token ~= 250 words ~= 1 page ~= 1 minute reading time
    this.maxTokens = 333,
    // Share of probability to consider. 1.0 considers all tokens.
    this.topP,
    this.topK,
    this.minP,
    this.repeatPenalty,
    this.frequencyPenalty,
    this.presencePenalty,
    //
    // Following arguments aren't actually in OpenAI, but are used by Fllama.
    //
    //
    // Path to model's gguf.
    required this.modelPath,
    // Path to mmproj's gguf. (optional, only used for multimodal models)
    this.mmprojPath,
    // Number of layers to run on GPU. -1 means auto: llama.cpp fits the
    // layers to free GPU memory. 0 means all layers on CPU.
    this.numGpuLayers = 0,
    // ultra-safe for mobile inference, but rather small: ChatGPT launched with
    // 4096, today it has 16384. 1000 tokens ~= 3 pages ~= 750 words ~= 3
    // minutes reading time.
    this.contextSize = 2048,
    // Optional web-only override for llama.cpp n_parallel. Native fllama sets
    // its own default internally. When null, web uses the native-aligned
    // fllama_web_init.js default.
    this.nParallel,
    // Optional logger.
    this.logger,
    this.jinjaTemplate,
    this.enableThinking,
    // Optional MTP/speculative drafter GGUF (native-only).
    this.draftModelPath,
    this.draftNMax,
    this.draftPMin,
    this.gpuDeviceKey,
  });
}
