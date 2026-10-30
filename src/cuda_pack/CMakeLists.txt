# The CUDA GPU pack (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D8 and D16).
#
# A CMake project for ggml-cuda alone, so the pack does not depend on
# fllama or on the rest of llama.cpp. scripts/cuda_pack.dart configures it
# with the defines and the generator in hook/cuda_pack.dart, builds the
# target ggml-cuda, and reads the pack file list that this project writes.
# Every file in this directory is in the CUDA pack key.
cmake_minimum_required(VERSION 3.18)
project(fllama_cuda_pack C CXX)

# ── Settings that src/llama.cpp/CMakeLists.txt applies to ggml ──────────
# fllama builds ggml-base through llama.cpp's root project. The pack builds
# ggml directly, so it repeats what that project sets before
# add_subdirectory(ggml). test/cuda_pack_test.dart fails when llama.cpp
# changes that list.
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
if(WIN32)
  add_compile_definitions(_CRT_SECURE_NO_WARNINGS)
endif()
if(MSVC)
  add_compile_options("$<$<COMPILE_LANGUAGE:C>:/utf-8>")
  add_compile_options("$<$<COMPILE_LANGUAGE:CXX>:/utf-8>")
  add_compile_options("$<$<COMPILE_LANGUAGE:C>:/bigobj>")
  add_compile_options("$<$<COMPILE_LANGUAGE:CXX>:/bigobj>")
endif()
set(GGML_LLAMAFILE_DEFAULT ON)
set(GGML_CUDA_GRAPHS_DEFAULT ON)
set(GGML_BUILD_NUMBER 1)
set(GGML_BUILD_COMMIT unknown)

# ── Settings that src/CMakeLists.txt applies to every fllama library ────
if(UNIX AND NOT APPLE)
  # ggml-cuda finds the CUDA runtime libraries in its own directory.
  set(CMAKE_BUILD_WITH_INSTALL_RPATH ON)
  set(CMAKE_INSTALL_RPATH "$ORIGIN")
endif()

add_subdirectory(../llama.cpp/ggml ggml)

if(FLLAMA_CUDA_TIMING)
  # Per-file nvcc timings for scripts/summarize_cuda_timings.py. CMake
  # ignores compiler launchers for Visual Studio generators.
  set_property(TARGET ggml-cuda PROPERTY CUDA_COMPILER_LAUNCHER
    "${CMAKE_COMMAND};-P;${CMAKE_CURRENT_SOURCE_DIR}/../cmake/time_cuda.cmake;--")
endif()

# The CUDA runtime and cuBLAS are NVIDIA redistributable files (CUDA EULA,
# Attachment A). fllama loads them before ggml-cuda (ADR 004 I6), so the
# pack works without a system CUDA install. Copy each library next to
# ggml-cuda. Linux copies have the soname, the name that the loader opens.
find_package(CUDAToolkit REQUIRED)
set(runtime_dir "${CMAKE_RUNTIME_OUTPUT_DIRECTORY}")
if(CMAKE_CONFIGURATION_TYPES)
  set(runtime_dir "${runtime_dir}/Release")
endif()
file(MAKE_DIRECTORY "${runtime_dir}")
set(pack_files "")
foreach(lib IN ITEMS cudart cublasLt cublas)
  if(WIN32)
    file(GLOB source "${CUDAToolkit_BIN_DIR}/${lib}64_*.dll")
    list(LENGTH source n)
    if(NOT n EQUAL 1)
      message(FATAL_ERROR "Expected one ${lib}64_*.dll in ${CUDAToolkit_BIN_DIR}: ${source}")
    endif()
    get_filename_component(name "${source}" NAME)
  else()
    get_target_property(location CUDA::${lib} IMPORTED_LOCATION)
    get_filename_component(source "${location}" REALPATH)
    execute_process(COMMAND objdump -p "${source}" OUTPUT_VARIABLE dump
      COMMAND_ERROR_IS_FATAL ANY)
    if(NOT dump MATCHES "SONAME +([^\n]+)")
      message(FATAL_ERROR "No soname in ${source}")
    endif()
    string(STRIP "${CMAKE_MATCH_1}" name)
  endif()
  configure_file("${source}" "${runtime_dir}/${name}" COPYONLY)
  string(APPEND pack_files "${runtime_dir}/${name}\n")
endforeach()

# One absolute path per line. The file name has the configuration, because
# multi-config generators evaluate $<TARGET_FILE> once per configuration.
file(GENERATE
  OUTPUT "${CMAKE_BINARY_DIR}/cuda_pack_files-$<CONFIG>.txt"
  CONTENT "${pack_files}$<TARGET_FILE:ggml-cuda>\n")
