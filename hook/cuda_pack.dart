// The CUDA GPU pack: its key, its CMake recipe and its descriptor
// (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D8 and D16).
//
// The CUDA pack is built by .github/workflows/cuda_pack.yml, not by the
// fllama release build. It is published once per CUDA pack key, in the
// GitHub release `cuda-<target>-<key16>`. The fllama release build only
// embeds the SHA-256 and URL of each pack file (ADR 004 D13); it never
// compiles CUDA. A release for a CUDA target fails if the pack for its key
// is not published.
//
// The key covers everything that can change the pack files or their ABI
// against the `ggml-base` library that the fllama release ships (ADR 004
// I5): the ggml core and CUDA sources, the pack's CMake project, the CMake
// defines, the CUDA version and the pinned CUDA archives. It does not cover
// fllama's own sources or the rest of llama.cpp, so those changes never
// rebuild CUDA.
import 'dart:convert';
import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:crypto/crypto.dart';
import 'package:native_prebuilt/native_prebuilt.dart';
import 'package:path/path.dart' as p;

/// Bump when the meaning of the key or the descriptor changes.
const cudaPackSchema = 1;

/// Pinned CUDA Toolkit for the CUDA GPU pack (ADR 004 D8).
/// scripts/install_cuda_toolkit.dart installs it from NVIDIA's archives.
const cudaToolkitVersion = '12.8';

/// GPU architectures of the CUDA pack. `-real` is machine code, so these
/// GPUs need no JIT compilation and run with any CUDA 12 driver:
/// GTX 10 (61), GTX 16 and RTX 20 (75), A100 (80), RTX 30 (86), RTX 40
/// (89) and RTX 50 (120a). `90-virtual` is PTX for other and future GPUs.
const cudaArchitectures =
    '61-real;75-real;80-real;86-real;89-real;'
    '90-virtual;120a-real';

/// Name of the descriptor asset in each CUDA pack release.
const cudaPackDescriptorName = 'cuda-pack.json';

/// User define of the fllama hook: path of the descriptor of the CUDA pack
/// to embed. The release workflow resolves it (scripts/cuda_pack.dart).
const cudaPackUserDefine = 'cuda_pack';

/// Whether a release for [targetOS] and [targetArch] has a CUDA pack.
bool cudaTargets(OS targetOS, Architecture targetArch) =>
    targetArch == Architecture.x64 &&
    (targetOS == OS.windows || targetOS == OS.linux);

/// Target name of a CUDA pack target, as native_prebuilt names it.
String cudaPackTarget(OS targetOS) => switch (targetOS) {
  OS.windows => 'windows-x64',
  OS.linux => 'linux-x64',
  _ => throw ArgumentError.value(targetOS, 'targetOS', 'No CUDA pack'),
};

/// OS of a CUDA pack target name.
OS cudaPackOS(String target) => switch (target) {
  'windows-x64' => OS.windows,
  'linux-x64' => OS.linux,
  _ => throw ArgumentError.value(target, 'target', 'No CUDA pack'),
};

/// CMake defines of the CUDA pack build (src/cuda_pack/CMakeLists.txt),
/// without host paths.
///
/// The ggml options that change the ABI of `ggml-base` (GGML_BACKEND_DL,
/// GGML_SCHED_NO_REALLOC, GGML_OPENMP) must equal the defines of the fllama
/// release build. test/cuda_pack_test.dart checks this.
Map<String, String> cudaPackDefines(OS targetOS) => {
  'CMAKE_BUILD_TYPE': 'Release',
  'BUILD_SHARED_LIBS': 'ON',
  'GGML_BACKEND_DL': 'ON',
  'GGML_NATIVE': 'OFF',
  // The pack contains only ggml-cuda. ggml-base and ggml are built only to
  // link it; the fllama release ships its own copies.
  'GGML_CPU': 'OFF',
  'GGML_CUDA': 'ON',
  'CMAKE_CUDA_ARCHITECTURES': cudaArchitectures,
  // One library for all GPUs. NCCL is only for several GPUs.
  'GGML_CUDA_NCCL': 'OFF',
  if (targetOS == OS.windows) 'GGML_OPENMP': 'OFF',
  if (targetOS == OS.linux) ...{
    'CMAKE_POSITION_INDEPENDENT_CODE': 'ON',
    // ggml-cuda then needs libggml-base.so, the file fllama ships.
    'CMAKE_PLATFORM_NO_VERSIONED_SONAME': 'ON',
  },
};

