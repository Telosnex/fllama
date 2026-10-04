// fllama_backends.cpp — see fllama_backends.h.
#include "fllama_backends.h"
#include "fllama_gpu_packs.h"
#include "fllama_sha256.h"

#include "llama.cpp/common/log.h"
#include "llama.cpp/include/llama.h"

#include <atomic>
#include <cstdio>
#include <filesystem>
#include <map>
#include <mutex>
#include <string>
#include <system_error>

#if defined(FLLAMA_VULKAN_PROBE)
#define VK_NO_PROTOTYPES
#include <vulkan/vulkan.h>
#endif

#if defined(FLLAMA_BACKEND_DL)
#if defined(_WIN32)
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#else
#include <dlfcn.h>
#endif
#endif

namespace fs = std::filesystem;

namespace {

std::mutex g_init_mutex;
// Guards changes to the ggml backend registry after initialization (I9).
std::shared_mutex g_registry_mutex;
bool g_initialized = false;
std::string g_loaded_files;
std::atomic<bool> g_gpu_allowed{true};

void log_line(const std::string &msg) {
  fprintf(stderr, "[fllama] %s\n", msg.c_str());
  fflush(stderr);
}

bool is_noisy_per_token_llama_log(const char *text) {
  if (!text) {
    return false;
  }
  std::string s(text);
  while (!s.empty() && (s.back() == '\n' || s.back() == '\r')) {
    s.pop_back();
  }
  return s == "set_embeddings: value = 0" ||
         s == "set_adapters_lora: adapters = 0" ||
         s == "adapters_lora_are_same: adapters = 0";
}

void filtered_llama_log_callback(enum ggml_log_level level, const char *text,
                                 void *user_data) {
  if (is_noisy_per_token_llama_log(text)) {
    return;
  }
  common_log_default_callback(level, text, user_data);
}

#if defined(FLLAMA_BACKEND_DL)

#if defined(_WIN32)
const char *const kLibPrefix = "";
const char *const kLibSuffix = ".dll";
#else
const char *const kLibPrefix = "lib";
const char *const kLibSuffix = ".so";
#endif

// Directory that contains the fllama library. The ggml libraries are
// published next to it (hook/build.dart).
fs::path fllama_library_dir() {
#if defined(_WIN32)
  HMODULE module = nullptr;
  if (!GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                              GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
                          reinterpret_cast<LPCWSTR>(&fllama_library_dir),
                          &module)) {
    return {};
  }
  std::wstring buffer(MAX_PATH, L'\0');
  for (;;) {
    DWORD n = GetModuleFileNameW(module, buffer.data(),
                                 static_cast<DWORD>(buffer.size()));
    if (n == 0) {
      return {};
    }
    if (n < buffer.size()) {
      buffer.resize(n);
      break;
    }
    buffer.resize(buffer.size() * 2);
  }
  return fs::path(buffer).parent_path();
#else
  Dl_info info{};
  if (dladdr(reinterpret_cast<void *>(&fllama_library_dir), &info) == 0 ||
      info.dli_fname == nullptr) {
    return {};
  }
  return fs::absolute(fs::path(info.dli_fname)).parent_path();
#endif
}

// ggml_backend_load takes a narrow path. On Windows that is the ANSI code
// page, so a path that it cannot represent fails to load and is logged.
std::string narrow_path(const fs::path &path) {
  try {
    return path.string();
  } catch (const std::exception &) {
    return {};
  }
}

// Caller holds g_init_mutex or runs before g_initialized is set.
bool load_backend_file(const fs::path &path) {
  const std::string narrow = narrow_path(path);
  if (narrow.empty()) {
    log_line("Cannot load backend; path is not representable: " +
             path.filename().string());
    return false;
  }
  if (ggml_backend_load(narrow.c_str()) == nullptr) {
    return false;
  }
  if (!g_loaded_files.empty()) {
    g_loaded_files += ",";
  }
  g_loaded_files += path.filename().string();
  return true;
}

