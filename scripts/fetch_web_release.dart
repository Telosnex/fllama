// Downloads the generated web files of native_artifacts/web.json into a
// directory, for `web_build: local` (kiln ADR 002).
//
// A change to the native sources changes the package source key, and kiln
// then refuses to download the released web files. The web tests of such a
// change still use the released wllama build: only fllama_web_init.js, which
// kiln takes from the package in both modes, is new.
//
//   dart scripts/fetch_web_release.dart <directory>
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';

Future<void> main(List<String> args) async {
  if (args.length != 1) {
    stderr.writeln('Usage: dart scripts/fetch_web_release.dart <directory>');
    exit(64);
  }
  final out = Directory(args.single);
  final manifest =
      jsonDecode(File('native_artifacts/web.json').readAsStringSync()) as Map;
  final client = HttpClient();
  try {
    for (final entry in (manifest['files'] as List).cast<Map>()) {
      if (entry['source'] != 'release') continue;
      final name = entry['name'] as String;
      final url = Uri.parse(entry['url'] as String);
      final request = await client.getUrl(url);
      final response = await request.close();
      if (response.statusCode != 200) {
        throw HttpException('HTTP ${response.statusCode}', uri: url);
      }
      final download = await response.fold<List<int>>(
        <int>[],
        (bytes, chunk) => bytes..addAll(chunk),
      );
      _check(name, 'download', download, entry['downloadSha256'] as String);
      final bytes = url.path.endsWith('.gz') ? gzip.decode(download) : download;
      _check(name, 'file', bytes, entry['sha256'] as String);
      final file = File('${out.path}/$name');
      await file.parent.create(recursive: true);
      await file.writeAsBytes(bytes);
      stdout.writeln('$name: ${bytes.length} bytes');
    }
  } finally {
    client.close(force: true);
  }
  stdout.writeln('Web files of ${manifest['release']} in ${out.path}');
}

void _check(String name, String what, List<int> bytes, String expected) {
  final actual = sha256.convert(bytes).toString();
  if (actual != expected) {
    throw StateError('$name: $what SHA-256 $actual, expected $expected.');
  }
}
