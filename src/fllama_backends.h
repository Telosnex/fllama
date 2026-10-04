// fllama_backends.h — ggml backend loading and GPU device selection.
//
// On Windows and Linux x64, ggml ships as separate libraries and fllama
// selects the backends at run time (docs/ADR_004_DESKTOP_GPU_BACKENDS.md,
// D4). On other targets the backends are linked into fllama, and loading is
// a no-op.
#ifndef FLLAMA_BACKENDS_H
#define FLLAMA_BACKENDS_H

#include <string>
#include <utility>
#include <vector>

#include "ggml-backend.h"

// Loads the ggml backends, initializes llama.cpp and installs the llama.cpp
// log filter. Runs once per process. Thread-safe. Call it before any
// llama.cpp model load.
void fllama_backends_init_once();

// Allows or forbids GPU backends. Returns false and changes nothing if the
// backends are already loaded (ADR 004, I7).
bool fllama_backends_set_gpu_allowed(bool allowed);

// Comma-separated file names of the backend libraries that fllama loaded,
// in load order. Empty when the backends are linked into fllama. Calls
// fllama_backends_init_once().
std::string fllama_backends_loaded_files();

// GPU and integrated-GPU devices, in ggml registry order. Calls
// fllama_backends_init_once().
std::vector<ggml_backend_dev_t> fllama_backends_gpu_devices();

// Device key for [dev]: "<backend>|<description>|<n>" (ADR 004, §5).
std::string fllama_backends_device_key(ggml_backend_dev_t dev);

// The GPU device with [key], or nullptr.
ggml_backend_dev_t fllama_backends_find_device(const std::string &key);

// Device keys for devices given as (backend name, description) pairs, in
// order. `n` counts earlier devices with the same backend and description.
std::vector<std::string> fllama_backends_device_keys(
    const std::vector<std::pair<std::string, std::string>> &devices);

// File name of the Windows ARM64 CPU variant to load, from the available
// file names. Returns "" if none can run. Exposed for tests.
std::string fllama_backends_pick_windows_arm64_cpu(
    const std::vector<std::string> &file_names, bool has_dotprod);

#endif // FLLAMA_BACKENDS_H
