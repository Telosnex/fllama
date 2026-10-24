import 'package:fllama/fllama.dart';

typedef FllamaWebLoadCallback =
    void Function(double downloadProgress, double loadProgress);

Future<List<FllamaGpuMemoryInfo>> fllamaGpuMemoryInfoGetAll() async {
  return const [];
}

/// No GPU backends to allow or forbid on this platform.
bool fllamaSetGpuAllowed(bool allowed) => true;

/// No backend libraries on this platform.
Future<List<String>> fllamaLoadedBackendFiles() async => const [];

/// No GPU packs on this platform.
List<FllamaGpuPackFile> fllamaGpuPackFiles() => const [];

/// No GPU packs on this platform.
Future<String?> fllamaLoadGpuPack(String pack, String directory) async =>
    'This platform does not load GPU packs';

/// No Vulkan on this platform.
Future<bool> fllamaHasVulkanGpu() async => false;

/// No CUDA on this platform.
Future<bool> fllamaHasCudaGpu() async => false;

/// GGUF files cannot be read on this platform.
int? fllamaTrainedContextLength(String modelPath) => null;

/// Returns the chat template embedded in the .gguf file.
/// If none is found, returns an empty string.
///
/// See [fllamaSanitizeChatTemplate] for using sensible fallbacks for gguf
/// files that don't have a chat template or have incorrect chat templates.
Future<String> fllamaChatTemplateGet(String modelPath) {
  throw UnimplementedError();
}

/// Returns the BOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
Future<String> fllamaBosTokenGet(String modelPath) {
  throw UnimplementedError();
}

/// Returns the EOS token embedded in the .gguf file.
/// If none is found, returns an empty string.
Future<String> fllamaEosTokenGet(String modelPath) {
  throw UnimplementedError();
}

/// Runs plain completion of [FllamaInferenceRequest.input], with no chat
/// template. Returns the request ID soon, for [fllamaCancelInference];
/// [callback] gets the results. See [FllamaInferenceCallback].
///
/// Most callers want [fllamaChat], which applies the chat template.
Future<int> fllamaInference(
  FllamaInferenceRequest request,
  FllamaInferenceCallback callback,
) async {
  throw UnimplementedError();
}

Future<int> fllamaChatWeb(
  OpenAiRequest request,
  FllamaWebLoadCallback loadCallback,
  FllamaInferenceCallback callback,
) async {
  throw UnimplementedError();
}

Future<void> fllamaWebModelDelete(String modelPath) async {
  throw UnimplementedError();
}

Future<bool> fllamaWebIsModelDownloaded(String modelPath) async {
  throw UnimplementedError();
}

Future<String?> fllamaWebPickModel() async {
  throw UnimplementedError();
}

/// Cancels the inference with the given [requestId].
///
/// The request then ends soon with its last callback: `done` set, the text
/// so far, and no error. A request that has not started ends with no text.
void fllamaCancelInference(int requestId) {
  throw UnimplementedError();
}

/// Returns the number of tokens in [request.input].
///
/// Useful for identifying what messages will be in context when the LLM is run.
Future<int> fllamaTokenize(FllamaTokenizeRequest request) async {
  throw UnimplementedError();
}
