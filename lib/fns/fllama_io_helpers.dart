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

String pointerCharToString(Pointer<Char> pointerChar) {
  return pointerChar.cast<Utf8>().toDartString();
}