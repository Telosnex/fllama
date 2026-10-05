// fllama_gpu_packs.h — GPU pack files that this fllama build expects
// (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D13). The build generates the
// definitions with src/cmake/gpu_packs.cmake.
#ifndef FLLAMA_GPU_PACKS_H
#define FLLAMA_GPU_PACKS_H

#include <cstddef>

struct FllamaGpuPackFile {
  const char *pack;   // Pack name, for example "vulkan".
  const char *name;   // File name, for example "ggml-vulkan.dll".
  const char *sha256; // Lowercase hex SHA-256 of the file.
  const char *url;    // The gzipped file in the fllama GitHub release.
};

// kFllamaGpuPackFileCount entries. With no packs, the array has one
// placeholder entry and the count is 0.
extern const FllamaGpuPackFile kFllamaGpuPackFiles[];
extern const size_t kFllamaGpuPackFileCount;

#endif // FLLAMA_GPU_PACKS_H
