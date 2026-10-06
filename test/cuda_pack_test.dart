// The separately built CUDA pack (docs/ADR_004_DESKTOP_GPU_BACKENDS.md,
// D16): its key, descriptor checks, CMake table and release-build defines.
import 'dart:convert';
import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:crypto/crypto.dart';
import 'package:native_prebuilt/native_prebuilt.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

import '../hook/build.dart' as hook;

const repo = 'Telosnex/fllama';
final root = Directory.current.uri;

String digest(String text) => sha256.convert(utf8.encode(text)).toString();

SourceFile file(String path, String content) =>
    SourceFile(path, digest(content), root.resolve(path));

Future<hook.CudaPackKey> keyOf(
  List<SourceFile> files, {
  String target = 'linux-x64',
}) => hook.computeCudaPackKey(packageRoot: root, target: target, files: files);

final baseFiles = [
  file('src/llama.cpp/ggml/src/ggml-cuda/mmq.cu', 'kernel'),
  file('src/llama.cpp/ggml/src/ggml.c', 'core'),
  file('src/llama.cpp/ggml/include/ggml.h', 'api'),
  file('src/cuda_pack/CMakeLists.txt', 'project'),
];

hook.CudaPackDescriptor descriptorFor(hook.CudaPackKey key) {
  String url(String name) =>
      githubAssetUrl(repo, key.tag, '${key.target}-$name.gz');
  return hook.CudaPackDescriptor(
    target: key.target,
    key: key.key,
    files: [
      for (final name in ['libcudart.so.12', 'libggml-cuda.so'])
        hook.CudaPackFile(name: name, sha256: digest(name), url: url(name)),
    ],
  );
}

