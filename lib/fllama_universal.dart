import 'dart:convert';

import 'package:fllama/fllama.dart';
import 'package:fllama/misc/gbnf.dart';

/// Called for each update of an inference request.
///
/// [response] is the text so far. [openaiResponseJsonString] is the
/// llama-server/OpenAI-style chunk of this update, or empty. [done] is true
/// for the last call, and only the last call. [error] is set only on the last
/// call, if the request failed; [response] then holds the text before the
/// failure. A cancelled request ends with [done] and no [error].
typedef FllamaInferenceCallback =
    void Function(
      String response,
      String openaiResponseJsonString,
      bool done,
      FllamaError? error,
    );

/// What kind of failure a [FllamaError] is.
enum FllamaErrorType {
  /// The model could not be loaded: a missing or invalid file, or not enough
  /// memory.
  modelLoad,

  /// The request could not be used, for example a chat template error.
  invalidRequest,

  /// The prompt does not fit the context size.
  contextSizeExceeded,

  /// The GPU or CPU backend failed while computing. The next request
  /// recreates the context.
  backend,

  /// Any other failure.
  other,
}

/// Why an inference request failed. See [FllamaInferenceCallback].
class FllamaError {
  final FllamaErrorType type;

  /// llama.cpp's or fllama's description, for logs and for users.
  final String message;

  const FllamaError(this.type, this.message);

  /// Parses `{"type": "...", "message": "..."}` from native or web code.
  factory FllamaError.fromJson(String json) {
    try {
      final decoded = jsonDecode(json);
      if (decoded is Map) {
        final message = decoded['message'];
        return FllamaError(
          _errorTypes[decoded['type']] ?? FllamaErrorType.other,
          message is String && message.isNotEmpty ? message : json,
        );
      }
    } on FormatException {
      // Not JSON: use the text as the message.
    }
    return FllamaError(FllamaErrorType.other, json);
  }

  static const _errorTypes = {
    'model_load': FllamaErrorType.modelLoad,
    'invalid_request': FllamaErrorType.invalidRequest,
    'exceed_context_size': FllamaErrorType.contextSizeExceeded,
    'backend': FllamaErrorType.backend,
  };

  @override
  String toString() => 'FllamaError(${type.name}): $message';
}

/// Parameters needed to run standard LLM inference. Use with [fllamaInference].
///
/// This is *not* what most people want to use. LLMs post-ChatGPT use a chat
/// template and an EOS token. Use [fllamaChat] instead if you expect this
/// sort of interface, i.e. an OpenAI-like API. It translates an OpenAI-like
/// request into a inference request.
class FllamaInferenceRequest {
  int
  contextSize; // llama.cpp handled 0 fine. StableLM Zephyr became default (4096).
  String input;
  int maxTokens;
  String modelPath;
  String? modelMmprojPath;
  String? openAiRequestJsonString;
  int numGpuLayers;

  /// Number of CPU threads for inference. -1, the default, lets llama.cpp
  /// choose one thread per physical core, as llama-server does.
  ///
  /// It was 2 until 2026: in 2024, a Pixel Fold loaded models slowly with
  /// more. On an M-series Mac, CPU-only Qwen 3.5 0.8B generates about 1.5
  /// times as fast with -1, and processes prompts about 3 times as fast.
  int numThreads;

  /// Sampling. null uses the value that the GGUF file recommends, else
  /// llama.cpp's default, as llama-server does.
  double? temperature;
  double? penaltyFrequency;
  double? penaltyRepeat;
  double? topP;
  Function(String)? logger;

  /// Optional: path to an MTP assistant/drafter GGUF (e.g.
  /// gemma-4-31B-it-assistant) to enable Multi-Token Prediction speculative
  /// decoding. null/empty disables it. Only dense Gemma 4 targets (12B/31B and
  /// the 26B-A4B MoE) have drafters; E2B/E4B are unsupported.
  String? draftModelPath;

  /// Optional: tokens to draft per step when [draftModelPath] is set.
  /// null or <= 0 falls back to 3.
  int? draftNMax;

  /// Optional: minimum drafter top-token probability required to continue a
  /// draft. null means llama.cpp default. Gemma 4 chat often needs a high value
  /// such as 0.95–0.99 when [draftNMax] is high.
  double? draftPMin;

  /// Optional: [FllamaGpuMemoryInfo.deviceKey] of the GPU that the model may
  /// use. null or empty is Auto: llama.cpp uses every GPU it supports. An
  /// unknown key is logged and treated as Auto. Native-only.
  String? gpuDeviceKey;

  /// The request that [fllamaChat] runs for [request]: llama.cpp's
  /// OpenAI-compatible chat path, with an empty plain [input].
  factory FllamaInferenceRequest.fromOpenAiRequest(OpenAiRequest request) =>
      FllamaInferenceRequest(
        contextSize: request.contextSize,
        input: '',
        maxTokens: request.maxTokens,
        modelPath: request.modelPath,
        modelMmprojPath: request.mmprojPath,
        numGpuLayers: request.numGpuLayers,
        penaltyFrequency: request.frequencyPenalty,
        penaltyRepeat: request.repeatPenalty,
        temperature: request.temperature,
        topP: request.topP,
        logger: request.logger,
        openAiRequestJsonString: request.toJsonString(),
        draftModelPath: request.draftModelPath,
        draftNMax: request.draftNMax,
        draftPMin: request.draftPMin,
        gpuDeviceKey: request.gpuDeviceKey,
      );