/// CMake generator arguments of the CUDA pack build, without host paths.
/// Windows adds `-T cuda=<toolkit>`.
List<String> cudaPackGeneratorArgs(OS targetOS) => switch (targetOS) {
  OS.windows => const ['-G', 'Visual Studio 17 2022', '-A', 'x64'],
  _ => const ['-G', 'Unix Makefiles'],
};

/// Headers in ggml/include that ggml-base or ggml-cuda include. The other
/// headers belong to other backends.
const _cudaPackHeaders = {
  'ggml.h',
  'ggml-alloc.h',
  'ggml-backend.h',
  'ggml-cpp.h',
  'ggml-cpu.h',
  'ggml-cuda.h',
  'ggml-opt.h',
  'gguf.h',
};

/// Files in ggml/src that belong to the `ggml` loader library, not to
/// ggml-base. ggml-cuda does not link it; GGML_BACKEND_API_VERSION in
/// ggml-backend-impl.h is the contract between them.
const _cudaPackLoaderSources = {
  'ggml-backend-dl.cpp',
  'ggml-backend-dl.h',
  'ggml-backend-reg.cpp',
};

/// Files in other ggml/src directories that ggml-base includes:
/// ggml-quants.c includes ggml-cpu/ggml-cpu-impl.h.
const _cudaPackExtraSources = {'src/ggml-cpu/ggml-cpu-impl.h'};

/// Package files whose contents are in the CUDA pack key.
///
/// The ggml-base sources and headers define the ABI between ggml-cuda and
/// ggml-base. Backend directories other than ggml-cuda are not built.
bool isCudaPackKeyFile(String path) {
  const ggml = 'src/llama.cpp/ggml/';
  if (path.startsWith('src/cuda_pack/')) return true;
  if (path == 'scripts/install_cuda_toolkit.dart') return true;
  if (!path.startsWith(ggml)) return false;
  final rest = path.substring(ggml.length);
  if (_cudaPackExtraSources.contains(rest)) return true;
  if (rest.startsWith('include/')) {
    return _cudaPackHeaders.contains(rest.substring('include/'.length));
  }
  if (rest.startsWith('src/') && !rest.substring(4).contains('/')) {
    // Files directly in ggml/src: ggml-base and src/CMakeLists.txt.
    return !_cudaPackLoaderSources.contains(rest.substring(4));
  }
  return rest == 'CMakeLists.txt' ||
      rest.startsWith('cmake/') ||
      rest.startsWith('src/ggml-cuda/');
}

/// The CUDA pack key of one target, and the lines that it hashes.
final class CudaPackKey {
  CudaPackKey(this.target, this.listing)
    : key = sha256.convert(utf8.encode(listing)).toString();

  final String target;

  /// One input per line: header lines, then `<path>\t<sha256>` per file.
  final String listing;

  /// SHA-256 of [listing].
  final String key;

  String get short => key.substring(0, 16);

  /// GitHub release of this pack.
  String get tag => 'cuda-$target-$short';
}

