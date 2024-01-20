# The Flutter tooling requires that developers have CMake 3.10 or later
# installed. You should not increase this version, as doing so will cause
# the plugin to fail to compile for some customers of the plugin.
cmake_minimum_required(VERSION 3.10)

project(fllama_library VERSION 0.0.1 LANGUAGES CXX)

set(BUILD_SHARED_LIBS ON)

add_subdirectory(llama.cpp)

if(ANDROID)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DANDROID_ARM_NEON=TRUE -DANDROID_TOOLCHAIN=clang -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-23")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DANDROID_ARM_NEON=TRUE -DANDROID_TOOLCHAIN=clang -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-23")
endif()

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