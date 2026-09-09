import 'dart:io';

import 'test_model_manager.dart';

Future<void> main() async {
  final cachePath = Platform.environment['MODEL_CACHE_DIR'];
  if (cachePath == null || cachePath.isEmpty) {
    throw StateError('MODEL_CACHE_DIR must be set.');
  }

  final manager = TestModelManager(cacheDirectory: Directory(cachePath));
  await manager.getModel(TestModel.qwen35_08b);
  await manager.getModel(TestModel.qwen35_08bMmproj);
}
