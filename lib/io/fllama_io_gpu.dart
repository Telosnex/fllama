import 'dart:ffi' as ffi;
import 'dart:isolate';

import 'package:ffi/ffi.dart' as pkg_ffi;
import 'package:fllama/fllama_io.dart';
import 'package:fllama/fllama_universal.dart';
import 'package:fllama/io/fllama_bindings_generated.dart';
import 'package:fllama/io/fllama_io_helpers.dart';

/// Returns the GPU memory information reported by ggml/llama.cpp.
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
        ),
      );
    } finally {
      pkg_ffi.calloc.free(ptr);
    }
  }
  return results;
}
