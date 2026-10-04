import 'dart:convert';
import 'dart:ffi' as ffi;
import 'dart:isolate';

import 'package:ffi/ffi.dart' as pkg_ffi;
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fllama_universal.dart';
import 'package:fllama/io/fllama_bindings_generated.dart';
import 'package:fllama/io/fllama_io_helpers.dart';

/// Allows or forbids GPU backends for this process.
///
/// Call it before any other fllama call. With `false`, fllama never loads a
/// GPU backend library, so a faulty GPU driver cannot affect the app.
/// Returns false if fllama already loaded its backends with the other
/// setting; the change then applies after the app restarts.
bool fllamaSetGpuAllowed(bool allowed) =>
    fllamaBindings.fllama_set_gpu_allowed(allowed ? 1 : 0) == 0;

/// File names of the ggml backend libraries that fllama loaded, in load
/// order. For example `[ggml-vulkan.dll, ggml-cpu-haswell.dll]`. Empty on
/// platforms that link the backends into fllama (Apple, Android).
///
/// The first call may be slow because it loads the backends.
Future<List<String>> fllamaLoadedBackendFiles() async {
  return Isolate.run(() {
    final loaded = fllamaBindings.fllama_get_loaded_backends();
    final text = loaded.cast<pkg_ffi.Utf8>().toDartString();
    return text.isEmpty ? const <String>[] : text.split(',');
  });
}

/// GPU pack files that this fllama build expects (ADR 004, D13). Empty if
/// the build has none, for example on Apple and Android, or when the build
/// machine had no Vulkan SDK.
List<FllamaGpuPackFile> fllamaGpuPackFiles() {
  final json = fllamaBindings
      .fllama_get_gpu_pack_files()
      .cast<pkg_ffi.Utf8>()
      .toDartString();
  final platform = _gpuPackPlatform();
  return [
    for (final entry in jsonDecode(json) as List<Object?>)
      if (entry case {
        'pack': final String pack,
        'name': final String name,
        'sha256': final String sha256,
      })
        FllamaGpuPackFile(
          pack: pack,
          name: name,
          sha256: sha256,
          relativePath: '$platform/$sha256/$name.gz',
        ),
  ];
}

/// `<os>-<arch>` of GPU pack paths. hook/build.dart writes the same names.
String _gpuPackPlatform() => switch (ffi.Abi.current()) {
  ffi.Abi.windowsX64 => 'windows-x64',
  ffi.Abi.windowsArm64 => 'windows-arm64',
  ffi.Abi.linuxX64 => 'linux-x64',
  ffi.Abi.linuxArm64 => 'linux-arm64',
  final abi => abi.toString().replaceAll('_', '-'),
};

/// Loads the GPU pack [pack] from [directory], which contains every file of
/// the pack, not gzipped. fllama checks the SHA-256 of each file first.
///
/// Returns null on success, or an error message. It fails if the GPU is not
/// allowed or a local model request runs. Idle cached models are unloaded,
/// so the next request uses the new backend. Loading a loaded pack again
/// succeeds and does nothing.
Future<String?> fllamaLoadGpuPack(String pack, String directory) {
  return Isolate.run(() {
    final packPointer = pack.toNativeUtf8();
    final directoryPointer = directory.toNativeUtf8();
    try {
      final error = fllamaBindings.fllama_load_gpu_pack(
        packPointer.cast(),
        directoryPointer.cast(),
      );
      return error == ffi.nullptr
          ? null
          : error.cast<pkg_ffi.Utf8>().toDartString();
    } finally {
      pkg_ffi.calloc.free(packPointer);
      pkg_ffi.calloc.free(directoryPointer);
    }
  });
}

/// Whether this PC has a GPU that the Vulkan pack can use. It does not need
/// the pack, so the app can decide whether to download it. False if the GPU
/// is not allowed or this build has no Vulkan pack.
///
/// The first call asks the GPU driver, which can take about a second.
Future<bool> fllamaHasVulkanGpu() =>
    Isolate.run(() => fllamaBindings.fllama_has_vulkan_gpu() != 0);

/// Returns the GPU memory information reported by ggml/llama.cpp, for
/// discrete and integrated GPUs.
///
/// On Metal, these numbers correspond to the backend's working-set budget and
/// currently available budget for this process, not literal PC-style VRAM.
///
/// The first call may be slow (several seconds) because it triggers
/// ggml/llama.cpp backend initialization.  This method runs the native
/// call on a separate [Isolate] so it never blocks the UI thread.
Future<List<FllamaGpuMemoryInfo>> fllamaGpuMemoryInfoGetAll() async {
  return Isolate.run(_queryGpuDevicesSync);
}

List<FllamaGpuMemoryInfo> _queryGpuDevicesSync() {
  final count = fllamaBindings.fllama_get_gpu_device_count();
  if (count <= 0) {
    return const [];
  }

  final results = <FllamaGpuMemoryInfo>[];
  for (var i = 0; i < count; i++) {
    final ptr = pkg_ffi.calloc<fllama_gpu_memory_info>();
    try {
      final status = fllamaBindings.fllama_get_gpu_memory_info(i, ptr);
      if (status != 0) {
        continue;
      }
      final info = ptr.ref;
      results.add(
        FllamaGpuMemoryInfo(
          deviceIndex: info.device_index,
          totalBytes: info.total_bytes,
          freeBytes: info.free_bytes,
          name: charArrayToString(info.name, 128),
          description: charArrayToString(info.description, 256),
          deviceId: charArrayToString(info.device_id, 128),
          backend: charArrayToString(info.backend, 64),
          isIntegrated: charArrayToString(info.device_type, 16) == 'IGPU',
          deviceKey: charArrayToString(info.device_key, 512),
        ),
      );
    } finally {
      pkg_ffi.calloc.free(ptr);
    }
  }
  return results;
}