/// Computes the CUDA pack key of [target] for the package at [packageRoot].
///
/// [files] are the package files of the native_prebuilt source key, with
/// their SHA-256 values. scripts/ is not in the source key, so
/// scripts/install_cuda_toolkit.dart is read here.
Future<CudaPackKey> computeCudaPackKey({
  required Uri packageRoot,
  required String target,
  required List<SourceFile> files,
}) async {
  final os = cudaPackOS(target);
  final digests = <String, String>{
    for (final file in files)
      if (isCudaPackKeyFile(file.path)) file.path: file.sha256,
  };
  const installer = 'scripts/install_cuda_toolkit.dart';
  final installerFile = File.fromUri(packageRoot.resolve(installer));
  if (!await installerFile.exists()) {
    throw StateError('The CUDA pack key needs $installer.');
  }
  digests[installer] = sha256
      .convert(await installerFile.readAsBytes())
      .toString();
  if (!digests.keys.any((path) => path.contains('/ggml-cuda/'))) {
    throw StateError('The CUDA pack key found no ggml-cuda sources.');
  }

  final buffer = StringBuffer()
    ..writeln('fllama-cuda-pack-v$cudaPackSchema')
    ..writeln('target=$target')
    ..writeln('cuda=$cudaToolkitVersion')
    ..writeln('generator=${cudaPackGeneratorArgs(os).join(' ')}');
  final defines = cudaPackDefines(os).entries.toList()
    ..sort((a, b) => a.key.compareTo(b.key));
  for (final entry in defines) {
    buffer.writeln('D:${entry.key}=${entry.value}');
  }
  final paths = digests.keys.toList()..sort();
  for (final path in paths) {
    buffer.writeln('$path\t${digests[path]}');
  }
  return CudaPackKey(target, buffer.toString());
}

/// One file of a CUDA pack.
final class CudaPackFile {
  const CudaPackFile({
    required this.name,
    required this.sha256,
    required this.url,
    this.bytes,
    this.downloadSha256,
  });

  factory CudaPackFile.fromJson(Map<String, Object?> json) => CudaPackFile(
    name: json['name']! as String,
    sha256: json['sha256']! as String,
    url: json['url']! as String,
    bytes: json['bytes'] as int?,
    downloadSha256: json['downloadSha256'] as String?,
  );

  final String name;

  /// SHA-256 of the file after gunzip. fllama checks it before it loads the
  /// file (ADR 004 D13).
  final String sha256;

  /// The gzipped file in the CUDA pack release.
  final String url;
  final int? bytes;

  /// SHA-256 of the gzipped asset.
  final String? downloadSha256;

  Map<String, Object?> toJson() => {
    'name': name,
    'sha256': sha256,
    'bytes': ?bytes,
    'url': url,
    'downloadSha256': ?downloadSha256,
  };
}

/// Asset name of CUDA pack file [name] for [target].
String cudaPackAssetName(String target, String name) =>
    nativeAssetName(target, name);

/// The descriptor of a published CUDA pack ([cudaPackDescriptorName]).
final class CudaPackDescriptor {
  const CudaPackDescriptor({
    required this.target,
    required this.key,
    required this.files,
    this.toolchain = '',
    this.commit = '',
  });

  factory CudaPackDescriptor.fromJson(Map<String, Object?> json) {
    if (json['schema'] != cudaPackSchema) {
      throw FormatException(
        'CUDA pack descriptor schema ${json['schema']}, expected '
        '$cudaPackSchema.',
      );
    }
    return CudaPackDescriptor(
      target: json['target']! as String,
      key: json['key']! as String,
      toolchain: json['toolchain'] as String? ?? '',
      commit: json['commit'] as String? ?? '',
      files: [
        for (final file in json['files']! as List<Object?>)
          CudaPackFile.fromJson((file! as Map).cast<String, Object?>()),
      ],
    );
  }

  static Future<CudaPackDescriptor> load(File file) async =>
      CudaPackDescriptor.fromJson(
        (jsonDecode(await file.readAsString()) as Map).cast<String, Object?>(),
      );

  final String target;

  /// Full CUDA pack key ([CudaPackKey.key]).
  final String key;
  final List<CudaPackFile> files;

  /// Informational: the compiler and CUDA version of the build.
  final String toolchain;

  /// Informational: the commit that the pack was built from.
  final String commit;

