import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

void prepareTestBindings() {
  TestWidgetsFlutterBinding.ensureInitialized();
}

// Needed instead of preparePathProvider in integration tests.
//
// This is because on iOS / Android, using Directory.current.path will
// not work. Ex. on iOS, Error: `OS Error: Read-only file system, errno = 30`
Future<String> preparePathProviderAsync() async {
  if (kIsWeb) {
    return '';
  }
  TestWidgetsFlutterBinding.ensureInitialized();

  final documentsDirectory = await getApplicationDocumentsDirectory();
  final currentDirectory = documentsDirectory.path;
  return _preparePathProviderInsidePath(currentDirectory);
}

String preparePathProvider() {
  if (kIsWeb) {
    return '';
  }
  TestWidgetsFlutterBinding.ensureInitialized();
  return preparePathProviderUnsafeNoBindings();
}

String preparePathProviderUnsafeNoBindings() {
  if (kIsWeb) {
    return '';
  }
  // This is used in the tests that do not use TestWidgetsFlutterBinding.
  final currentDirectory = Directory.current.path;
  return _preparePathProviderInsidePath(currentDirectory);
}

String _preparePathProviderInsidePath(String path) {
  final storagePath =
      '$path/ephemeral/path_provider_test_all_directories/${const Uuid().v7()}';
  
  Directory(storagePath).createSync(recursive: true);
  
  return storagePath;
}

void prepareAllowNetworkRequests() {
  HttpOverrides.global = null;
}

void prepareSharedPreferences() {
  SharedPreferences.setMockInitialValues({});
}
