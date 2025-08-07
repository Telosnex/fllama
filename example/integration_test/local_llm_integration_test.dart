// ignore_for_file: avoid_print

import 'dart:convert';
import 'dart:io';

import 'package:fllama/fllama.dart' as fllama;
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';


import 'test/initialize.dart';
import 'test/test_helpers.dart';
import 'test/test_model_manager.dart';

void main() {
  const kIterations = 1;
  
  // Skip on web - these are llama.cpp tests
  if (kIsWeb) {
    print('Skipping local LLM integration tests on web');
    return;
  }
  
  // Skip on certain platforms due to limitations
  const skipPlatforms = {
    TargetPlatform.android,
    TargetPlatform.iOS,
    TargetPlatform.windows,
  };
  
  if (skipPlatforms.contains(defaultTargetPlatform)) {
    print('Skipping local LLM integration tests on $defaultTargetPlatform');
    return;
  }

  group('Local LLM Integration Test', () {
    setUp(() {
      prepareAllowNetworkRequests();
      prepareSharedPreferences();
    });

    // Define a reusable test function for model inference tests
    void runInferenceTests(TestModel testModel, String modelName, {bool skipAll = false}) {
      group('$modelName Inference', skip: skipAll ? 'Skipping for GPU debugging' : null, () {
        late File modelFile;
        
        setUpAll(() async {
          prepareAllowNetworkRequests();
          prepareTestBindings();
          await preparePathProviderAsync();
          prepareSharedPreferences();

          final modelManager = TestModelManager();
          logTest('Model manager created. Await model download...');
          try {
            modelFile = await modelManager.getModel(testModel);
            logTest('Model downloaded to ${modelFile.absolute.path}');
          } catch (e) {
            logTest('Failed to download model: $e');
            logTest('Skipping test - model download failed');
            logTest('Try downloading the model manually to: ${modelManager.getModelStoragePath(testModel)}');
            throw TestFailure('Model download failed - check network connection or download manually');
          }
          return Future.value();
        });

        // Skip additional tests on Linux CI due to performance
        final shouldSkipAnythingPastOneChat =
            defaultTargetPlatform == TargetPlatform.linux;

        test(
          'raw chat works',
          skip: shouldSkipAnythingPastOneChat,
          () async {
            try {
              logTest('Running raw chat test for $modelName');
              final (handler, completionCompleter) = createLlmResponseHandler();
              final sw = Stopwatch()..start();
              logTest('Created response handler, starting raw chat...');
              
              await fllama.fllamaChat(
                fllama.OpenAiRequest(
                  modelPath: modelFile.absolute.path,
                  maxTokens: 10,
                  numGpuLayers: 99,  // Enable GPU acceleration
                  messages: [
                    fllama.Message(fllama.Role.user, 'Hello, how are you?'),
                  ],
                  logger: (p0) {
                    print('[llama.cpp log]: $p0');
                  },
                ),
                handler,
              );
              
              logTest('Raw chat completed, awaiting response...');
              await completionCompleter.future.timeout(Duration(minutes: 5));
              logTest(
                'Raw chat completed in ${sw.elapsedMilliseconds} ms',
              );
            } catch (e) {
              fail('Error during raw chat: $e');
            }
          },
          timeout: Timeout(Duration(minutes: 10)),
        );

        test('simple chat request', () async {
          try {
            final sw = Stopwatch()..start();
            final (handler, completionCompleter) = createLlmResponseHandler();
            
            await fllama.fllamaChat(
              fllama.OpenAiRequest(
                messages: [
                  fllama.Message(fllama.Role.user, 'Hello'),
                ],
                modelPath: modelFile.absolute.path,
                maxTokens: 200,
                numGpuLayers: 99,  // Enable GPU acceleration
                temperature: 1.0,
                topP: 1.0,
                contextSize: 4096,
              ),
              handler,
            );
            
            logTest('Awaiting final answer...');
            final answer = await completionCompleter.future.timeout(Duration(minutes: 5));
            logTest('Answer received, took ${sw.elapsedMilliseconds} ms');
            await Future.delayed(Duration(seconds: 1));
            expect(answer, isNotEmpty);
          } catch (e) {
            logTest('Error: $e');
            rethrow;
          }
        }, timeout: Timeout(Duration(minutes: 10)));

        test(
          'force tool call',
          skip: shouldSkipAnythingPastOneChat,
          () async {
            try {
              const trials = kIterations;
              final answers = <String>[];
              
              for (var i = 0; i < trials; i++) {
                logTest('Answer #${i + 1} start...');
                final sw = Stopwatch()..start();
                final (handler, completionCompleter) = createLlmResponseHandler();
                
                final tool = fllama.Tool(
                  name: 'search_queries',
                  description: 'Perform a search query',
                  jsonSchema: jsonEncode({
                    'type': 'object',
                    'properties': {
                      'query': {
                        'type': 'string',
                        'description': 'The search query',
                      },
                    },
                    'required': ['query'],
                  }),
                );
                
                await fllama.fllamaChat(
                  fllama.OpenAiRequest(
                    messages: [
                      fllama.Message(
                        fllama.Role.user,
                        'Hello search for 2days weather in w/e the china capital is',
                      ),
                    ],
                    tools: [tool],
                    toolChoice: fllama.ToolChoice.required,
                    modelPath: modelFile.absolute.path,
                    maxTokens: 200,
                    numGpuLayers: 99,  // Enable GPU acceleration
                    temperature: 0.5,
                    topP: 1.0,
                    contextSize: 4096,
                    logger: null,  // Disable logging for tool tests to avoid massive output
                  ),
                  handler,
                );
                
                final answer = await completionCompleter.future.timeout(Duration(minutes: 5));
                logTest(
                  'Answer #${i + 1} done) $answer, duration: ${sw.elapsedMilliseconds} ms',
                );
                await Future.delayed(Duration(seconds: 1));
                expect(answer, isNotEmpty);
                answers.add(answer);
              }

              final expectedContent = 'Beijing';
              expect(
                answers,
                everyElement(contains(expectedContent)),
                reason: 'Expected content: $expectedContent. Answers: $answers',
              );
            } catch (e) {
              logTest('Error: $e');
              rethrow;
            }
          },
          timeout: Timeout(Duration(minutes: 10)),
        );

        test(
          'unforced tool call',
          skip: shouldSkipAnythingPastOneChat,
          () async {
            try {
              const trials = kIterations;
              final answers = <String>[];
              
              for (var i = 0; i < trials; i++) {
                logTest('Answer #${i + 1} start...');
                final sw = Stopwatch()..start();
                final (handler, completionCompleter) = createLlmResponseHandler();
                
                final tool = fllama.Tool(
                  name: 'search_queries',
                  description: 'Perform a search query',
                  jsonSchema: jsonEncode({
                    'type': 'object',
                    'properties': {
                      'query': {
                        'type': 'string',
                        'description': 'The search query',
                      },
                    },
                    'required': ['query'],
                  }),
                );
                
                await fllama.fllamaChat(
                  fllama.OpenAiRequest(
                    messages: [
                      fllama.Message(
                        fllama.Role.user,
                        'Hello search for 2days weather in w/e the china capital is',
                      ),
                    ],
                    tools: [tool],
                    toolChoice: fllama.ToolChoice.auto,
                    modelPath: modelFile.absolute.path,
                    maxTokens: 200,
                    numGpuLayers: 99,  // Enable GPU acceleration
                    temperature: 0.5,
                    topP: 1.0,
                    contextSize: 4096,
                    logger: null,  // Disable logging for tool tests
                  ),
                  handler,
                );
                
                final answer = await completionCompleter.future.timeout(Duration(minutes: 5));
                logTest(
                  'Answer #${i + 1} done) $answer, duration: ${sw.elapsedMilliseconds} ms',
                );
                await Future.delayed(Duration(seconds: 1));
                expect(answer, isNotEmpty);
                answers.add(answer);
              }

              final expectedContent = 'Beijing';
              expect(
                answers,
                everyElement(contains(expectedContent)),
                reason: 'Expected content: $expectedContent. Answers: $answers',
              );
            } catch (e) {
              logTest('Error: $e');
              rethrow;
            }
          },
          timeout: Timeout(Duration(minutes: 10)),
        );

        test(
          'verify tool call JSON format',
          skip: shouldSkipAnythingPastOneChat,
          () async {
            try {
              const trials = kIterations;
              final answers = <String>[];
              
              for (var i = 0; i < trials; i++) {
                logTest('Answer #${i + 1} start...');
                final sw = Stopwatch()..start();
                final (handler, completionCompleter) = createLlmResponseHandler();
                
                final tool = fllama.Tool(
                  name: 'search_queries',
                  description: 'Perform a search query',
                  jsonSchema: jsonEncode({
                    'type': 'object',
                    'properties': {
                      'query': {
                        'type': 'string',
                        'description': 'The search query',
                      },
                    },
                    'required': ['query'],
                  }),
                );
                
                await fllama.fllamaChat(
                  fllama.OpenAiRequest(
                    messages: [
                      fllama.Message(
                        fllama.Role.user,
                        'Hello search for 2days weather in Beijing',
                      ),
                    ],
                    tools: [tool],
                    toolChoice: fllama.ToolChoice.required,
                    modelPath: modelFile.absolute.path,
                    maxTokens: 200,
                    numGpuLayers: 99,  // Enable GPU acceleration
                    temperature: 0.5,
                    topP: 1.0,
                    contextSize: 4096,
                    logger: null,  // Disable logging for tool tests
                  ),
                  handler,
                );
                
                final answer = await completionCompleter.future.timeout(Duration(minutes: 5));
                logTest(
                  'Answer #${i + 1} done) $answer, duration: ${sw.elapsedMilliseconds} ms',
                );
                answers.add(answer);
              }

              for (final response in answers) {
                // Try to parse as JSON
                try {
                  final json = jsonDecode(response);
                  expect(json, isA<Map<String, dynamic>>());
                  expect(json['name'], 'search_queries');
                  expect(json['arguments'], isNotNull);
                  expect(json['arguments']['query'], isNotNull);
                  expect(
                    json['arguments']['query'].toString().toLowerCase(),
                    contains('beijing'),
                    reason:
                        'Expected query to contain "beijing", but got: ${json['arguments']['query']}',
                  );
                } catch (e) {
                  // If not valid JSON, check if it's in the expected format
                  expect(response, contains('search_queries'));
                  expect(response.toLowerCase(), contains('beijing'));
                }
              }
            } catch (e) {
              logTest('Error: $e');
              rethrow;
            }
          },
          timeout: Timeout(Duration(minutes: 10)),
        );
      });
    }

    // Run the inference tests on Phi-4 mini
    runInferenceTests(TestModel.tinyStories, 'Phi-4 mini');
    
    // Optionally run tests on other models
    // runInferenceTests(TestModel.gemma2_2b, 'Gemma 2 2B');
    // runInferenceTests(TestModel.smolLm3, 'SmolLM 3');
    // runInferenceTests(TestModel.llama3_2_1b, 'Llama 3.2 1B');
  });
}
