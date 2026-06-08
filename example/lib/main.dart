import 'dart:convert';

import 'package:file_picker/file_picker.dart';

import 'package:file_selector/file_selector.dart';
import 'package:fllama_example/example_tools.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'package:fllama/fllama.dart';
import 'package:shared_preferences/shared_preferences.dart';

late final SharedPreferences kSharedPrefs;
const String kModelPathKey = 'modelPath';
const String kMmprojPathKey = 'mmprojPath';
const String kDraftPathKey = 'draftPath';
const String kDraftNMaxKey = 'draftNMax';
const int kDefaultDraftNMax = 12;
const double kDefaultDraftPMin = 0.99;

const String kExampleQwenGgufUrl =
    'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const String kExampleTinyLlamaGgufUrl =
    'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

String _webModelLabel(String modelPath) {
  if (modelPath == kExampleQwenGgufUrl) {
    return 'Qwen2.5 0.5B Instruct Q4_K_M GGUF';
  }
  if (modelPath == kExampleTinyLlamaGgufUrl) {
    return 'TinyLlama 1.1B Chat Q4_K_M GGUF';
  }
  if (modelPath.startsWith('fllama-local-file://')) {
    return 'Local GGUF: ${_webLocalFileName(modelPath) ?? modelPath}';
  }
  return modelPath;
}

