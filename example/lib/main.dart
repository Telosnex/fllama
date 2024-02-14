import 'dart:convert';

import 'dart:io';


import 'package:file_selector/file_selector.dart';
import 'package:flutter/foundation.dart';
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
  String? _modelPath;
  // This is only required for multimodal models.
  // Multimodal models are rare.
  String? _mmprojPath;
  String latestResult = '';
  Uint8List? _imageBytes;
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
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: _openGgufPressed,
                      icon: const Icon(Icons.file_open),
                      label: const Text('Open .gguf'),
                    ),
                    if (_modelPath != null)
                      SelectableText(
                        _modelPath!,
                        style: textStyle,
                      ),
                  ],
                ),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: _openMmprojGgufPressed,
                      icon: const Icon(Icons.file_open),
                      label: const Text('Open mmproj'),
                    ),
                    if (_mmprojPath != null)
                      SelectableText(
                        _mmprojPath!,
                        style: textStyle,
                      ),
                  ],
                ),
                spacerSmall,
                if (_modelPath != null)
                  TextField(
                    controller: _controller,
                  ),
                if (_mmprojPath != null)
                  Row(
                    children: [
                      ElevatedButton.icon(
                          onPressed: _openImagePressed,
                          icon: const Icon(Icons.file_open),
                          label: const Text('Choose .jpeg')),
                      if (_imageBytes != null)
                        Text('Image chosen (${_imageBytes!.length} bytes)',
                            style: textStyle),
                    ],
                  ),
                const SizedBox(
                  height: 8,
                ),
                ElevatedButton(
                  onPressed: () async {
                    var messageText = _controller.text;
                    final isMultimodal = _mmprojPath != null;
                    if (isMultimodal && _imageBytes != null) {
                      messageText =
                          '<img src="data:image/jpeg;base64,${base64Encode(_imageBytes!)}">\n\n$messageText';
                    }
                    final request = OpenAiRequest(
                      maxTokens: 256,
                      messages: [
                        Message(Role.user, messageText),
                      ],
                      numGpuLayers: 99,
                      modelPath: _modelPath!,
                      mmprojPath: _mmprojPath,
                      contextSize: 4096,
                      temperature: 0.0,
                    );
                    fllamaChatCompletionAsync(request,
                        (String result, bool done) {
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
    final filePath = await _pickGgufPath();
    setState(() {
      _modelPath = filePath;
    });
  }

  void _openMmprojGgufPressed() async {
    final filePath = await _pickGgufPath();
    setState(() {
      _mmprojPath = filePath;
    });
  }

  void _openImagePressed() async {
    final filePath = await _pickImagePath();
    if (filePath == null) {
      return;
    }
    final bytes = await File(filePath).readAsBytes();
    setState(() {
      _imageBytes = bytes;
    });
  }
}

Future<String?> _pickGgufPath() async {
  final file = await openFile(acceptedTypeGroups: <XTypeGroup>[
    const XTypeGroup(
      label: '.gguf',
      extensions: ['gguf'],
      // UTIs are required for iOS, which does not have a .gguf UTI.
      uniformTypeIdentifiers: [],
    ),
  ]);

  if (file == null) {
    return null;
  }
  final filePath = file.path;
  return filePath;
}

Future<String?> _pickImagePath() async {
  final file = await openFile(acceptedTypeGroups: <XTypeGroup>[
    const XTypeGroup(
      label: '.jpeg',
      extensions: ['jpeg'],
      uniformTypeIdentifiers: [
        'public.jpeg',
        'public.image',
      ],
    ),
  ]);

  if (file == null) {
    return null;
  }
  final filePath = file.path;
  return filePath;
}
