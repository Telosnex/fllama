# Selects the CUDA Toolkit for Windows x64 release builds with the CUDA GPU
# pack (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D8).
#
# The Visual Studio generator compiles CUDA with the MSBuild extensions of a
# toolkit. `cmake -T cuda=<dir>` selects a toolkit directory, so the build
# does not need the extensions in the Visual Studio installation. CMake
# documents a toolchain file as a place to set CMAKE_GENERATOR_TOOLSET.
# hook/build.dart passes FLLAMA_CUDA_TOOLKIT_DIR.
list(APPEND CMAKE_TRY_COMPILE_PLATFORM_VARIABLES FLLAMA_CUDA_TOOLKIT_DIR)
if(FLLAMA_CUDA_TOOLKIT_DIR)
  file(TO_CMAKE_PATH "${FLLAMA_CUDA_TOOLKIT_DIR}" _fllama_cuda_dir)
  set(CMAKE_GENERATOR_TOOLSET "cuda=${_fllama_cuda_dir}")
endif()
