import 'dart:io';

import 'package:test/test.dart';

import '../scripts/serve_test_models.dart';

void main() {
  late Directory cache;
  late HttpServer server;
  late HttpClient client;
  final bytes = List.generate(1024, (i) => i % 256);

  setUp(() async {
    cache = await Directory.systemTemp.createTemp('fllama-model-server-');
    await File('${cache.path}/model.gguf').writeAsBytes(bytes);
    server = await serveTestModels(cache, '127.0.0.1', 0);
    client = HttpClient();
  });
  tearDown(() async {
    client.close(force: true);
    await server.close(force: true);
    await cache.delete(recursive: true);
  });

  Future<HttpClientResponse> request(
    String path, {
    String method = 'GET',
  }) async {
    final request = await client.openUrl(
      method,
      Uri.parse('http://127.0.0.1:${server.port}$path'),
    );
    return request.close();
  }

  test('streams exact GGUF bytes and content length', () async {
    final response = await request('/model.gguf');
    expect(response.statusCode, HttpStatus.ok);
    expect(response.contentLength, bytes.length);
    expect(await response.expand((chunk) => chunk).toList(), bytes);
  });
  test('HEAD returns size without a body', () async {
    final response = await request('/model.gguf', method: 'HEAD');
    expect(response.contentLength, bytes.length);
    expect(await response.toList(), isEmpty);
  });
  test(
    'rejects missing files, directories and paths outside model cache',
    () async {
      for (final path in [
        '/',
        '/missing.gguf',
        '/secret.txt',
        '/sub/model.gguf',
        '/..%2fmodel.gguf',
      ]) {
        final response = await request(path);
        expect(response.statusCode, HttpStatus.notFound, reason: path);
        await response.drain<void>();
      }
    },
  );
  test('does not accept uploads', () async {
    final response = await request('/model.gguf', method: 'POST');
    expect(response.statusCode, HttpStatus.methodNotAllowed);
    await response.drain<void>();
  });
}
