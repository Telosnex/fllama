import 'dart:convert';

import 'dart:io';

import 'package:file_picker/file_picker.dart';

import 'package:file_selector/file_selector.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'package:fllama/fllama.dart';
import 'package:shared_preferences/shared_preferences.dart';

late final SharedPreferences kSharedPrefs;
const String kModelPathKey = 'modelPath';
const String kMmprojPathKey = 'mmprojPath';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  kSharedPrefs = await SharedPreferences.getInstance();
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
    _mmprojPath = kSharedPrefs.getString(kMmprojPathKey);
    _modelPath = kSharedPrefs.getString(kModelPathKey);
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
        body: Builder(builder: (context) {
          return SingleChildScrollView(
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
                        Padding(
                          padding: const EdgeInsets.only(left: 8.0),
                          child: SelectableText(
                            _modelPath!,
                            style: textStyle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: _openMmprojGgufPressed,
                        icon: const Icon(Icons.file_open),
                        label: const Text('Open mmproj.gguf'),
                      ),
                      const SizedBox(width: 8),
                      const Tooltip(
                        message:
                            'Optional:\nModels that can also process images, multimodal models, also come with a mmproj.gguf file.',
                        child: Icon(Icons.info),
                      ),
                      if (_mmprojPath != null)
                        Padding(
                          padding: const EdgeInsets.only(left: 8.0),
                          child: SelectableText(
                            _mmprojPath!,
                            style: textStyle,
                          ),
                        ),
                    ],
                  ),
                  spacerSmall,
                  if (_modelPath != null)
                    TextField(
                      controller: _controller,
                    ),
                  if (_mmprojPath != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Row(
                        children: [
                          ElevatedButton.icon(
                              onPressed: _openImagePressed,
                              icon: const Icon(Icons.image),
                              label: const Text('Open Image')),
                          const SizedBox(
                            width: 8,
                          ),
                          if (_imageBytes != null)
                            Text('Attached: ${_imageBytes!.length} bytes',
                                style: textStyle),
                        ],
                      ),
                    ),
                  const SizedBox(
                    height: 8,
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      if (_modelPath == null) {
                        // Show a snackbar to the user.
                        SnackBar snackBar = const SnackBar(
                          content: Text('Please open a .gguf file.'),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(snackBar);
                        return;
                      }
                      var messageText = _controller.text;
                      final isMultimodal = _mmprojPath != null;
                      if (isMultimodal && _imageBytes != null) {
                        messageText =
                            '<img src="data:image/jpeg;base64,${base64Encode(_imageBytes!)}">\n\n$messageText';
                      }
                      final request = FllamaInferenceRequest(
                        maxTokens: 256,
                        input: messageText,
                        numGpuLayers: 99,
                        modelPath: _modelPath!,
                        penaltyFrequency: 0.0,
                        // Don't use below 1.1, LLMs without a repeat penalty
                        // will repeat the same token.
                        penaltyRepeat: 1.1,
                        topP: 1.0,
                        contextSize: 2048,
                        // Don't use 0.0, some models will repeat
                        // the same token.
                        temperature: 0.1,
                        logger: (log) {
                          // ignore: avoid_print
                          print('[llama.cpp] $log');
                        },
                      );
                      fllamaInferenceAsync(request, (String result, bool done) {
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
          );
        }
        ),
      ),
    );
  }

  void _openGgufPressed() async {
    final filePath = await _pickGgufPath();
    if (filePath == null) {
      await kSharedPrefs.remove(kModelPathKey);
      return;
    } else {
      await kSharedPrefs.setString(kModelPathKey, filePath);
    }

    setState(() {
      _modelPath = filePath;
    });
  }

  void _openMmprojGgufPressed() async {
    final filePath = await _pickGgufPath();
    if (filePath == null) {
      await kSharedPrefs.remove(kMmprojPathKey);
      return;
    } else {
      await kSharedPrefs.setString(kMmprojPathKey, filePath);
    }

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
  if (!kIsWeb && Platform.isAndroid) {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.any,
    );

    return result?.files.first.path;
  }

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
    const XTypeGroup(label: '.png', extensions: [
      'png'
    ], uniformTypeIdentifiers: [
      'public.png',
      'public.image',
    ])
  ]);

  if (file == null) {
    return null;
  }
  final filePath = file.path;
  return filePath;
}
