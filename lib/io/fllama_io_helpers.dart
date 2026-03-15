import 'dart:convert';
import 'dart:ffi';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';

Pointer<Char> stringToPointerChar(String string) {
  final units = utf8.encode(string);
  final Pointer<Uint8> result = calloc<Uint8>(units.length + 1);
  final Uint8List nativeString = result.asTypedList(units.length + 1);
  nativeString.setAll(0, units);
  nativeString[units.length] = 0; // Null-terminate
  return result.cast<Char>();
}

/// Returns an empty string if [pointerChar] is [nullptr].
String pointerCharToString(Pointer<Char> pointerChar) {
  if (pointerChar == nullptr) {
    return '';
  }
  try {
    return pointerChar.cast<Utf8>().toDartString();
  } catch (e) {
    // Prevent ex. FormatException: Unexpected extension byte (at offset 8)
    return '';
  }
}

/// Convert a fixed-size native C char array to a Dart string.
String charArrayToString(Array<Char> array, int maxLen) {
  final bytes = <int>[];
  for (var i = 0; i < maxLen; i++) {
    final value = array[i];
    if (value == 0) {
      break;
    }
    bytes.add(value & 0xFF);
  }
  if (bytes.isEmpty) {
    return '';
  }
  try {
    return utf8.decode(bytes, allowMalformed: false);
  } catch (_) {
    return '';
  }
}