  FllamaInferenceRequest({
    required this.contextSize,
    required this.input,
    required this.maxTokens,
    required this.modelPath,
    required this.numGpuLayers,
    this.penaltyFrequency,
    this.penaltyRepeat,
    this.temperature,
    this.topP,
    this.modelMmprojPath,
    this.numThreads = -1,
    this.logger,
    this.openAiRequestJsonString,
    this.draftModelPath,
    this.draftNMax,
    this.draftPMin,
    this.gpuDeviceKey,
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

/// A file of a GPU pack: a ggml GPU backend that the app downloads instead
/// of bundling (fllama docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D13).
///
/// The app downloads [url], gunzips it to `<directory>/<name>`, and then
/// calls `fllamaLoadGpuPack(pack, directory)`. fllama loads the file only if
/// its SHA-256 is [sha256].
class FllamaGpuPackFile {
  /// Pack name, for example `vulkan`. Every file of a pack has the same name.
  final String pack;

  /// File name after gunzip, for example `ggml-vulkan.dll`.
  final String name;

  /// Lowercase hex SHA-256 of the file after gunzip. fllama loads only a
  /// file with this SHA-256.
  final String sha256;

  /// The gzipped file in the fllama GitHub release, for example
  /// `https://github.com/Telosnex/fllama/releases/download/native-<16 hex>/windows-x64-ggml-vulkan.dll.gz`.
  final String url;

  const FllamaGpuPackFile({
    required this.pack,
    required this.name,
    required this.sha256,
    required this.url,
  });

  @override
  String toString() => 'FllamaGpuPackFile($url)';
}

class FllamaGpuMemoryInfo {
  final int deviceIndex;
  final int totalBytes;
  final int freeBytes;
  final String name;
  final String description;
  final String deviceId;

  /// ggml backend name, for example `Vulkan`, `MTL` (Metal) or `CUDA`.
  final String backend;

  /// Whether the device is an integrated GPU, which shares system memory.
  final bool isIntegrated;

  /// Stable identity of this GPU across app restarts. Pass it as
  /// [OpenAiRequest.gpuDeviceKey] to run a model on only this GPU.
  final String deviceKey;

  const FllamaGpuMemoryInfo({
    required this.deviceIndex,
    required this.totalBytes,
    required this.freeBytes,
    required this.name,
    required this.description,
    required this.deviceId,
    this.backend = '',
    this.isIntegrated = false,
    this.deviceKey = '',
  });

  bool get hasKnownBudget => totalBytes > 0;
}

/// Runs an OpenAI-style chat request with llama.cpp's server code, as
/// llama-server's /v1/chat/completions does. This is the most common way to
/// use fllama. Returns the request ID, for [fllamaCancelInference].
///
/// llama.cpp applies [OpenAiRequest.jinjaTemplate], else the chat template in
/// the GGUF. A template that cannot be used falls back to ChatML, and
/// [OpenAiRequest.logger] says so. With tools, llama.cpp constrains tool
/// calls to their JSON schemas and parses them into the response chunks.
/// [callback] gets the text so far and each llama-server-style chunk; see
/// [FllamaInferenceCallback] for errors.
Future<int> fllamaChat(
  OpenAiRequest request,
  FllamaInferenceCallback callback,
) async {
  final inferenceRequest = FllamaInferenceRequest.fromOpenAiRequest(request);
  return fllamaInference(inferenceRequest, callback);
}

/// Returns a string representing the input to an LLM model after applying the
/// chat template.
///
/// - [chatTemplate] is the raw chat template from the GGUF.
/// - [eosToken] is the raw EOS token from the GGUF.
/// - [request] is the OpenAI-like request.
const chatMlTemplate = '''
{%- for msg in messages -%}
<|im_start|>{{ msg.role }}
{{ msg.content }}<|im_end|>
{% endfor %}
<|im_start|>assistant
''';

/// Convert a JSON schema to GBNF, a grammar format used by llama.cpp to enforce
/// that the model returns certain outputs.
String fllamaJsonSchemaToGrammar(String jsonSchema) {
  return convertToJsonGrammar(jsonSchema);
}

/// Given a chat template embedded in a .gguf file, returns the chat template
/// itself, or a sensible fallback if the chat template is incorrect or missing.
String fllamaSanitizeChatTemplate(
  String builtInChatTemplate,
  String modelPath,
) {
  final String chatTemplate;

  // Order is very important here, be careful.
  // ex. if isNotEmpty branch comes first, the check for an erroroneous
  // template never runs.
  if (builtInChatTemplate.contains(
    'Only user and assistant roles are supported!',
  )) {
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
      '[fllama] Using ChatML because built-in chat template seems erroneous. (contains "Only user and assistant roles are supported!")',
    );
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
    // ignore: avoid_print
    print('[fllama] Using ChatML because no built-in chat template was found.');
    chatTemplate = chatMlTemplate;
  }
  return chatTemplate;
}