#if defined(_WIN32) && (defined(_M_ARM64) || defined(__aarch64__))
bool cpu_has_dotprod() {
#ifndef PF_ARM_V82_DP_INSTRUCTIONS_AVAILABLE
#define PF_ARM_V82_DP_INSTRUCTIONS_AVAILABLE 43
#endif
  return IsProcessorFeaturePresent(PF_ARM_V82_DP_INSTRUCTIONS_AVAILABLE) != 0;
}
#define FLLAMA_WINDOWS_ARM64 1
#endif

#if !defined(FLLAMA_WINDOWS_ARM64)
// Score of a CPU variant library, from its ggml_backend_score export. 0 means
// the CPU cannot run it. A library without the export scores 1.
int cpu_variant_score(const fs::path &path) {
#if defined(_WIN32)
  HMODULE handle = LoadLibraryW(path.wstring().c_str());
  if (!handle) {
    return 0;
  }
  auto score_fn = reinterpret_cast<int (*)()>(
      reinterpret_cast<void *>(GetProcAddress(handle, "ggml_backend_score")));
  int score = score_fn ? score_fn() : 1;
  FreeLibrary(handle);
  return score;
#else
  void *handle = dlopen(path.c_str(), RTLD_NOW | RTLD_LOCAL);
  if (!handle) {
    return 0;
  }
  auto score_fn =
      reinterpret_cast<int (*)()>(dlsym(handle, "ggml_backend_score"));
  int score = score_fn ? score_fn() : 1;
  dlclose(handle);
  return score;
#endif
}
#endif

void load_backends_from(const fs::path &dir) {
  if (dir.empty()) {
    log_line("Cannot find the fllama library directory; no backends loaded");
    return;
  }

  // GPU backends first, so llama.cpp lists their devices before the CPU.
  if (g_gpu_allowed.load()) {
    for (const char *name : {"ggml-vulkan", "ggml-opencl"}) {
      const fs::path path =
          dir / (std::string(kLibPrefix) + name + kLibSuffix);
      std::error_code ec;
      if (fs::exists(path, ec)) {
        if (!load_backend_file(path)) {
          log_line(std::string("GPU backend failed to load: ") + name);
        }
      }
    }
  } else {
    log_line("GPU backends disabled");
  }

  // CPU: exactly one variant, the best one this CPU can run.
  const std::string cpu_prefix = std::string(kLibPrefix) + "ggml-cpu";
  std::vector<std::string> cpu_files;
  std::error_code ec;
  for (const auto &entry : fs::directory_iterator(dir, ec)) {
    const std::string name = entry.path().filename().string();
    if (name.rfind(cpu_prefix, 0) == 0 &&
        entry.path().extension() == kLibSuffix) {
      cpu_files.push_back(name);
    }
  }

  std::string best;
#if defined(FLLAMA_WINDOWS_ARM64)
  best = fllama_backends_pick_windows_arm64_cpu(cpu_files, cpu_has_dotprod());
#else
  int best_score = 0;
  for (const auto &name : cpu_files) {
    const int score = cpu_variant_score(dir / name);
    if (score > best_score) {
      best_score = score;
      best = name;
    }
  }
#endif
  if (best.empty()) {
    log_line("No CPU backend can run on this CPU");
    return;
  }
  log_line("CPU backend: " + best);
  if (!load_backend_file(dir / best)) {
    log_line("CPU backend failed to load: " + best);
  }
}

#endif // FLLAMA_BACKEND_DL

std::vector<ggml_backend_dev_t> gpu_devices_unlocked() {
  std::vector<ggml_backend_dev_t> devices;
  for (size_t i = 0; i < ggml_backend_dev_count(); ++i) {
    auto *dev = ggml_backend_dev_get(i);
    if (dev == nullptr) {
      continue;
    }
    const auto type = ggml_backend_dev_type(dev);
    if (type == GGML_BACKEND_DEVICE_TYPE_GPU ||
        type == GGML_BACKEND_DEVICE_TYPE_IGPU) {
      devices.push_back(dev);
    }
  }
  return devices;
}

