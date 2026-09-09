// A dependency-free HTTP server for copying CI-cached GGUFs to mobile apps.
import 'dart:io';

Future<void> main(List<String> args) async {
  if (args.length != 3) {
    stderr.writeln(
      'Usage: dart scripts/serve_test_models.dart CACHE_DIR BIND_ADDRESS PORT',
    );
    exitCode = 64;
    return;
  }
  final server = await serveTestModels(
    Directory(args[0]),
    args[1],
    int.parse(args[2]),
  );
  stdout.writeln(
    'Serving ${args[0]} on ${server.address.address}:${server.port}',
  );
}

Future<HttpServer> serveTestModels(
  Directory directory,
  String address,
  int port,
) async {
  if (!await directory.exists()) {
    throw ArgumentError(
      'Model cache directory does not exist: ${directory.path}',
    );
  }
  final server = await HttpServer.bind(address, port);
  server.listen((request) async {
    try {
      if (request.method != 'GET' && request.method != 'HEAD') {
        request.response.statusCode = HttpStatus.methodNotAllowed;
        await request.response.close();
        return;
      }
      // No directory listing, traversal, or access to non-model files.
      final parts = request.uri.pathSegments;
      final name = parts.length == 1 ? parts.single : '';
      if (!RegExp(r'^[A-Za-z0-9_.-]+\.gguf$').hasMatch(name)) {
        request.response.statusCode = HttpStatus.notFound;
        await request.response.close();
        return;
      }
      final file = File('${directory.path}${Platform.pathSeparator}$name');
      if (!await file.exists()) {
        request.response.statusCode = HttpStatus.notFound;
        await request.response.close();
        return;
      }
      request.response.headers.contentType = ContentType.binary;
      request.response.contentLength = await file.length();
      if (request.method == 'GET') {
        await request.response.addStream(file.openRead());
      }
      await request.response.close();
    } catch (error) {
      stderr.writeln('Model transfer failed for ${request.uri}: $error');
      // Clients may disconnect when tests end; do not crash the model server.
      try {
        await request.response.close();
      } catch (_) {}
    }
  });
  return server;
}
