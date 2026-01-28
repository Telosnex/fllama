# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version, as doing so will cause
# the plugin to fail to compile for some customers of the plugin.
cmake_minimum_required(VERSION 3.10)

project(fllama_library VERSION 0.0.1 LANGUAGES CXX)

# Include build info generation
include("${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp/cmake/build-info.cmake")


set(BUILD_SHARED_LIBS OFF)

# Otherwise ex. Android build on macOS fails with `error: unknown target CPU 'cyclone'`
set(LLAMA_NATIVE OFF CACHE BOOL "llama: disable -march=native flag" FORCE)

# Disable HTTP/CURL support on all platforms (we handle model downloads in Dart, not C++)
set(LLAMA_HTTPLIB OFF CACHE BOOL "Disable httplib for downloading" FORCE)
set(LLAMA_CURL OFF CACHE BOOL "Disable CURL (deprecated)" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "Disable server (requires httplib)" FORCE)
set(LLAMA_BUILD_TESTS OFF CACHE BOOL "Disable tests" FORCE)
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "Disable examples" FORCE)

if(ANDROID)
    # Debug: Print build information for Android
    message(STATUS "Android build detected")
    message(STATUS "CMAKE_ANDROID_ARCH_ABI: ${CMAKE_ANDROID_ARCH_ABI}")
    message(STATUS "CMAKE_SYSTEM_PROCESSOR: ${CMAKE_SYSTEM_PROCESSOR}")
    
    # Android-specific settings for llama.cpp (apply to all Android builds)
    set(GGML_LLAMAFILE OFF CACHE BOOL "Disable llamafile for Android" FORCE)
    set(GGML_OPENMP OFF CACHE BOOL "Disable OpenMP for Android" FORCE)
    set(BUILD_SHARED_LIBS OFF CACHE BOOL "Use static libs for Android" FORCE)
    
    # Only apply ARM-specific optimizations for ARM64 builds
    if(CMAKE_ANDROID_ARCH_ABI STREQUAL "arm64-v8a" OR CMAKE_SYSTEM_PROCESSOR MATCHES "aarch64|arm64")
        message(STATUS "ARM64 Android build - enabling dot product optimizations with KleiDiAI support")
        # ARMv8.2-A with dot product only (i8mm not supported on this device)
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -march=armv8.2-a+dotprod -O3")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=armv8.2-a+dotprod -O3")
        
        # Enable KleiDiAI ONLY for ARM64 builds (it's ARM64-specific)
        # Disabled: it requires CMake 4.0+ and src/CMakeLists.txt (via flutter template)
        # strongly suggests not going over 3.22, i.e. what is required for Flutter.
        # Because KleidiAI showed a small lift on performance (well within variation, 3-5%) 
        # for Android CPU on Pixel Fold, it is better to disable it for now. It is also
        # worth leaving here as ersatz documentation of how to get it working.
        # set(GGML_CPU_KLEIDIAI ON CACHE BOOL "Enable KleiDiAI optimizations" FORCE)
    else()
        message(STATUS "Non-ARM64 Android build (${CMAKE_ANDROID_ARCH_ABI}) - skipping ARM optimizations")
        # Explicitly disable KleiDiAI for non-ARM64 architectures
        # set(GGML_CPU_KLEIDIAI OFF CACHE BOOL "Disable KleiDiAI for non-ARM64" FORCE)
    endif()
endif()

if(WIN32)
  set(LLAMA_VULKAN ON CACHE BOOL "llama: enable Vulkan" FORCE)
  message(STATUS "Windows detected, enabling LLAMA_VULKAN")
endif()

add_subdirectory("llama.cpp" EXCLUDE_FROM_ALL)
add_subdirectory("llama.cpp/common" EXCLUDE_FROM_ALL)

add_library(fllama SHARED
  "fllama_chat_template.cpp"
  "fllama_eos.cpp"
  "fllama_inference_queue.cpp"
  "fllama_llava.cpp"
  "fllama_tokenize.cpp"
  "fllama.cpp"
  "clip.cpp"
  "llava.cpp"
)

set_target_properties(fllama PROPERTIES
  PUBLIC_HEADER "fllama.h;fllama_eos.h;fllama_tokenize.h"
  OUTPUT_NAME "fllama"
)

target_compile_definitions(fllama PUBLIC DART_SHARED_LIB)

if (ANDROID)
  # Support Android 15 16k page size.
  target_link_options(fllama PRIVATE "-Wl,-z,max-page-size=16384")
endif()
target_include_directories(fllama PUBLIC .)
add_executable(fllama_wasm fllama_wasm_entry.cpp)
target_link_libraries(fllama_wasm fllama) # Link against your library
target_link_libraries(fllama PUBLIC llama common)

if(ANDROID)
    find_library(LOG_LIB log) # Find the log library
    target_link_libraries(fllama PUBLIC
      ${LOG_LIB} # Add this to link against the log library for Android
    )
endif()
