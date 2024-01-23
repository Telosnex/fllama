# fllama
Flutter x llama.cpp

- Everywhere 
  - (except web)
  - Android, iOS, macOS, Linux, Windows.
- Fast
  - GPU acceleration via Metal on iOS and Mac.
  - >= reading speed on all platforms.
- Private
  - No network connection, server, cloud required.
- Forward compatible
  - Any model compatible with llama.cpp. 
  - So every model.

## Getting Started
- Add this to your package's pubspec.yaml file:
```yaml
dependencies:
  fllama: ^0.0.1
    git:
      url: https://github.com/Telosnex/fllama.git
      ref: main
```
- Run inference:
```dart
import 'package:fllama/fllama.dart';

final llama = Fllama();
final request = FllamaInferenceRequest(
                  // Proportional to RAM use. 
                  // 4096 is a good default. 
                  // 2048 should be considered on devices with low RAM (<8 GB)
                  // 8192 and higher can be considered on device with high RAM (>16 GB)
                  // Models are trained on <= a certain context size.
                  contextSize: 4096,
                  maxTokens: 256,
                  temperature: 1.0,
                  topP: 1.0,
                  // Make sure to format input appropriately for the model, ex. ChatML
                  input: _controller.text,
                  // Pass a path to ggml.metal if you want to use GPU inference on iOS on macOS. About 3x faster.
                  ggmlMetalPath: null,
                  // 0 = CPU only. Functionally, maximum number of layers to run on GPU. 
                  // 99/100 are used in llama.cpp examples when intent is to run all layers 
                  // on GPU. Automatically set to 0 in obvious scenarios where it will be
                  // incompatible, such as iOS simulator. You should set it to 0 on CI,
                  // virtualized graphics cards will not work.
                  numGpuLayers: 99,
                  // Path to a GGUF file.
                  // Obtain from HuggingFace.
                  // Recommended models available on fllama HuggingFace.
                  // https://huggingface.co/telosnex/fllama/tree/main
                  //
                  // Stable LM 3B is reasonable on all devices. ~360 wpm on Android, 
                  // ~540 wpm on iOS, ~2700 wpm on ultra premium macOS. (M2 Max MBP).
                  // People read at ~250 wpm.
                  //
                  // Mistral 7B is best on 2023 iPhones or 2024 Androids or better.
                  // It's about 2/3 the speed of Stable LM 3B and requires 5 GB of RAM.
                  //
                  // Mixtral should only be considered on a premium laptop or desktop,
                  // such as an M-series MacBook or a premium desktop purchased in 2023
                  // or later.
                  modelPath: null,
                );
fllamaInferenceAsync(request, (String result, bool done) {
  setState(() {
    latestResult = result;
  });
});
