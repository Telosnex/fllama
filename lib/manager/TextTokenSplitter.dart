import 'package:flutter_tiktoken/flutter_tiktoken.dart';

class TextTokenSplitter {
  /// 将文本按照指定的token数量上限拆分
  /// [text] 输入文本
  /// [maxTokensPerChunk] 每段最大token数，默认1000
  /// [modelName] 使用的模型名称，默认'gpt-4'
  /// [minLastChunkSize] 最后一个分片的最小token数，如果小于这个值将合并到前一分片，默认400
  /// 返回拆分后的文本数组
  static List<String> splitTextByTokens({
    required String text,
    int maxTokensPerChunk = 1000,
    String modelName = 'gpt-4',
    int minLastChunkSize = 400,
  }) {
    List<String> chunks = [];
    String remainingText = text;

    while (remainingText.isNotEmpty) {
      final encoding = encodingForModel(modelName);

      // 如果剩余文本的token数已经小于限制，直接添加整段
      if (calcuateTokens(text: remainingText, modelName: modelName) <= maxTokensPerChunk) {
        chunks.add(remainingText);
        break;
      }
      // 二分查找确定可以放入当前chunk的最大文本量
      int low = 0;
      int high = remainingText.length;

      while (low < high) {
        int mid = (low + high) ~/ 2;
        String testChunk = remainingText.substring(0, mid);

        if (calcuateTokens(text: testChunk, modelName: modelName) <= maxTokensPerChunk) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      // 找到合适的拆分点（尽量在句子或段落边界）
      int splitPoint = low - 1;
      final possibleDelimiters = ['. ', '? ', '! ', '\n\n', '\n'];
      for (var delimiter in possibleDelimiters) {
        int lastDelimiter = remainingText.substring(0, splitPoint).lastIndexOf(delimiter);
        if (lastDelimiter != -1) {
          splitPoint = lastDelimiter + delimiter.length;
          break;
        }
      }
      // 如果没找到好的拆分点，就直接使用token计算的结果
      if (splitPoint <= 0) {
        splitPoint = low - 1;
      }

      // 添加当前片段并更新剩余文本
      chunks.add(remainingText.substring(0, splitPoint));
      remainingText = remainingText.substring(splitPoint);
    }

    // 处理最后一个分片小于minLastChunkSize的情况
    if (chunks.length > 1) {
      int lastChunkTokens = calcuateTokens(text: chunks.last, modelName: modelName);
      if (lastChunkTokens < minLastChunkSize) {
        int secondLastChunkTokens = calcuateTokens(text: chunks[chunks.length - 2], modelName: modelName);
        // 当最后一块特别小时，即使稍微超过限制也允许合并
        if (lastChunkTokens + secondLastChunkTokens <= maxTokensPerChunk ||
            lastChunkTokens < minLastChunkSize / 2) { // 特别小的片段强制合并
          String mergedChunk = chunks[chunks.length - 2] + chunks.last;
          chunks.removeRange(chunks.length - 2, chunks.length);
          chunks.add(mergedChunk);
        }
      }
    }

    return chunks;
  }

  // 使用提供的方法计算token数量
  static int calcuateTokens({required String text, String modelName = 'gpt-4'}) {
    final encoding = encodingForModel(modelName);
    final numTokens = encoding.encode(text).length;
    return numTokens;
  }
}
