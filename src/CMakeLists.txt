# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version, as doing so will cause
# the plugin to fail to compile for some customers of the plugin.
cmake_minimum_required(VERSION 3.10)

project(fllama_library VERSION 0.0.1 LANGUAGES CXX)

# Create the missing cmake directory and an empty build-info-gen-cpp.cmake file
file(MAKE_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp/common/cmake")
file(WRITE "${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp/common/cmake/build-info-gen-cpp.cmake" "# Placeholder file")

# Optional: Print a message to confirm the file was created
message(STATUS "Created placeholder build-info-gen-cpp.cmake file")

if(EMSCRIPTEN)
  set(BUILD_SHARED_LIBS OFF) # Emscripten does better with static libraries for WebAssembly
  message(STATUS "Emscripten detected, switching to static libraries")
else()
  set(BUILD_SHARED_LIBS OFF)
endif()

# Otherwise ex. Android build on macOS fails with `error: unknown target CPU 'cyclone'`
set(LLAMA_NATIVE OFF CACHE BOOL "llama: disable -march=native flag" FORCE)

if(ANDROID)
    set(CMAKE_C_FLAGS "-DCMAKE_TOOLCHAIN_FILE=~/Library/Android/sdk/ndk/26.1.10909125/build/cmake/android.toolchain.cmake${CMAKE_C_FLAGS} -DANDROID_ABI=arm64-v8a -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-23 -O3 -DLLAMA_CURL=OFF -DGGML_NATIVE=ON")
    set(CMAKE_CXX_FLAGS "-DCMAKE_TOOLCHAIN_FILE=~/Library/Android/sdk/ndk/26.1.10909125/build/cmake/android.toolchain.cmake ${CMAKE_CXX_FLAGS} -DANDROID_ABI=arm64-v8a -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-23 -O3 -DLLAMA_CURL=OFF -DGGML_NATIVE=ON")
    # See discussion @ https://github.com/ggerganov/llama.cpp/pull/4926
    # Re: -DLLAMA_CURL=OFF:
    # CMake Error at llama.cpp/common/CMakeLists.txt:90 (message):
    # Could NOT find CURL.  Hint: to disable this feature, set -DLLAMA_CURL=OFF
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
