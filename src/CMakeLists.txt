# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version, as doing so will cause
# the plugin to fail to compile for some customers of the plugin.
cmake_minimum_required(VERSION 3.10)

project(fllama_library VERSION 0.0.1 LANGUAGES C)

add_library(fllama SHARED
  "fllama.c"
)

set_target_properties(fllama PROPERTIES
  PUBLIC_HEADER fllama.h
  OUTPUT_NAME "fllama"
)

target_compile_definitions(fllama PUBLIC DART_SHARED_LIB)

add_subdirectory(llama.cpp)

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp)

target_link_libraries(fllama PRIVATE llama)
