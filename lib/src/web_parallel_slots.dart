import 'package:fllama_cpp/misc/openai.dart';

/// Request slots of a model on the web, unless [OpenAiRequest.nParallel] sets
/// them. fllama_web_init.js uses this value: Dart passes it with each request.
///
/// 1, because wllama sets kv_unified to false: each slot gets n_ctx / slots.
/// With 4 slots, a request could use only a quarter of the context size.
/// Native fllama shares one context between its slots
/// (ServerManager::DEFAULT_N_PARALLEL in src/fllama_inference_queue.h).
const kFllamaWebDefaultParallelSlots = 1;

/// The request slots that the web runtime loads [request]'s model with.
int fllamaWebParallelSlots(OpenAiRequest request) {
  final slots = request.nParallel;
  return slots != null && slots > 0 ? slots : kFllamaWebDefaultParallelSlots;
}
