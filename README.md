<img src="fllama_header.png"
     alt="fllama image header, bird like Flutter mascot riding a llama. Text reads: FLLAMA. Run cutting-edge, free, large language models. Near ChatGPT quality. On any platform.
     iOS, macOS, Android, Windows, Linux, and Web. Metal GPU support."
     style="float: left; margin-right: 0px;" />

- Everywhere: web, iOS, macOS, Android, Windows, Linux.
- Fast: exceeds average reading speed on all platforms except web.
- Private: No network connection, server, cloud required.
- Forward compatible: Any model compatible with llama.cpp. (so, every model.)
- Use with FONNX for RAG
  - Combine with [FONNX](https://github.com/Telosnex/fonnx) to have a full retrieval-augmented generation stack available on all platforms.

## Integrate
- Add this to your package's pubspec.yaml file:
```yaml
dependencies:
  fllama:
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
```
## Tips & Tricks
### Recommended models

  3 top-tier open models are in the [fllama HuggingFace repo](https://huggingface.co/telosnex/fllama/tree/main).
  - __Stable LM 3B__ is the first LLM model that can handle RAG, using documents such as web pages to answer a query, on *all* devices. 
  > Mistral models via [Nous Research](https://nousresearch.com/).
    They trained and finetuned the Mistral base models for chat to create the OpenHermes series of models.
  - __Mistral 7B__ is best on 2023 iPhones or 2024 Androids or better.
    It's about 2/3 the speed of Stable LM 3B and requires 5 GB of RAM.
  - __Mixtral 8x7B__ should only be considered on a premium laptop or desktop,
    such as an M-series MacBook or a premium desktop purchased in 2023
    or later. It's about 1/3 the speed of Stable LM 3B and requires 
    26 GB of RAM.
### RAM Requirements
  Roughly: you'll need as much RAM as the model file size.
  If inference runs on CPU, that much regular RAM is required.
  If inference runs on GPU, that much GPU RAM is required.
### Download files from HuggingFace at runtime
  HuggingFace, among many things, can be thought of as GitHub for AI models.
  You can download a model from HuggingFace and use it with fllama.
  To get a download URL at runtime, see below.
  ```dart
  String getHuggingFaceUrl(
    {required String repoId,
    required String filename,
    String? revision,
    String? subfolder}) {
  // Default values
  const String defaultEndpoint = 'https://huggingface.co';
  const String defaultRevision = 'main';

  // Ensure the revision and subfolder are not null and are URI encoded
  final String encodedRevision =
      Uri.encodeComponent(revision ?? defaultRevision);
  final String encodedFilename = Uri.encodeComponent(filename);
  final String? encodedSubfolder =
      subfolder != null ? Uri.encodeComponent(subfolder) : null;

  // Handle subfolder if provided
  final String fullPath = encodedSubfolder != null
      ? '$encodedSubfolder/$encodedFilename'
      : encodedFilename;

  // Construct the URL
  final String url =
      '$defaultEndpoint/$repoId/resolve/$encodedRevision/$fullPath';

  return url;
}
```

# Licensing

FLLAMA is licensed under a dual-license model.

The code as-is on GitHub is licensed under GPL v2. That requires distribution of the integrating app's source code, and this is unlikely to be desirable for commercial entities. See LICENSE.md.

Commercial licenses are also available. Contact info@telosnex.com. Expect very fair terms: our intent is to charge only entities, with a launched app, making a lot of money, with FLLAMA as a core dependency. The base agreement is here: https://github.com/lawndoc/dual-license-templates/blob/main/pdf/Basic-Yearly.pdf
