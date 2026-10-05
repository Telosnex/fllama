import 'dart:convert';

import 'package:crypto/crypto.dart';

/// Computes the local cache key of a native fllama build (ADR 005 D4): the
/// native_prebuilt source key of the package, the target, the CMake
/// defines, and host toolchain inputs such as the GPU SDK version.
String computeBuildKey({
  required String os,
  required String arch,
  String targetVariant = '',
  String? toolset,
  required Map<String, String> defines,
  Map<String, String> extra = const {},
  required String sourceKey,
}) {
  final buffer = StringBuffer();
  buffer.writeln('v4'); // v4 uses the native_prebuilt source key.
  buffer.writeln('os=$os');
  buffer.writeln('arch=$arch');
  buffer.writeln('target_variant=$targetVariant');
  // Written only when set, so default-toolset keys stay unchanged.
  if (toolset != null) buffer.writeln('toolset=$toolset');

  final sortedDefines = defines.entries.toList()
    ..sort((a, b) => a.key.compareTo(b.key));
  for (final entry in sortedDefines) {
    buffer.writeln('D:${entry.key}=${entry.value}');
  }
  // Inputs that are not CMake defines, such as the GPU SDK version. Written
  // only when set, so keys without them stay unchanged.
  final sortedExtra = extra.entries.toList()
    ..sort((a, b) => a.key.compareTo(b.key));
  for (final entry in sortedExtra) {
    buffer.writeln('X:${entry.key}=${entry.value}');
  }
  buffer.writeln('source=$sourceKey');

  final digest = sha256.convert(utf8.encode(buffer.toString()));
  // 16 hex chars = 64 bits. For ~10^5 distinct cache entries the
  // birthday-collision probability is ~2.7e-10 — effectively zero.
  return digest.toString().substring(0, 16);
}
