import 'dart:async';

import 'package:fllama/fllama.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tiktoken/flutter_tiktoken.dart';

import 'LLMException.dart';
import 'TextTokenSplitter.dart';

/// 本地LLM响应监听器接口
typedef LLMResponseListener = void Function(String content, bool done);

/// 本地LLM管理器，用于处理模型推理请求
class LocalLLMManager {
  int? _runningRequestId;

  // DateTime? _inferenceStartTime;

  /// 运行推理并获取响应
  /// [modelPath] 模型文件路径
  /// [content] 输入内容
  /// [listener] 响应监听器
  /// [maxTokens] 最大生成Token数
  /// [temperature] 温度参数
  /// [topP] 采样参数
  /// [contextSize] 上下文窗口大小
  Future<String> runInference({
    required String modelPath,
    required String content,
    required LLMResponseListener listener,
    int maxTokens = 1000,
    double temperature = 0.1,
    // double topP = 0.9,
    int contextSize = 2048,
  }) async {
    debugPrint("run model modelPath:$modelPath content_len:${content.length}");
    String allResult = "";
    try {
      debugPrint("total tokens:${calcuateTokens(text: content)}");
      // 文章切片
      List<String> textChunks = TextTokenSplitter.splitTextByTokens(
        text: content,
        maxTokensPerChunk: 1024,
        modelName: 'gpt-4', // 可选，默认就是gpt-4
        minLastChunkSize: 400,
      );

      debugPrint('text has been split into ${textChunks.length} 段');
      for (int i = 0; i < textChunks.length; i++) {
        print(
          '${i + 1} chunks: ${TextTokenSplitter.calcuateTokens(text: textChunks[i])} tokens',
        );
      }
      String chunk = "";
      int totalToken = 0;
      String latestResultString = "";
      for (int i = 0; i < textChunks.length; i++) {
        chunk = textChunks[i];
        totalToken = totalToken + calcuateTokens(text: chunk);
        if (totalToken > 6000) {}
        final completer = Completer();
        // 2. Inference with chat template.
        final request = OpenAiRequest(
          maxTokens: maxTokens.round(),
          messages: [
            Message(Role.user, """
Please help me analyze and summarize the following transcription content, following these requirements:

## Overall Requirements
- Provide a concise overview (no more than 3 sentences) that captures the core theme of the entire conversation/content
- Extract 2-3 key information points, ranked by importance
- The summary should be concise, with a total word count of no more than 300 words

## Response Format
```
## Core Content
[Provide a1-2 sentence general overview]

## Key Information Points
1. [Most important information point]
2. [Second most important information point]
...

## Summary
...

## Brief Summary
[A short summary integrating the main ideas and insights]
```
Please omit unimportant details, repetitive content, and casual conversation, focusing on extracting information of substantial value.

Transcription content:
[$chunk]
            """)
          ],
          numGpuLayers: 99,
          /* this seems to have no adverse effects in environments w/o GPU support, ex. Android and web */
          modelPath: modelPath,
          // mmprojPath: _mmprojPath,
          frequencyPenalty: 0.0,
          // Don't use below 1.1, LLMs without a repeat penalty
          // will repeat the same token.
          presencePenalty: 1.1,
          topP: 1.0,
          // contextSize: 20000,
          // Don't use 0.0, some models will repeat
          // the same token.
          temperature: temperature,
          contextSize: contextSize,
          logger: (log) {
            if (log.contains('ggml_')) {
              return;
            }
            // ignore: avoid_print
            debugPrint('[llama.cpp] $log');
          },
        );

        int requestId = await fllamaChat(
          request,
          (response, responseJson, done) {
            debugPrint("done:$done response:$response");
            if (response.startsWith("Error:")) {
              debugPrint("LLM callback error $response");
              completer.completeError(LLMException(response, -1));
            }
            if (response.contains("<end_of_turn>")) {
              done = true;
            }
            if (done) {
              allResult = "$allResult\n\n$latestResultString";
              completer.complete();
            } else {
              latestResultString = response;
              if (response.isNotEmpty) {
                listener(allResult + response, false);
              }
            }
          },
        );
        _runningRequestId = requestId;
        // 等待当前分片处理完成
        await completer.future;
        cancelInference();
      }
    } catch (e) {
      debugPrint("run inference error $e");
      rethrow;
    }
    debugPrint("finish llm");
    listener(allResult, true);
    return allResult;
  }

  /// 取消当前正在运行的推理请求
  void cancelInference() {
    if (_runningRequestId != null) {
      fllamaCancelInference(_runningRequestId!);
      _runningRequestId = null;
    }
  }

  static int calcuateTokens({
    required String text,
    String modelName = 'gpt-4',
  }) {
    final encoding = encodingForModel(modelName);
    final numTokens = encoding.encode(text).length;
    return numTokens;
  }
}