String? _webLocalFileName(String modelPath) {
  final uri = Uri.tryParse(modelPath);
  final segments = uri?.pathSegments;
  if (segments == null || segments.isEmpty) return null;
  return Uri.decodeComponent(segments.last);
}

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
  String _webModelPath = kExampleQwenGgufUrl;
  String? _modelPath;
  // This is only required for multimodal models.
  // Multimodal models are rare.
  String? _mmprojPath;
  // Optional: MTP assistant/drafter GGUF (e.g. gemma-4-31B-it-assistant)
  // to enable speculative decoding. Native-only.
  String? _draftPath;
  Uint8List? _imageBytes;
  final TextEditingController _controller = TextEditingController();
  var _temperature = 0.5;
  var _topP = 1.0;
  int _maxTokens = 100;
  int _draftNMax = kDefaultDraftNMax;

  String latestResultString = '';
  String latestResultJson = '';
  int latestOutputTokenCount = 0;
  String latestChatTemplate = '';
  String latestEosToken = '';
  String latestBosToken = '';
  double _tokensPerSecond =
      0; // wall-clock fallback; includes load/reload overhead
  DateTime? _inferenceStartTime;

  // Parsed streaming state
  String _accReasoning = '';
  String _accContent = '';
  final List<Map<String, dynamic>> _accToolCalls = [];
  String? _finishReason;
  Map<String, dynamic>? _timings;

  int? _runningRequestId;

  double? _webDownloadProgress;
  double? _webLoadProgress;

  ToolFunction? _tool;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _mmprojPath = kSharedPrefs.getString(kMmprojPathKey);
      _modelPath = kSharedPrefs.getString(kModelPathKey);
      _draftPath = kSharedPrefs.getString(kDraftPathKey);
      _draftNMax = kSharedPrefs.getInt(kDraftNMaxKey) ?? kDefaultDraftNMax;
    }
  }

  @override
  Widget build(BuildContext context) {
    const textStyle = TextStyle(fontSize: 14);
    const spacerSmall = SizedBox(height: 10);
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('FLLAMA'),
        ),
        body: Builder(builder: (context) {
          return SingleChildScrollView(
            child: Container(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!kIsWeb) ...[
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
                        if (_mmprojPath != null) ...[
                          Padding(
                            padding: const EdgeInsets.only(left: 8.0),
                            child: SelectableText(
                              _mmprojPath!,
                              style: textStyle,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                _mmprojPath = null;
                                _imageBytes = null;
                              });
                              kSharedPrefs.remove(kMmprojPathKey);
                            },
                            icon: const Icon(Icons.close),
                          ),
                        ]
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          onPressed: _openDraftGgufPressed,
                          icon: const Icon(Icons.file_open),
                          label: const Text('Open drafter .gguf'),
                        ),
                        const SizedBox(width: 8),
                        const Tooltip(
                          message:
                              'Optional: an MTP assistant/drafter GGUF (e.g.\n'
                              'gemma-4-31B-it-assistant) enables speculative\n'
                              'decoding. Dense Gemma 4 targets only (12B/31B,\n'
                              '26B-A4B). Keep the drafter at F16/Q8; do NOT use\n'
                              'a Q8 KV cache.',
                          child: Icon(Icons.bolt),
                        ),
                        if (_draftPath != null) ...[
                          Padding(
                            padding: const EdgeInsets.only(left: 8.0),
                            child: SelectableText(
                              _draftPath!,
                              style: textStyle,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                _draftPath = null;
                              });
                              kSharedPrefs.remove(kDraftPathKey);
                            },
                            icon: const Icon(Icons.close),
                          ),
                        ]
                      ],
                    ),
                    if (_draftPath != null) ...[
                      Row(
                        children: [
                          Tooltip(
                            message:
                                'Maximum number of tokens the drafter proposes per round.\n'
                                'Higher values reduce verification rounds but can waste more work\n'
                                'after a rejected draft token. On Apple Silicon, 8–12 is often\n'
                                'better than llama.cpp examples that use 3–4.',
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('Draft tokens: $_draftNMax',
                                    style: textStyle),
                                const SizedBox(width: 4),
                                const Icon(Icons.info),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Slider.adaptive(
                              label: 'Draft tokens: $_draftNMax',
                              value: _draftNMax.toDouble(),
                              min: 1,
                              max: 32,
                              divisions: 31,
                              onChanged: (newDraftNMax) {
                                final value = newDraftNMax.round();
                                setState(() {
                                  _draftNMax = value;
                                });
                                kSharedPrefs.setInt(kDraftNMaxKey, value);
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                  if (kIsWeb) ...[
                    const Text(
                      'Web version powered by wllama & WebGPU/CPU',
                      style: textStyle,
                    ),
                    DropdownMenu(
                      initialSelection: _webModelPath,
                      dropdownMenuEntries: [
                        ...[
                          null,
                          kExampleQwenGgufUrl,
                          kExampleTinyLlamaGgufUrl,
                        ].map(
                          (modelId) {
                            return DropdownMenuEntry(
                              value: modelId,
                              label: modelId == null
                                  ? 'Loading...'
                                  : _webModelLabel(modelId),
                              leadingIcon: modelId == null
                                  ? const CircularProgressIndicator()
                                  : FutureBuilder(
                                      future:
                                          fllamaWebIsModelDownloaded(modelId),
                                      builder: (context, snapshot) {
                                        final data = snapshot.data;
                                        if (data == null) {
                                          return const CircularProgressIndicator();
                                        }
                                        return Icon(
                                          data
                                              ? Icons.check_circle
                                              : Icons.cancel,
                                        );
                                      },
                                    ),
                              trailingIcon: modelId == null
                                  ? const CircularProgressIndicator()
                                  : FutureBuilder(
                                      future:
                                          fllamaWebIsModelDownloaded(modelId),
                                      builder: (context, snapshot) {
                                        final data = snapshot.data;
                                        if (data == null) {
                                          return const SizedBox.shrink();
                                        }
                                        return ElevatedButton(
                                          onPressed: () {
                                            fllamaWebModelDelete(modelId);
                                          },
                                          child: const Text('Delete'),
                                        );
                                      }),
                            );
                          },
                        )
                      ],
                      onSelected: (value) {
                        setState(() {
                          _webModelPath = value ?? _webModelPath;
                        });
                      },
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          onPressed: () async {
                            final token = await fllamaWebPickModel();
                            if (token == null) return;
                            setState(() {
                              _webModelPath = token;
                            });
                          },
                          icon: const Icon(Icons.folder_open),
                          label: const Text('Pick local GGUF'),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: SelectableText(
                            _webModelLabel(_webModelPath),
                            style: textStyle,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          onPressed: () async {
                            final token = await fllamaWebPickModel();
                            if (token == null) return;
                            setState(() {
                              _mmprojPath = token;
                            });
                          },
                          icon: const Icon(Icons.folder_open),
                          label: const Text('Pick local mmproj GGUF'),
                        ),
                        const SizedBox(width: 8),
                        const Tooltip(
                          message:
                              'Optional: multimodal models may require a companion mmproj GGUF.',
                          child: Icon(Icons.info),
                        ),
                        if (_mmprojPath != null) ...[
                          const SizedBox(width: 8),
                          Expanded(
                            child: SelectableText(
                              _webModelLabel(_mmprojPath!),
                              style: textStyle,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                _mmprojPath = null;
                                _imageBytes = null;
                              });
                            },
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ],
                    ),
                  ],
                  spacerSmall,
                  const Text('Tools:', style: textStyle),
                  const Text(
                      'Forces the model to output in JSON format, specified by a JSON schema.',
                      style: textStyle),
                  DropdownMenu(
                    initialSelection: _tool,
                    dropdownMenuEntries: [
                      ...[
                        exampleFlashcardFunction,
                        exampleOneSearchQueryFunction,
                        exampleSearchQueriesFunction,
                        exampleSentimentListFunction,
                        exampleQaExtractFunction,
                        null,
                      ].map(
                        (tool) {
                          return DropdownMenuEntry(
                            value: tool,
                            label: tool?.name ?? 'None',
                          );
                        },
                      )
                    ],
                    onSelected: (value) {
                      setState(() {
                        _tool = value;
                      });
                    },
                  ),
                  spacerSmall,
                  if (_modelPath != null || _webModelPath.isNotEmpty)
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'Prompt',
                        hintText: 'Type your prompt here',
                      ),
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
                  Row(
                    children: [
                      Tooltip(
                        message:
                            'Temperature controls the randomness of the output. Between 0.0 and 2.0, between 0.5 and 1.0 is recommended.',
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                                'Temperature: ${_temperature.toStringAsFixed(1)}',
                                style: textStyle),
                            const SizedBox(
                              width: 4,
                            ),
                            const Icon(
                              Icons.info,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Slider.adaptive(
                            label:
                                'Temperature: ${_temperature.toStringAsFixed(1)}',
                            value: _temperature,
                            max: 2.0,
                            onChanged: (newTemperature) {
                              setState(() {
                                _temperature = newTemperature;
                              });
                            }),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Tooltip(
                        message:
                            'Top P controls what percentiles of the probability distribution are considered when sampling the next token. Between 0.0 and 1.0, 1.0 is recommended.',
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                                'Top P: ${(_topP * 100).clamp(0, 100).round()}%',
                                style: textStyle),
                            const SizedBox(
                              width: 4,
                            ),
                            const Icon(
                              Icons.info,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Slider.adaptive(
                            label: 'Top P: ${(_topP * 100).clamp(0, 100)}%',
                            value: _topP,
                            max: 1.0,
                            onChanged: (newTopP) {
                              setState(() {
                                _topP = newTopP;
                              });
                            }),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Tooltip(
                        message:
                            'Maximum number of tokens to generate in the response.',
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Max tokens: ${_maxTokens.round()}',
                                style: textStyle),
                            const SizedBox(width: 4),
                            const Icon(Icons.info),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Slider.adaptive(
                          label: 'Max tokens: ${_maxTokens.round()}',
                          value: _maxTokens.toDouble(),
                          min: 10,
                          max: 2000,
                          onChanged: (newMaxTokens) {
                            setState(() {
                              _maxTokens = newMaxTokens.round();
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (_runningRequestId != null) {
                        fllamaCancelInference(_runningRequestId!);
                      } else {
                        _runInferencePressed();
                      }
                    },
                    child: _runningRequestId != null
                        ? const Text('Cancel')
                        : const Text('Run'),
                  ),
                  if (kIsWeb && _webDownloadProgress != null) ...[
                    const Text('Downloading model file...', style: textStyle),
                    LinearProgressIndicator(
                      value: _webDownloadProgress,
                    ),
                    const SizedBox(height: 8),
                  ],
                  if (kIsWeb && _webLoadProgress != null) ...[
                    const Text('Loading model...', style: textStyle),
                    LinearProgressIndicator(
                      value: _webLoadProgress,
                    ),
                    const SizedBox(height: 8),
                  ],
                  if (!kIsWeb && latestResultString.isNotEmpty) ...[
                    if (_displayTokensPerSecond > 0) ...[
                      Text(
                        'Generation speed: ${_displayTokensPerSecond.toStringAsFixed(1)} tokens/s',
                        style: const TextStyle(fontFamily: 'monospace'),
                      ),
                      Text(
                        _timingsPredictedPerSecond == null
                            ? '(wall clock incl. load/reload: ${_tokensPerSecond.toStringAsFixed(1)} tokens/s)'
                            : '(server predicted_per_second)',
                        style: const TextStyle(
                            fontFamily: 'monospace', fontSize: 12),
                      ),
                      if (_draftTimingLabel != null)
                        Text(
                          _draftTimingLabel!,
                          style: const TextStyle(
                              fontFamily: 'monospace', fontSize: 12),
                        ),
                    ],
                    Text('Output token count: $latestOutputTokenCount',
                        style: textStyle),
                  ],
                  if (_finishReason != null || _timings != null) ...[
                    spacerSmall,
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: SelectableText(
                        [
                          if (_finishReason != null)
                            'finish_reason: $_finishReason',
                          if (_timings != null)
                            ..._timings!.entries.map((e) {
                              final v = e.value;
                              if (v is double) {
                                final s = v.toStringAsFixed(1);
                                return '${e.key}: ${s.endsWith('.0') ? v.toInt().toString() : s}';
                              }
                              return '${e.key}: $v';
                            }),
                        ].join('\n'),
                        style: const TextStyle(
                            fontFamily: 'monospace', fontSize: 12),
                      ),
                    ),
                  ],
                  if (_accReasoning.isNotEmpty) ...[
                    spacerSmall,
                    const Text('Reasoning:',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14)),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: SelectableText(
                        _accReasoning,
                        style: textStyle,
                      ),
                    ),
                  ],
                  if (_accContent.isNotEmpty) ...[
                    spacerSmall,
                    const Text('Content:',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14)),
                    SelectableText(_accContent, style: textStyle),
                  ],
                  if (_accToolCalls.isNotEmpty) ...[
                    spacerSmall,
                    const Text('Tool Calls:',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14)),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: SelectableText(
                        _prettyToolCalls(),
                        style: const TextStyle(
                            fontFamily: 'monospace', fontSize: 12),
                      ),
                    ),
                  ],
                  if (_accReasoning.isEmpty &&
                      _accContent.isEmpty &&
                      _accToolCalls.isEmpty &&
                      latestResultString.isNotEmpty) ...[
                    spacerSmall,
                    SelectableText('Raw: $latestResultString',
                        style: textStyle),
                  ],
                  if (latestChatTemplate.isNotEmpty) ...[
                    spacerSmall,
                    const Text('Chat template:', style: textStyle),
                    SelectableText(
                      latestChatTemplate,
                      style: textStyle,
                    ),
                  ],
                  if (latestBosToken.isNotEmpty) ...[
                    spacerSmall,
                    const Text('Beginning of sequence token:',
                        style: textStyle),
                    SelectableText(
                      latestBosToken,
                      style: textStyle,
                    ),
                  ],
                  if (latestEosToken.isNotEmpty) ...[
                    spacerSmall,
                    const Text('End of sequence token:', style: textStyle),
                    SelectableText(
                      latestEosToken,
                      style: textStyle,
                    ),
                  ],
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  double? get _timingsPredictedPerSecond {
    final value = _timings?['predicted_per_second'];
    if (value is num) return value.toDouble();
    return null;
  }

  double get _displayTokensPerSecond =>
      _timingsPredictedPerSecond ?? _tokensPerSecond;

  String? get _draftTimingLabel {
    final draftN = _timings?['draft_n'];
    final accepted = _timings?['draft_n_accepted'];
    if (draftN is! num || accepted is! num || draftN <= 0) return null;
    final acceptance = accepted / draftN * 100.0;
    return 'draft accepted: ${accepted.toInt()}/${draftN.toInt()} '
        '(${acceptance.toStringAsFixed(0)}%)';
  }

  void _mergeTimings(dynamic value) {
    if (value is Map) {
      _timings = Map<String, dynamic>.from(value);
    }
  }

  String _prettyToolCalls() {
    final out = <Map<String, dynamic>>[];
    for (final tc in _accToolCalls) {
      final pretty = <String, dynamic>{'name': tc['name']};
      if (tc['id'] != null) pretty['id'] = tc['id'];
      try {
        pretty['arguments'] = jsonDecode(tc['arguments'] ?? '');
      } catch (_) {
        pretty['arguments'] = tc['arguments'];
      }
      out.add(pretty);
    }
    return const JsonEncoder.withIndent('  ').convert(out);
  }

  void _parseStreamChunk(String responseJson) {
    if (responseJson.isEmpty) return;
    try {
      final decoded = jsonDecode(responseJson);
      final List<dynamic> chunks = decoded is List ? decoded : [decoded];
      for (final chunk in chunks) {
        if (chunk is! Map<String, dynamic>) continue;
        _mergeTimings(chunk['timings']);
        final usage = chunk['usage'];
        if (usage is Map) {
          _mergeTimings(usage['timings']);
        }
        final choices = chunk['choices'] as List<dynamic>? ?? [];
        if (choices.isEmpty) continue;
        final choice = choices[0] as Map<String, dynamic>;
        final delta = choice['delta'] as Map<String, dynamic>? ?? {};
        final finishReason = choice['finish_reason'] as String?;

        if (delta['reasoning_content'] is String) {
          _accReasoning += delta['reasoning_content'] as String;
        }
        if (delta['content'] is String) {
          _accContent += delta['content'] as String;
        }
        if (delta['tool_calls'] is List) {
          for (final tc in delta['tool_calls'] as List) {
            if (tc is! Map<String, dynamic>) continue;
            final idx = tc['index'] as int? ?? 0;
            while (_accToolCalls.length <= idx) {
              _accToolCalls.add({'name': '', 'arguments': ''});
            }
            final fn = tc['function'] as Map<String, dynamic>? ?? {};
            if (fn['name'] is String && (fn['name'] as String).isNotEmpty) {
              _accToolCalls[idx]['name'] = fn['name'];
            }
            if (fn['arguments'] is String) {
              _accToolCalls[idx]['arguments'] =
                  (_accToolCalls[idx]['arguments'] ?? '') + fn['arguments'];
            }
            if (tc['id'] is String) {
              _accToolCalls[idx]['id'] = tc['id'];
            }
          }
        }
        if (finishReason != null) {
          _finishReason = finishReason;
        }
      }
    } catch (_) {}
  }

  void _runInferencePressed() async {
    if (_modelPath == null && _webModelPath.isEmpty) {
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
    // 2 choices:
    // 1. Inference directly. Chat template is *not* applied.
    //    A chat template defines start/end sigils for
    //    messages, which causes the model to recognize a
    //    a conversation.
    //
    // 2. Inference with chat template.

    // 1. Inference directly.
    // final request = FllamaInferenceRequest(
    //   maxTokens: 256,
    //   input: messageText,
    //   numGpuLayers: 99,
    //   modelPath: _modelPath!,
    //   penaltyFrequency: 0.0,
    //   // Don't use below 1.1, LLMs without a repeat penalty
    //   // will repeat the same token.
    //   penaltyRepeat: 1.1,
    //   topP: 1.0,
    //   contextSize: 2048,
    //   // Don't use 0.0, some models will repeat
    //   // the same token.
    //   temperature: 0.1,
    //   logger: (log) {
    //     // ignore: avoid_print
    //     print('[llama.cpp] $log');
    //   },
    // );
    // fllamaInferenceAsync(request, (String result, bool done) {
    //   setState(() {
    //     latestResult = result;
    //   });
    // });

    // 2. Inference with chat template.
    final request = OpenAiRequest(
      tools: [
        if (_tool != null)
          Tool(
            name: _tool!.name,
            description: _tool!.description,
            jsonSchema: _tool!.parametersAsString,
          ),
      ],
      maxTokens: _maxTokens.round(),
      toolChoice: _tool == null ? null : ToolChoice.required,
      messages: [
        Message(Role.user, messageText),
      ],
      numGpuLayers: 99,
      /* this seems to have no adverse effects in environments w/o GPU support, ex. Android and web */
      modelPath: kIsWeb ? _webModelPath : _modelPath!,
      mmprojPath: _mmprojPath,
      // MTP speculative decoding (native-only). Ignored on web.
      draftModelPath: kIsWeb ? null : _draftPath,
      draftNMax: _draftNMax,
      // Gemma 4 chat MTP is fragile with llama.cpp's default p_min=0.0:
      // high n_max blindly drafts low-confidence future tokens and can slow
      // creative/agentic prompts dramatically. 0.99 kept math speedups while
      // avoiding most regressions in local 12B chat sweeps.
      draftPMin: _draftPath == null ? null : kDefaultDraftPMin,
      frequencyPenalty: 0.0,
      // Don't use below 1.1, LLMs without a repeat penalty
      // will repeat the same token.
      presencePenalty: 1.1,
      topP: _topP,
      // Keep the browser default modest. Large contexts reserve substantially
      // more WebGPU KV/compute memory and are rarely needed for the example.
      contextSize: kIsWeb ? 4096 : 16000,
      // Don't use 0.0, some models will repeat
      // the same token.
      temperature: _temperature,
      logger: (log) {
        if (log.contains('<unused')) {
          // 25-03-11: Added because Gemma 3 outputs so many that it
          // can break the VS Code log viewer.
          return;
        }
        if (log.contains('ggml_')) {
          // 25-03-11: Added because that's the biggest clutter-er left
          // when trying to get logs reduced down to compare Gemma 3 working vs.
          // not-working cases.
          return;
        }
        // ignore: avoid_print
        print('[llama.cpp] $log');
      },
    );

    // Keep this one-line-ish debug block copy/pasteable. MTP behavior is very
    // sensitive to the exact prompt/request shape; without this, GUI vs
    // integration vs llama-server comparisons are easy to misread.
    // ignore: avoid_print
    print('[fllama example request] ${jsonEncode({
          'modelPath': request.modelPath,
          'draftModelPath': request.draftModelPath,
          'draftNMax': request.draftNMax,
          'draftPMin': request.draftPMin,
          'contextSize': request.contextSize,
          'maxTokens': request.maxTokens,
          'temperature': request.temperature,
          'topP': request.topP,
          'frequencyPenalty': request.frequencyPenalty,
          'presencePenalty': request.presencePenalty,
          'openAiRequest': jsonDecode(request.toJsonString()),
        })}');

    _inferenceStartTime = DateTime.now();
    setState(() {
      _accReasoning = '';
      _accContent = '';
      _accToolCalls.clear();
      _finishReason = null;
      _timings = null;
      latestResultString = '';
      latestResultJson = '';
      latestOutputTokenCount = 0;
      _tokensPerSecond = 0;
    });

    if (kIsWeb) {
      final requestId =
          await fllamaChatWeb(request, (downloadProgress, loadProgress) {
        setState(() {
          _webDownloadProgress = downloadProgress;
          _webLoadProgress = loadProgress;
          // ignore: avoid_print
          print(
              'Download progress: $downloadProgress, Load progress: $loadProgress');
        });
      }, (response, responseJson, done) {
        _parseStreamChunk(responseJson);
        setState(() {
          _webDownloadProgress = null;
          _webLoadProgress = null;
          latestResultString = response;
          latestResultJson = responseJson;
          if (done) {
            _runningRequestId = null;
            _inferenceStartTime = null;
          }
        });
      });
      setState(() {
        _runningRequestId = requestId;
      });
      return;
    }

    final chatTemplate = await fllamaChatTemplateGet(_modelPath!);
    setState(() {
      latestChatTemplate = chatTemplate;
    });

    final eosToken = await fllamaEosTokenGet(_modelPath!);
    setState(() {
      latestEosToken = eosToken;
    });

    final bosToken = await fllamaBosTokenGet(_modelPath!);
    setState(() {
      latestBosToken = bosToken;
    });

    List<String> allResponses = [];
    int requestId = await fllamaChat(request, (response, responseJson, done) {
      _parseStreamChunk(responseJson);
      setState(() {
        allResponses.add(responseJson);
        latestResultString = response;
        latestResultJson = responseJson;
        fllamaTokenize(FllamaTokenizeRequest(
                input: latestResultString, modelPath: _modelPath!))
            .then((value) {
          final now = DateTime.now();
          final elapsedSeconds = _inferenceStartTime != null
              ? now.difference(_inferenceStartTime!).inMilliseconds / 1000.0
              : 0;
          setState(() {
            latestOutputTokenCount = value;
            if (elapsedSeconds > 0) {
              _tokensPerSecond = value / elapsedSeconds;
            }
          });
        });
        if (done) {
          // ignore: avoid_print
          print('[fllama example final] ${jsonEncode({
                'timings': _timings,
                'finishReason': _finishReason,
                'reasoningPrefix': _accReasoning.length > 300
                    ? _accReasoning.substring(0, 300)
                    : _accReasoning,
                'contentPrefix': _accContent.length > 300
                    ? _accContent.substring(0, 300)
                    : _accContent,
                'latestResultPrefix': latestResultString.length > 300
                    ? latestResultString.substring(0, 300)
                    : latestResultString,
              })}');
          _runningRequestId = null;
          _inferenceStartTime = null;

          // Useful for debugging JSON relay.
          // // Write all responses to a file.
          // final file = File('responses.json');
          // file.writeAsStringSync(jsonEncode(allResponses));
          // print('Wrote responses to: ${file.absolute.path}');
        }
      });
    });
    setState(() {
      _runningRequestId = requestId;
    });
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

  void _openDraftGgufPressed() async {
    final filePath = await _pickGgufPath();
    if (filePath == null) {
      await kSharedPrefs.remove(kDraftPathKey);
      return;
    } else {
      await kSharedPrefs.setString(kDraftPathKey, filePath);
    }

    setState(() {
      _draftPath = filePath;
    });
  }

  void _openImagePressed() async {
    final bytes = await _pickImageBytes();
    if (bytes == null) {
      return;
    }
    setState(() {
      _imageBytes = bytes;
    });
  }
}

Future<String?> _pickGgufPath() async {
  if (!kIsWeb && TargetPlatform.android == defaultTargetPlatform) {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.any,
    );

    return result?.files.first.path;
  }

  final file = await openFile(acceptedTypeGroups: <XTypeGroup>[
    XTypeGroup(
      // Only on iOS, macOS is fine.
      // [ERROR:flutter/runtime/dart_vm_initializer.cc(40)] Unhandled Exception: Invalid argument(s): The provided type group Instance of 'XTypeGroup' should either allow all files, or have a non-empty "uniformTypeIdentifiers"
      label: defaultTargetPlatform == TargetPlatform.iOS ? '' : '.gguf',
      extensions: defaultTargetPlatform == TargetPlatform.iOS ? [] : ['gguf'],
      // UTIs are required for iOS, which does not have a .gguf UTI.
      uniformTypeIdentifiers: const [],
    ),
  ]);

  if (file == null) {
    return null;
  }
  return file.path;
}

Future<Uint8List?> _pickImageBytes() async {
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
  return file.readAsBytes();
}
