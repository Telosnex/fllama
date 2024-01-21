import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';

import 'package:fllama/fllama.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String? modelPath;
  String latestResult = '';
  final TextEditingController _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    const textStyle = TextStyle(fontSize: 14);
    const spacerSmall = SizedBox(height: 10);
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('fllama'),
        ),
        body: SingleChildScrollView(
          child: Container(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ElevatedButton.icon(
                  onPressed: _openGgufPressed,
                  icon: const Icon(Icons.file_open),
                  label: const Text('Open .gguf'),
                ),
                if (modelPath != null)
                  SelectableText(
                    'Model path: $modelPath',
                    style: textStyle,
                  ),
                spacerSmall,
                if (modelPath != null)
                  TextField(
                    controller: _controller,
                  ),
                const SizedBox(
                  height: 8,
                ),
                if (modelPath != null)
                  ElevatedButton(
                    onPressed: () async {
                      final request = FllamaInferenceRequest(
                        contextSize: 4096,
                        maxTokens: 256,
                        temperature: 1.0,
                        topP: 1.0,
                        input: _controller.text,
                        ggmlMetalPath: null,
                        numGpuLayers: 0,
                        modelPath: modelPath!,
                      );

                      fllamaInferenceAsync(request, (String result) {
                        setState(() {
                          latestResult = result;
                        });
                      });
                    },
                    child: const Text('Run inference'),
                  ),
                SelectableText(
                  latestResult,
                  style: textStyle,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openGgufPressed() async {
    XTypeGroup ggufTypeGroup = const XTypeGroup(
      label: '.gguf',
      extensions: ['gguf'],
      // UTIs are required for iOS, which does not support local LLMs.
      uniformTypeIdentifiers: [],
    );
    final file = await openFile(acceptedTypeGroups: <XTypeGroup>[
      ggufTypeGroup,
    ]);
    if (file == null) {
      return;
    }
    final filePath = file.path;
    setState(() {
      modelPath = filePath;
    });
  }
}
