# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version, as doing so will cause
# the plugin to fail to compile for some customers of the plugin.
cmake_minimum_required(VERSION 3.10)

project(fllama_library VERSION 0.0.1 LANGUAGES CXX)

set(BUILD_SHARED_LIBS ON)

add_subdirectory(llama.cpp)
add_subdirectory(llama.cpp/common)

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
