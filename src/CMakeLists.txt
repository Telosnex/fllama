# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version, as doing so will cause
# the plugin to fail to compile for some customers of the plugin.
cmake_minimum_required(VERSION 3.10)

project(fllama_library VERSION 0.0.1 LANGUAGES CXX)

set(BUILD_SHARED_LIBS ON)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_INSTALL_PREFIX ${CMAKE_BINARY_DIR}/install)

# Otherwise ex. Android build on macOS fails with `error: unknown target CPU 'cyclone'`
set(LLAMA_NATIVE OFF CACHE BOOL "llama: disable -march=native flag" FORCE)

if(ANDROID)
    set(CMAKE_C_FLAGS "-DCMAKE_TOOLCHAIN_FILE=~/Library/Android/sdk/ndk/26.1.10909125/build/cmake/android.toolchain.cmake${CMAKE_C_FLAGS} -DANDROID_ABI=arm64-v8a -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-23 -O3")
    set(CMAKE_CXX_FLAGS "-DCMAKE_TOOLCHAIN_FILE=~/Library/Android/sdk/ndk/26.1.10909125/build/cmake/android.toolchain.cmake ${CMAKE_CXX_FLAGS} -DANDROID_ABI=arm64-v8a -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-23 -O3")
    # See discussion @ https://github.com/ggerganov/llama.cpp/pull/4926
endif()

if(MSVC)
  # Hack because Windows compilers will put .dll files in
  # $CMAKE_BINARY_DIR/Debug/ folder.
  set(CMAKE_RUNTIME_OUTPUT_DIRECTORY $<1:${CMAKE_BINARY_DIR}>)
endif()

add_subdirectory(llama.cpp)

add_library(fllama SHARED
  "fllama.cpp"
)

set_target_properties(fllama PROPERTIES
  PUBLIC_HEADER fllama.h
  OUTPUT_NAME "fllama"
)

target_compile_definitions(fllama PUBLIC DART_SHARED_LIB)
target_include_directories(fllama PUBLIC .)
target_link_libraries(fllama PUBLIC llama common)

if(ANDROID)
    find_library(LOG_LIB log) # Find the log library
    target_link_libraries(fllama PUBLIC
      ${LOG_LIB} # Add this to link against the log library for Android
    )
endif()