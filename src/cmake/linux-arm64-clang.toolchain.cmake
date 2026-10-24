# Linux arm64 builds with clang (hook/build.dart, compilesWithClang).
#
# Two of ggml's Linux arm64 CPU variants need -march=armv9.2-a+sme, which GCC
# knows from version 14; Ubuntu 22.04 has GCC 11. native_toolchain_cmake
# 0.2.7 passes a toolchain file that sets GCC. hook/build.dart passes this
# file after it, and the last CMAKE_TOOLCHAIN_FILE wins.
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)

set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)

# The baseline for fllama, llama, ggml and ggml-base. Each CPU variant adds
# its own -march.
set(CMAKE_C_FLAGS_INIT "-march=armv8-a")
set(CMAKE_CXX_FLAGS_INIT "-march=armv8-a")
