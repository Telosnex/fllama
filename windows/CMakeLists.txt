# The Flutter tooling requires that developers have a version of Visual Studio
# installed that includes CMake 3.14 or later. You should not increase this
# version, as doing so will cause the plugin to fail to compile for some
# customers of the plugin.
cmake_minimum_required(VERSION 3.14)

# Project-level configuration.
set(PROJECT_NAME "fllama")
project(${PROJECT_NAME} LANGUAGES CXX)

# Explicitly disable Unicode. 
# This fixed a build error with ggml-cpu.cpp after the 2025-01 drop.
add_definitions(-UUNICODE -U_UNICODE)

# Disable HTTP/CURL support (we handle model downloads in Dart, not C++)
set(LLAMA_HTTPLIB OFF CACHE BOOL "Disable httplib for downloading" FORCE)
set(LLAMA_CURL OFF CACHE BOOL "Disable CURL (deprecated)" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "Disable server (requires httplib)" FORCE)

# Include build info generation before adding subdirectories
include("${CMAKE_CURRENT_SOURCE_DIR}/../src/llama.cpp/cmake/build-info.cmake")

# Invoke the build for native code shared with the other target platforms.
# This can be changed to accommodate different builds.
add_subdirectory("${CMAKE_CURRENT_SOURCE_DIR}/../src" "${CMAKE_CURRENT_BINARY_DIR}/shared")


# List of absolute paths to libraries that should be bundled with the plugin.
# This list could contain prebuilt libraries, or libraries created by an
# external build triggered from this build file.
set(fllama_bundled_libraries
  # Defined in ../src/CMakeLists.txt.
  # This can be changed to accommodate different builds.
  "$<TARGET_FILE:llama>"
  "$<TARGET_FILE:fllama>"
  PARENT_SCOPE
)
