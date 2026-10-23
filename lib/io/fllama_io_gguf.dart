import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

/// The context length that the model in the GGUF file at [modelPath] was
/// trained with: the `<architecture>.context_length` value. null if the file
/// cannot be read or does not have the value.
///
/// llama.cpp does not let one request use more than this, whatever the
/// context size. It reads only the start of the file, so it is fast enough to
/// call synchronously.
int? fllamaTrainedContextLength(String modelPath) {
  RandomAccessFile? file;
  try {
    file = File(modelPath).openSync();
    return _GgufHeader(file).contextLength();
  } catch (_) {
    return null;
  } finally {
    file?.closeSync();
  }
}

/// Reads the key-value metadata at the start of a GGUF file.
/// See https://github.com/ggml-org/ggml/blob/master/docs/gguf.md.
class _GgufHeader {
  static const _magic = 0x46554747; // "GGUF"
  static const _typeString = 8;
  static const _typeArray = 9;
  static const _fixedSizes = {
    0: 1, 1: 1, 2: 2, 3: 2, 4: 4, 5: 4, 6: 4, 7: 1, 10: 8, 11: 8, 12: 8, //
  };

  // Limits that a valid file does not reach. They stop a damaged file from
  // making the reader allocate or loop without end.
  static const _maxKeys = 1 << 20;
  static const _maxStringBytes = 1 << 26;

  final RandomAccessFile _file;
  final Uint8List _buffer = Uint8List(64 * 1024);
  int _start = 0; // Index of the first unread byte in _buffer.
  int _end = 0; // Index after the last valid byte in _buffer.

  _GgufHeader(this._file);

  int? contextLength() {
    if (_u32() != _magic) return null;
    final version = _u32();
    if (version < 2) return null; // Version 1 used 32-bit counts.
    _u64(); // Tensor count.
    final keyCount = _u64();
    if (keyCount < 0 || keyCount > _maxKeys) return null;

    String? architecture;
    final contextLengths = <String, int>{};
    for (var i = 0; i < keyCount; i++) {
      final key = _string();
      final type = _u32();
      if (key == 'general.architecture' && type == _typeString) {
        architecture = _string();
      } else if (key.endsWith('.context_length') &&
          (type == 4 || type == 5 || type == 10 || type == 11)) {
        contextLengths[key] = type == 4 || type == 5 ? _u32() : _u64();
      } else {
        _skipValue(type);
      }
      // Stop as soon as both are known: the large tokenizer arrays come
      // after them in files that llama.cpp writes.
      if (architecture != null) {
        final length = contextLengths['$architecture.context_length'];
        if (length != null) return length > 0 ? length : null;
      }
    }
    return null;
  }

  void _skipValue(int type) {
    if (type == _typeString) {
      _skip(_stringLength());
      return;
    }
    if (type == _typeArray) {
      final elementType = _u32();
      final count = _u64();
      if (count < 0) throw const FormatException('GGUF array too long');
      final size = _fixedSizes[elementType];
      if (size != null) {
        _skip(count * size);
      } else {
        for (var i = 0; i < count; i++) {
          _skipValue(elementType);
        }
      }
      return;
    }
    final size = _fixedSizes[type];
    if (size == null) throw FormatException('Unknown GGUF type $type');
    _skip(size);
  }

  String _string() =>
      utf8.decode(_bytes(_stringLength()), allowMalformed: true);

  /// The next [count] bytes of the file.
  Uint8List _bytes(int count) {
    if (count <= _buffer.length) {
      _fill(count);
      final bytes = Uint8List.sublistView(_buffer, _start, _start + count);
      _start += count;
      return bytes;
    }
    // Longer than the buffer: read into a list of its own.
    final buffered = _end - _start;
    final bytes = Uint8List(count)..setRange(0, buffered, _buffer, _start);
    _start = 0;
    _end = 0;
    var filled = buffered;
    while (filled < count) {
      final read = _file.readIntoSync(bytes, filled);
      if (read == 0) throw const FormatException('GGUF ended early');
      filled += read;
    }
    return bytes;
  }

  int _stringLength() {
    final length = _u64();
    if (length < 0 || length > _maxStringBytes) {
      throw const FormatException('GGUF string too long');
    }
    return length;
  }

  int _u32() => ByteData.sublistView(_bytes(4)).getUint32(0, Endian.little);

  /// A u64 as a Dart int. Values above 2^63 read as negative, and the
  /// callers reject them.
  int _u64() => ByteData.sublistView(_bytes(8)).getInt64(0, Endian.little);

  /// Makes [count] bytes, at most the buffer size, available from [_start].
  void _fill(int count) {
    if (_end - _start >= count) return;
    _buffer.setRange(0, _end - _start, _buffer, _start);
    _end -= _start;
    _start = 0;
    while (_end < count) {
      final read = _file.readIntoSync(_buffer, _end);
      if (read == 0) throw const FormatException('GGUF ended early');
      _end += read;
    }
  }

  void _skip(int count) {
    if (count < 0) throw const FormatException('GGUF size is negative');
    final buffered = _end - _start;
    if (count <= buffered) {
      _start += count;
      return;
    }
    _file.setPositionSync(_file.positionSync() + count - buffered);
    _start = 0;
    _end = 0;
  }
}
