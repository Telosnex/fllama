import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:fllama/io/fllama_io_gguf.dart';
import 'package:test/test.dart';

void main() {
  late Directory dir;

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('fllama_gguf_test');
  });

  tearDown(() async {
    await dir.delete(recursive: true);
  });

  String write(List<int> bytes) {
    final file = File('${dir.path}/model.gguf')..writeAsBytesSync(bytes);
    return file.path;
  }

  test('reads the context length of the architecture', () {
    final path = write(
      _gguf([
        _kvString('general.architecture', 'qwen35'),
        _kvString('general.name', 'Test'),
        _kvU32('qwen35.context_length', 262144),
      ]),
    );
    expect(fllamaTrainedContextLength(path), 262144);
  });

  test('finds the architecture after its context length, past arrays', () {
    final path = write(
      _gguf([
        _kvU32('other.context_length', 4096),
        _kvU64('llama.context_length', 131072),
        _kvStringArray('tokenizer.ggml.tokens', ['a', 'bc', 'd' * 100000]),
        _kvI32Array('tokenizer.ggml.token_type', [1, 2, 3]),
        _kvString('general.license', 'x' * 200000), // Longer than the buffer.
        _kvString('general.architecture', 'llama'),
      ]),
    );
    expect(fllamaTrainedContextLength(path), 131072);
  });

  test('is null without a context length, or for a file that is not GGUF', () {
    expect(
      fllamaTrainedContextLength(
        write(_gguf([_kvString('general.architecture', 'clip')])),
      ),
      isNull,
    );
    expect(fllamaTrainedContextLength(write(utf8.encode('not gguf'))), isNull);
    expect(fllamaTrainedContextLength('${dir.path}/missing.gguf'), isNull);
  });

  test('is null for a file that ends in the metadata', () {
    final bytes = _gguf([
      _kvString('general.architecture', 'llama'),
      _kvU32('llama.context_length', 8192),
    ]);
    expect(
      fllamaTrainedContextLength(write(bytes.sublist(0, bytes.length - 2))),
      isNull,
    );
  });
}

List<int> _gguf(List<List<int>> keyValues) => [
  ..._u32(0x46554747), // "GGUF"
  ..._u32(3), // Version.
  ..._u64(0), // Tensor count.
  ..._u64(keyValues.length),
  for (final kv in keyValues) ...kv,
];

List<int> _string(String value) {
  final bytes = utf8.encode(value);
  return [..._u64(bytes.length), ...bytes];
}

List<int> _kvString(String key, String value) => [
  ..._string(key),
  ..._u32(8),
  ..._string(value),
];

List<int> _kvU32(String key, int value) => [
  ..._string(key),
  ..._u32(4),
  ..._u32(value),
];

List<int> _kvU64(String key, int value) => [
  ..._string(key),
  ..._u32(10),
  ..._u64(value),
];

List<int> _kvStringArray(String key, List<String> values) => [
  ..._string(key),
  ..._u32(9),
  ..._u32(8),
  ..._u64(values.length),
  for (final value in values) ..._string(value),
];

List<int> _kvI32Array(String key, List<int> values) => [
  ..._string(key),
  ..._u32(9),
  ..._u32(5),
  ..._u64(values.length),
  for (final value in values) ..._u32(value),
];

List<int> _u32(int value) =>
    (ByteData(4)..setUint32(0, value, Endian.little)).buffer.asUint8List();

List<int> _u64(int value) =>
    (ByteData(8)..setUint64(0, value, Endian.little)).buffer.asUint8List();