std::pair<std::string, std::string> backend_and_description(
    ggml_backend_dev_t dev) {
  const char *backend = ggml_backend_reg_name(ggml_backend_dev_backend_reg(dev));
  const char *description = ggml_backend_dev_description(dev);
  return {backend ? backend : "", description ? description : ""};
}

std::vector<std::string> gpu_device_keys_unlocked(
    const std::vector<ggml_backend_dev_t> &devices) {
  std::vector<std::pair<std::string, std::string>> pairs;
  pairs.reserve(devices.size());
  for (auto *dev : devices) {
    pairs.push_back(backend_and_description(dev));
  }
  return fllama_backends_device_keys(pairs);
}

#if defined(FLLAMA_BACKEND_DL)
bool loaded_file_names_contain(const std::string &name) {
  size_t start = 0;
  while (start <= g_loaded_files.size()) {
    const size_t end = g_loaded_files.find(',', start);
    const size_t stop = end == std::string::npos ? g_loaded_files.size() : end;
    if (g_loaded_files.compare(start, stop - start, name) == 0 &&
        stop - start == name.size()) {
      return true;
    }
    if (end == std::string::npos) {
      break;
    }
    start = end + 1;
  }
  return false;
}
#endif // FLLAMA_BACKEND_DL

#if defined(FLLAMA_VULKAN_PROBE)
bool probe_vulkan_gpu() {
#if defined(_WIN32)
  // vulkan-1.dll is the system loader. Search only System32, so a DLL in
  // the app or current directory cannot replace it.
  HMODULE lib =
      LoadLibraryExW(L"vulkan-1.dll", nullptr, LOAD_LIBRARY_SEARCH_SYSTEM32);
  if (!lib) {
    log_line("Vulkan probe: vulkan-1.dll not found");
    return false;
  }
  auto get_proc = reinterpret_cast<PFN_vkGetInstanceProcAddr>(
      reinterpret_cast<void *>(GetProcAddress(lib, "vkGetInstanceProcAddr")));
#else
  void *lib = dlopen("libvulkan.so.1", RTLD_NOW | RTLD_LOCAL);
  if (!lib) {
    log_line("Vulkan probe: libvulkan.so.1 not found");
    return false;
  }
  auto get_proc = reinterpret_cast<PFN_vkGetInstanceProcAddr>(
      dlsym(lib, "vkGetInstanceProcAddr"));
#endif
  int usable = 0;
  if (get_proc) {
    auto enumerate_version = reinterpret_cast<PFN_vkEnumerateInstanceVersion>(
        get_proc(nullptr, "vkEnumerateInstanceVersion"));
    auto create_instance = reinterpret_cast<PFN_vkCreateInstance>(
        get_proc(nullptr, "vkCreateInstance"));
    uint32_t api = VK_API_VERSION_1_0;
    if (enumerate_version) {
      enumerate_version(&api);
    }
    VkInstance instance = VK_NULL_HANDLE;
    if (create_instance && api >= VK_API_VERSION_1_2) {
      VkApplicationInfo app{};
      app.sType = VK_STRUCTURE_TYPE_APPLICATION_INFO;
      app.pApplicationName = "fllama";
      app.apiVersion = VK_API_VERSION_1_2;
      VkInstanceCreateInfo info{};
      info.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
      info.pApplicationInfo = &app;
      if (create_instance(&info, nullptr, &instance) != VK_SUCCESS) {
        instance = VK_NULL_HANDLE;
      }
    }
    if (instance != VK_NULL_HANDLE) {
      auto destroy_instance = reinterpret_cast<PFN_vkDestroyInstance>(
          get_proc(instance, "vkDestroyInstance"));
      auto enumerate_devices = reinterpret_cast<PFN_vkEnumeratePhysicalDevices>(
          get_proc(instance, "vkEnumeratePhysicalDevices"));
      auto get_properties = reinterpret_cast<PFN_vkGetPhysicalDeviceProperties>(
          get_proc(instance, "vkGetPhysicalDeviceProperties"));
      uint32_t count = 0;
      if (enumerate_devices && get_properties &&
          enumerate_devices(instance, &count, nullptr) == VK_SUCCESS &&
          count > 0) {
        std::vector<VkPhysicalDevice> devices(count);
        if (enumerate_devices(instance, &count, devices.data()) >= 0) {
          for (uint32_t i = 0; i < count; ++i) {
            VkPhysicalDeviceProperties props{};
            get_properties(devices[i], &props);
            const bool gpu = props.deviceType != VK_PHYSICAL_DEVICE_TYPE_CPU;
            if (gpu && props.apiVersion >= VK_API_VERSION_1_2) {
              ++usable;
            }
            log_line(std::string("Vulkan probe: ") + props.deviceName +
                     (gpu ? "" : " (CPU)") +
                     (props.apiVersion >= VK_API_VERSION_1_2
                          ? ""
                          : " (Vulkan < 1.2)"));
          }
        }
      }
      if (destroy_instance) {
        destroy_instance(instance, nullptr);
      }
    } else {
      log_line("Vulkan probe: no Vulkan 1.2 instance");
    }
  }
#if defined(_WIN32)
  FreeLibrary(lib);
#else
  dlclose(lib);
#endif
  return usable > 0;
}
#endif // FLLAMA_VULKAN_PROBE

} // namespace

