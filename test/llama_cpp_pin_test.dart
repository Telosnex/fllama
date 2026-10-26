// Native and web must run the same llama.cpp. Native builds the vendored
// src/llama.cpp; the web build (tool/kiln/build_web.dart) clones llama.cpp
// at the commit in web_build/wllama.json. The two pins must be one commit.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('web_build/wllama.json pins the llama.cpp commit of src/llama.cpp', () {
    final drop = File(
      'src/llama.cpp/FLLAMA_LLAMA_CPP_DROP.txt',
    ).readAsStringSync();
    final native = RegExp(
      r'^Source commit:\s+([0-9a-f]{40})\s*$',
      multiLine: true,
    ).firstMatch(drop)?.group(1);
    expect(
      native,
      isNotNull,
      reason: 'FLLAMA_LLAMA_CPP_DROP.txt has no "Source commit:" line.',
    );

    final wllama =
        jsonDecode(File('web_build/wllama.json').readAsStringSync())
            as Map<String, dynamic>;
    final web = (wllama['llamaCpp'] as Map<String, dynamic>)['commit'];

    expect(
      web,
      native,
      reason:
          'Native builds llama.cpp $native (src/llama.cpp), web builds '
          '$web (web_build/wllama.json). Update both together.',
    );
  });
}