void main() {
  group('CUDA pack key', () {
    test('changes with ggml-cuda, ggml-base and the pack project', () async {
      final base = await keyOf(baseFiles);
      for (final changed in [
        'src/llama.cpp/ggml/src/ggml-cuda/mmq.cu',
        'src/llama.cpp/ggml/src/ggml.c',
        'src/llama.cpp/ggml/include/ggml.h',
        'src/cuda_pack/CMakeLists.txt',
      ]) {
        final files = [
          for (final f in baseFiles)
            f.path == changed ? file(f.path, 'edited') : f,
        ];
        expect((await keyOf(files)).key, isNot(base.key), reason: changed);
      }
    });

    test('ignores fllama, the rest of llama.cpp and other backends', () async {
      final base = await keyOf(baseFiles);
      final noisy = await keyOf([
        ...baseFiles,
        file('src/fllama.cpp', 'fllama'),
        file('src/CMakeLists.txt', 'fllama cmake'),
        file('hook/build.dart', 'hook'),
        file('src/llama.cpp/src/llama.cpp', 'llama'),
        file('src/llama.cpp/CMakeLists.txt', 'llama cmake'),
        file('src/llama.cpp/tools/server/server.cpp', 'server'),
        file('src/llama.cpp/ggml/src/ggml-vulkan/ggml-vulkan.cpp', 'vk'),
        file('src/llama.cpp/ggml/src/ggml-cpu/ggml-cpu.c', 'cpu'),
        file('src/llama.cpp/ggml/include/ggml-vulkan.h', 'vk api'),
        file('src/llama.cpp/ggml/src/ggml-backend-reg.cpp', 'loader'),
      ]);
      expect(noisy.key, base.key);
    });

    test('differs per target and names the release by target', () async {
      final linux = await keyOf(baseFiles);
      final windows = await keyOf(baseFiles, target: 'windows-x64');
      expect(linux.key, isNot(windows.key));
      expect(linux.tag, 'cuda-linux-x64-${linux.short}');
      expect(windows.tag, startsWith('cuda-windows-x64-'));
    });

    test('covers every header that ggml-base and ggml-cuda include', () {
      // Follows #include "..." from every key file of the real tree. A
      // header outside the key would change the ABI without a new pack.
      final ggml = Directory('src/llama.cpp/ggml');
      final searchDirs = [
        p.join(ggml.path, 'include'),
        p.join(ggml.path, 'src'),
        p.join(ggml.path, 'src', 'ggml-cuda'),
      ];
      final keyed = <String>{
        for (final entity in ggml.listSync(recursive: true))
          if (entity is File)
            if (p.posix.joinAll(p.split(entity.path)) case final path
                when hook.isCudaPackKeyFile(path))
              path,
      };
      final include = RegExp(r'^\s*#\s*include\s+"([^"]+)"', multiLine: true);
      final missing = <String>{};
      for (final path in keyed.where(
        (p) => RegExp(r'\.(c|cpp|h|cu|cuh)$').hasMatch(p),
      )) {
        for (final match in include.allMatches(File(path).readAsStringSync())) {
          final name = match.group(1)!;
          final candidates = [
            p.normalize(p.join(p.dirname(path), name)),
            for (final dir in searchDirs) p.normalize(p.join(dir, name)),
          ];
          final found = candidates.where((c) => File(c).existsSync());
          if (found.isEmpty) continue; // System, toolkit or vendor header.
          final resolved = p.posix.joinAll(p.split(found.first));
          // Only for GGML_USE_MUSA, which the pack does not build.
          if (resolved.contains('/ggml-musa/')) continue;
          if (!keyed.contains(resolved)) missing.add('$path -> $resolved');
        }
      }
      expect(keyed.where((p) => p.contains('/ggml-cuda/')), isNotEmpty);
      expect(missing, isEmpty);
    });

    test('the real key does not depend on fllama sources', () async {
      final source = await computeSourceKey(root);
      final key = await keyOf(source.files);
      expect(key.listing, isNot(contains('src/fllama')));
      expect(key.listing, contains('scripts/install_cuda_toolkit.dart'));
      expect(key.listing, contains('src/cuda_pack/CMakeLists.txt'));
    });
  });

  group('CUDA pack build settings', () {
    test('ggml-base ABI options equal the fllama release build', () {
      // Options that change ggml-base's public definitions or its file
      // name (src/llama.cpp/ggml/src/CMakeLists.txt).
      const abi = [
        'BUILD_SHARED_LIBS',
        'CMAKE_BUILD_TYPE',
        'CMAKE_PLATFORM_NO_VERSIONED_SONAME',
        'GGML_BACKEND_DL',
        'GGML_OPENMP',
        'GGML_SCHED_NO_REALLOC',
      ];
      for (final os in [OS.windows, OS.linux]) {
        final pack = hook.cudaPackDefines(os);
        final fllama = hook.computeDefines(os, Architecture.x64, '');
        for (final name in abi) {
          expect(pack[name], fllama[name], reason: '${os.name} $name');
        }
        expect(pack['GGML_CUDA'], 'ON');
        expect(pack['GGML_CUDA_NCCL'], 'OFF');
        expect(pack['CMAKE_CUDA_ARCHITECTURES'], hook.cudaArchitectures);
      }
    });

    test('mirrors what llama.cpp sets before add_subdirectory(ggml)', () {
      // src/cuda_pack/CMakeLists.txt repeats these lines. When llama.cpp
      // changes them, review the pack project, then update this list.
      final text = File('src/llama.cpp/CMakeLists.txt').readAsStringSync();
      final before = text.substring(0, text.indexOf('add_subdirectory(ggml)'));
      final settings = RegExp(
        r'^\s*(set\((?:GGML_\w+|CMAKE_\w+_OUTPUT_DIRECTORY)\b[^)]*\)|'
        r'add_compile_(?:definitions|options)\([^\n]*\))',
        multiLine: true,
      ).allMatches(before).map((m) => m.group(1)!.trim()).toList();
      expect(settings, [
        r'set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)',
        r'set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)',
        'add_compile_options("-sMEMORY64=1")', // Emscripten only.
        'add_compile_definitions(_CRT_SECURE_NO_WARNINGS)',
        r'add_compile_options("$<$<COMPILE_LANGUAGE:C>:/utf-8>")',
        r'add_compile_options("$<$<COMPILE_LANGUAGE:CXX>:/utf-8>")',
        r'add_compile_options("$<$<COMPILE_LANGUAGE:C>:/bigobj>")',
        r'add_compile_options("$<$<COMPILE_LANGUAGE:CXX>:/bigobj>")',
        r'set(GGML_ALL_WARNINGS   ${LLAMA_ALL_WARNINGS})',
        r'set(GGML_FATAL_WARNINGS ${LLAMA_FATAL_WARNINGS})',
        'set(GGML_LLAMAFILE_DEFAULT ON)',
        'set(GGML_CUDA_GRAPHS_DEFAULT ON)',
        r'set(GGML_BUILD_NUMBER ${LLAMA_BUILD_NUMBER})',
        r'set(GGML_BUILD_COMMIT ${LLAMA_BUILD_COMMIT})',
      ]);
      final pack = File('src/cuda_pack/CMakeLists.txt').readAsStringSync();
      for (final line in [
        'set(GGML_CUDA_GRAPHS_DEFAULT ON)',
        'set(GGML_LLAMAFILE_DEFAULT ON)',
        'add_compile_definitions(_CRT_SECURE_NO_WARNINGS)',
        r'set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)',
      ]) {
        expect(pack, contains(line));
      }
    });
  });

  group('CUDA pack descriptor', () {
    test('accepts the pack of these sources', () async {
      final key = await keyOf(baseFiles);
      final descriptor = descriptorFor(key);
      descriptor.check(key, repository: repo);
      final roundTrip = hook.CudaPackDescriptor.fromJson(
        jsonDecode(jsonEncode(descriptor.toJson())) as Map<String, Object?>,
      );
      roundTrip.check(key, repository: repo);
      expect(
        roundTrip.cmakeFiles,
        '${descriptor.files[0].name}|${descriptor.files[0].sha256}|'
        '${descriptor.files[0].url};${descriptor.files[1].name}|'
        '${descriptor.files[1].sha256}|${descriptor.files[1].url}',
      );
    });

    test('rejects a pack of other sources, naming the right release', () async {
      final key = await keyOf(baseFiles);
      final other = await keyOf([...baseFiles, file('src/cuda_pack/x', 'y')]);
      expect(
        () => descriptorFor(other).check(key, repository: repo),
        throwsA(
          isA<StateError>().having(
            (e) => e.message,
            'message',
            contains(key.tag),
          ),
        ),
      );
    });

    test('rejects another target, URLs and incomplete packs', () async {
      final key = await keyOf(baseFiles);
      final good = descriptorFor(key);
      final windows = await keyOf(baseFiles, target: 'windows-x64');
      expect(() => good.check(windows, repository: repo), throwsStateError);
      final badUrl = hook.CudaPackDescriptor(
        target: key.target,
        key: key.key,
        files: [
          good.files[0],
          hook.CudaPackFile(
            name: good.files[1].name,
            sha256: good.files[1].sha256,
            url: 'https://example.com/libggml-cuda.so.gz',
          ),
        ],
      );
      expect(() => badUrl.check(key, repository: repo), throwsStateError);
      final noRuntime = hook.CudaPackDescriptor(
        target: key.target,
        key: key.key,
        files: [good.files[1]],
      );
      expect(() => noRuntime.check(key, repository: repo), throwsStateError);
      expect(
        () =>
            hook.CudaPackDescriptor.fromJson({...good.toJson(), 'schema': 99}),
        throwsFormatException,
      );
    });

    test(
      'a release build without the pack fails with its release tag',
      () async {
        final key = await keyOf(baseFiles);
        expect(
          () => hook.resolveCudaPack(
            packageRoot: root,
            target: 'linux-x64',
            sourceFiles: baseFiles,
            repository: repo,
            descriptorPath: null,
          ),
          throwsA(
            isA<StateError>().having(
              (e) => e.message,
              'message',
              contains(key.tag),
            ),
          ),
        );
      },
    );

    test('resolveCudaPack reads a matching descriptor', () async {
      final key = await keyOf(baseFiles);
      final dir = await Directory.systemTemp.createTemp('cuda_pack_test');
      addTearDown(() => dir.delete(recursive: true));
      final json = File(p.join(dir.path, 'cuda-pack.json'))
        ..writeAsStringSync(jsonEncode(descriptorFor(key).toJson()));
      final pack = await hook.resolveCudaPack(
        packageRoot: root,
        target: 'linux-x64',
        sourceFiles: baseFiles,
        repository: repo,
        descriptorPath: json.path,
      );
      expect(pack.files.map((f) => f.name), contains('libggml-cuda.so'));
    });
  });

  group('release build defines', () {
    test('embed the pack files and never build CUDA', () async {
      final key = await keyOf(baseFiles);
      final pack = descriptorFor(key);
      final defines = hook.computeDefines(
        OS.linux,
        Architecture.x64,
        '',
        vulkan: const hook.VulkanSdk(headerVersion: 1),
        cudaPack: pack,
        gpuPackUrlTemplate: 'https://example.com/@FILE@.gz',
      );
      expect(defines['FLLAMA_CUDA_PACK_FILES'], pack.cmakeFiles);
      expect(defines, isNot(contains('GGML_CUDA')));
      expect(defines, isNot(contains('CMAKE_CUDA_ARCHITECTURES')));
    });

    test('a CUDA pack needs an x64 release build', () async {
      final pack = descriptorFor(await keyOf(baseFiles));
      expect(
        () =>
            hook.computeDefines(OS.linux, Architecture.x64, '', cudaPack: pack),
        throwsArgumentError,
      );
      expect(
        () => hook.computeDefines(
          OS.windows,
          Architecture.arm64,
          '',
          cudaPack: pack,
          gpuPackUrlTemplate: 'https://example.com/@FILE@.gz',
        ),
        throwsArgumentError,
      );
    });
  });

  group('gpu_packs.cmake', () {
    late Directory dir;
    setUp(() async {
      dir = await Directory.systemTemp.createTemp('gpu_packs_test');
    });
    tearDown(() => dir.delete(recursive: true));

    Future<ProcessResult> run(List<String> files) => Process.run('cmake', [
      '-DOUT_CPP=${p.join(dir.path, 'packs.cpp')}',
      '-DOUT_JSON=${p.join(dir.path, 'packs.json')}',
      ...files,
      '-P',
      'src/cmake/gpu_packs.cmake',
    ]);

    test('lists built and external files', () async {
      final built = File(p.join(dir.path, 'libggml-vulkan.so'))
        ..writeAsStringSync('vulkan');
      final sha = digest('cuda');
      final result = await run([
        '-DFILE_COUNT=2',
        '-DFILE_0_PACK=vulkan',
        '-DFILE_0_PATH=${built.path}',
        '-DFILE_0_URL=https://example.com/linux-x64-@FILE@.gz',
        '-DFILE_1_PACK=cuda',
        '-DFILE_1_NAME=libcudart.so.12',
        '-DFILE_1_SHA256=$sha',
        '-DFILE_1_URL=https://example.com/cuda/linux-x64-libcudart.so.12.gz',
      ]);
      expect(result.exitCode, 0, reason: '${result.stdout}${result.stderr}');
      final packs = hook.parseGpuPackFiles(
        File(p.join(dir.path, 'packs.json')).readAsStringSync(),
      );
      expect(packs.map((f) => (f.name, f.external)), [
        ('libggml-vulkan.so', false),
        ('libcudart.so.12', true),
      ]);
      expect(packs[0].sha256, digest('vulkan'));
      expect(
        packs[0].url,
        'https://example.com/linux-x64-libggml-vulkan.so.gz',
      );
      expect(packs[1].sha256, sha);
      expect(
        File(p.join(dir.path, 'packs.cpp')).readAsStringSync(),
        contains('{"cuda", "libcudart.so.12", "$sha",'),
      );
    });

    test('rejects an external file without a valid SHA-256', () async {
      final result = await run([
        '-DFILE_COUNT=1',
        '-DFILE_0_PACK=cuda',
        '-DFILE_0_NAME=libcudart.so.12',
        '-DFILE_0_SHA256=abc',
        '-DFILE_0_URL=https://example.com/x.gz',
      ]);
      expect(result.exitCode, isNot(0));
      expect('${result.stderr}', contains('no valid SHA-256'));
    });
  });
}