void fllama_backends_init_once() {
  std::lock_guard<std::mutex> lock(g_init_mutex);
  if (g_initialized) {
    return;
  }
  g_initialized = true;
  llama_log_set(filtered_llama_log_callback, nullptr);
#if defined(FLLAMA_BACKEND_DL)
  load_backends_from(fllama_library_dir());
#endif
  llama_backend_init();
}

std::string fllama_backends_loaded_files() {
  fllama_backends_init_once();
  std::lock_guard<std::mutex> lock(g_init_mutex);
  return g_loaded_files;
}

bool fllama_backends_set_gpu_allowed(bool allowed) {
  std::lock_guard<std::mutex> lock(g_init_mutex);
  if (g_initialized) {
    return g_gpu_allowed.load() == allowed;
  }
  g_gpu_allowed.store(allowed);
  return true;
}

std::vector<ggml_backend_dev_t> fllama_backends_gpu_devices() {
  fllama_backends_init_once();
  auto lock = fllama_backends_registry_read_lock();
  return gpu_devices_unlocked();
}

std::vector<std::string> fllama_backends_device_keys(
    const std::vector<std::pair<std::string, std::string>> &devices) {
  std::map<std::pair<std::string, std::string>, int> seen;
  std::vector<std::string> keys;
  keys.reserve(devices.size());
  for (const auto &device : devices) {
    const int n = seen[device]++;
    keys.push_back(device.first + "|" + device.second + "|" +
                   std::to_string(n));
  }
  return keys;
}

std::string fllama_backends_device_key(ggml_backend_dev_t dev) {
  fllama_backends_init_once();
  auto lock = fllama_backends_registry_read_lock();
  const auto devices = gpu_devices_unlocked();
  const auto keys = gpu_device_keys_unlocked(devices);
  for (size_t i = 0; i < devices.size(); ++i) {
    if (devices[i] == dev) {
      return keys[i];
    }
  }
  return {};
}

ggml_backend_dev_t fllama_backends_find_device(const std::string &key) {
  if (key.empty()) {
    return nullptr;
  }
  fllama_backends_init_once();
  auto lock = fllama_backends_registry_read_lock();
  const auto devices = gpu_devices_unlocked();
  const auto keys = gpu_device_keys_unlocked(devices);
  for (size_t i = 0; i < keys.size(); ++i) {
    if (keys[i] == key) {
      return devices[i];
    }
  }
  return nullptr;
}

std::shared_lock<std::shared_mutex> fllama_backends_registry_read_lock() {
  return std::shared_lock<std::shared_mutex>(g_registry_mutex);
}

