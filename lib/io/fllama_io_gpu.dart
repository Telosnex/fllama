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
