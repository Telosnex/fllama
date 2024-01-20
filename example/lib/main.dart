import 'dart:io';
import 'dart:ffi';

import 'package:fllama/fllama_bindings_generated.dart';
import 'package:flutter/material.dart';
import 'dart:async';

import 'package:fllama/fllama.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late Future<String> sumAsyncResult;

  @override
  void initState() {
    super.initState();
    final request = FllamaInferenceRequest(
      input: 'Hello, world!',
      numThreads: 8,
      numThreadsBatch: 8,
      numGpuLayers: 0,
      modelPath: '',
    );
    // /Call the FFI function and pass the pointer to the struct.
    sumAsyncResult = fllamaInferenceAsync(request);
  }

  @override
  Widget build(BuildContext context) {
    const textStyle = TextStyle(fontSize: 25);
    const spacerSmall = SizedBox(height: 10);
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Native Packages'),
        ),
        body: SingleChildScrollView(
          child: Container(
            padding: const EdgeInsets.all(10),
            child: Column(
              children: [
                Text(Directory.current.path),
                const Text(
                  'This BLORP a native function through FFI that is shipped as source in the package. '
                  'The native code is built as part of the Flutter Runner build.',
                  style: textStyle,
                  textAlign: TextAlign.center,
                ),
                spacerSmall,
                FutureBuilder<String>(
                  future: sumAsyncResult,
                  builder: (BuildContext context, AsyncSnapshot<String> value) {
                    final displayValue =
                        (value.hasData) ? value.data : 'loading';
                    return Text(
                      'Inference = $displayValue',
                      style: textStyle,
                      textAlign: TextAlign.center,
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
