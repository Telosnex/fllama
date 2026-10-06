# Selects the CUDA Toolkit for Windows x64 release builds with the CUDA GPU
# pack (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D8).
#
# Ninja invokes nvcc directly; Visual Studio instead needs the toolkit's
# MSBuild extensions. hook/build.dart passes FLLAMA_CUDA_TOOLKIT_DIR.
list(APPEND CMAKE_TRY_COMPILE_PLATFORM_VARIABLES FLLAMA_CUDA_TOOLKIT_DIR)
if(FLLAMA_CUDA_TOOLKIT_DIR)
  file(TO_CMAKE_PATH "${FLLAMA_CUDA_TOOLKIT_DIR}" _fllama_cuda_dir)
  if(CMAKE_GENERATOR MATCHES "^Visual Studio")
    set(CMAKE_GENERATOR_TOOLSET "cuda=${_fllama_cuda_dir}")
  else()
    set(CMAKE_CUDA_COMPILER "${_fllama_cuda_dir}/bin/nvcc.exe" CACHE FILEPATH "CUDA compiler")
  endif()
endif()
