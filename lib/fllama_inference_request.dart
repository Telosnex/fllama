class FllamaInferenceRequest {
  int contextSize; // llama.cpp handled 0 fine. StableLM Zephyr became default (4096).
  String input;
  int maxTokens;
  String modelPath;
  String? modelMmprojPath;
  int numGpuLayers;
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
    this.logger,
  });
}