std::string fllama_backends_gpu_pack_files_json() {
  std::string json = "[";
  for (size_t i = 0; i < kFllamaGpuPackFileCount; ++i) {
    const auto &file = kFllamaGpuPackFiles[i];
    if (i > 0) {
      json += ",";
    }
    // Pack names, file names and hex digests need no JSON escaping.
    json += std::string("{\"pack\":\"") + file.pack + "\",\"name\":\"" +
            file.name + "\",\"sha256\":\"" + file.sha256 + "\"}";
  }
  return json + "]";
}

std::string fllama_backends_load_gpu_pack(
    const std::string &pack, const std::string &utf8_dir,
    const std::function<bool()> &evict_idle_models) {
  std::vector<const FllamaGpuPackFile *> files;
  for (size_t i = 0; i < kFllamaGpuPackFileCount; ++i) {
    if (pack == kFllamaGpuPackFiles[i].pack) {
      files.push_back(&kFllamaGpuPackFiles[i]);
    }
  }
  if (files.empty()) {
    return "This fllama build has no GPU pack named \"" + pack + "\"";
  }
#if !defined(FLLAMA_BACKEND_DL)
  (void)utf8_dir;
  (void)evict_idle_models;
  return "This platform does not load GPU packs";
#else
  fllama_backends_init_once();
  if (!g_gpu_allowed.load()) {
    return "GPU backends are disabled";
  }
  std::unique_lock<std::shared_mutex> registry(g_registry_mutex);
  {
    std::lock_guard<std::mutex> lock(g_init_mutex);
    bool all_loaded = true;
    for (const auto *file : files) {
      all_loaded = all_loaded && loaded_file_names_contain(file->name);
    }
    if (all_loaded) {
      return {};
    }
  }
  if (!evict_idle_models()) {
    return "A local model request is running. Load the GPU pack when no "
           "request runs.";
  }

  // Check every file before loading any of them (D13).
  std::string dir = utf8_dir;
  while (!dir.empty() && (dir.back() == '/' || dir.back() == '\\')) {
    dir.pop_back();
  }
  for (const auto *file : files) {
    const std::string path = dir + "/" + file->name;
    const std::string sha256 = fllama_sha256_file(path);
    if (sha256.empty()) {
      return std::string("GPU pack file is missing or unreadable: ") +
             file->name;
    }
    if (sha256 != file->sha256) {
      return std::string("GPU pack file has a different SHA-256: ") +
             file->name + " (expected " + file->sha256 + ", found " + sha256 +
             ")";
    }
  }

  std::lock_guard<std::mutex> lock(g_init_mutex);
  for (const auto *file : files) {
    if (loaded_file_names_contain(file->name)) {
      continue;
    }
    // Only ggml backend libraries are supported. A pack with dependency
    // DLLs (CUDA, D8) needs those loaded first; add that with step 13.
    if (std::string(file->name).find("ggml-") == std::string::npos) {
      return std::string("Cannot load GPU pack file that is not a ggml "
                         "backend: ") +
             file->name;
    }
    fs::path path;
    try {
      path = fs::u8path(dir) / file->name;
    } catch (const std::exception &) {
      return "GPU pack directory is not a valid path";
    }
    if (!load_backend_file(path)) {
      return std::string("GPU pack file failed to load: ") + file->name;
    }
    log_line(std::string("GPU pack loaded: ") + file->name);
  }
  return {};
#endif
}

bool fllama_backends_has_vulkan_gpu() {
#if defined(FLLAMA_VULKAN_PROBE)
  if (!g_gpu_allowed.load()) {
    return false;
  }
  static const bool has_gpu = probe_vulkan_gpu();
  return has_gpu;
#else
  return false;
#endif
}

std::string fllama_backends_pick_windows_arm64_cpu(
    const std::vector<std::string> &file_names, bool has_dotprod) {
  std::string baseline;
  std::string dotprod;
  for (const auto &name : file_names) {
    if (name == "ggml-cpu-armv8.0.dll") {
      baseline = name;
    } else if (name == "ggml-cpu-armv8.2-dotprod.dll") {
      dotprod = name;
    }
  }
  if (has_dotprod && !dotprod.empty()) {
    return dotprod;
  }
  return baseline;
}
