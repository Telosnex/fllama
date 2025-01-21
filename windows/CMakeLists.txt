# The Flutter tooling requires that developers have a version of Visual Studio
# installed that includes CMake 3.14 or later. You should not increase this
# version, as doing so will cause the plugin to fail to compile for some
# customers of the plugin.
cmake_minimum_required(VERSION 3.14)

# Project-level configuration.
set(PROJECT_NAME "fllama")
project(${PROJECT_NAME} LANGUAGES CXX)

add_definitions(-DUNICODE -D_UNICODE)

# Invoke the build for native code shared with the other target platforms.
# This can be changed to accommodate different builds.
add_subdirectory("${CMAKE_CURRENT_SOURCE_DIR}/../src" "${CMAKE_CURRENT_BINARY_DIR}/shared")

# Create the missing cmake directory and an empty build-info-gen-cpp.cmake file
file(MAKE_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../src/llama.cpp/common/cmake")
file(WRITE "${CMAKE_CURRENT_SOURCE_DIR}/../src/llama.cpp/common/cmake/build-info-gen-cpp.cmake" "# Placeholder file")

# Optional: Print a message to confirm the file was created
message(STATUS "Created placeholder build-info-gen-cpp.cmake file")

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