  Map<String, Object?> toJson() => {
    'schema': cudaPackSchema,
    'target': target,
    'key': key,
    'tag': 'cuda-$target-${key.substring(0, 16)}',
    'cudaVersion': cudaToolkitVersion,
    'architectures': cudaArchitectures,
    'toolchain': toolchain,
    'commit': commit,
    'files': [for (final file in files) file.toJson()],
  };

  /// Throws a [StateError] unless this descriptor is the pack of [expected]
  /// in [repository]: same target and key, plain file names, SHA-256
  /// values, and URLs of the release assets. Exactly one file is the
  /// ggml-cuda backend; the others are its CUDA runtime dependencies.
  void check(CudaPackKey expected, {required String repository}) {
    if (target != expected.target) {
      throw StateError(
        'The CUDA pack descriptor is for $target, not ${expected.target}.',
      );
    }
    if (key != expected.key) {
      throw StateError(
        'The CUDA pack descriptor has key $key, but these sources have CUDA '
        'pack key ${expected.key}. Use the pack in release ${expected.tag}.',
      );
    }
    final names = <String>{};
    var backends = 0;
    for (final file in files) {
      final name = file.name;
      if (name.isEmpty ||
          name.contains('/') ||
          name.contains(r'\') ||
          !names.add(name)) {
        throw StateError('Invalid or repeated CUDA pack file name "$name".');
      }
      if (!RegExp(r'^[0-9a-f]{64}$').hasMatch(file.sha256)) {
        throw StateError('$name: sha256 is not a lowercase SHA-256.');
      }
      final url = githubAssetUrl(
        repository,
        expected.tag,
        cudaPackAssetName(target, name),
      );
      if (file.url != url) {
        throw StateError('$name: URL ${file.url}, expected $url.');
      }
      if (name.contains('ggml-cuda')) backends++;
    }
    if (backends != 1 || files.length < 2) {
      throw StateError(
        'The CUDA pack must have one ggml-cuda library and its CUDA runtime '
        'libraries. It has ${files.map((f) => f.name).join(', ')}.',
      );
    }
  }

  /// The value of the CMake define FLLAMA_CUDA_PACK_FILES: one
  /// `<name>|<sha256>|<url>` entry per file, separated by `;`.
  String get cmakeFiles => [
    for (final file in files) '${file.name}|${file.sha256}|${file.url}',
  ].join(';');
}

/// The published CUDA pack that a release build for [target] embeds.
///
/// [descriptorPath] is the user define [cudaPackUserDefine]: the
/// [cudaPackDescriptorName] of release `cuda-<target>-<key16>`, which
/// `dart scripts/cuda_pack.dart resolve` downloads. Throws if it is missing
/// or if it is not the pack of these sources, so a release never ships
/// without its CUDA pack or with a pack of other ggml sources.
Future<CudaPackDescriptor> resolveCudaPack({
  required Uri packageRoot,
  required String target,
  required List<SourceFile> sourceFiles,
  required String repository,
  required String? descriptorPath,
}) async {
  final key = await computeCudaPackKey(
    packageRoot: packageRoot,
    target: target,
    files: sourceFiles,
  );
  if (descriptorPath == null || descriptorPath.isEmpty) {
    throw StateError(
      'A release build for $target needs the CUDA pack with key '
      '${key.short}, release ${key.tag}. Run the "CUDA pack" workflow '
      '(.github/workflows/cuda_pack.yml) for this commit. Then pass the '
      'descriptor from `dart scripts/cuda_pack.dart resolve` as the user '
      'define $cudaPackUserDefine.',
    );
  }
  final descriptor = await CudaPackDescriptor.load(File(descriptorPath));
  descriptor.check(key, repository: repository);
  return descriptor;
}

/// Where scripts/install_cuda_toolkit.dart installs the CUDA Toolkit in the
/// CUDA pack workflow.
String cudaToolkitRoot(OS targetOS) => targetOS == OS.windows
    ? p.windows.join(
        r'C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA',
        'v$cudaToolkitVersion',
      )
    : '/usr/local/cuda-$cudaToolkitVersion';
