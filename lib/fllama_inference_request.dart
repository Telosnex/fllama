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
