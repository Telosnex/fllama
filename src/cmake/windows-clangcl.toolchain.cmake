# Selects Visual Studio's ClangCL toolset for Windows arm64 builds.
#
# llama.cpp rejects MSVC for ARM. ClangCL keeps the Visual Studio generator,
# MSVC ABI, and Windows SDK, but compiles with clang-cl. CMake documents a
# toolchain file as a place to set CMAKE_GENERATOR_TOOLSET; hook/build.dart
# passes this file because native_toolchain_cmake 0.2.7 does not forward its
# `toolset` argument to `cmake -T`.
set(CMAKE_GENERATOR_TOOLSET "ClangCL")
