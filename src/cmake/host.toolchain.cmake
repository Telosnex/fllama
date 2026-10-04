# Host toolchain for ggml's vulkan-shaders-gen helper.
#
# native_toolchain_cmake always sets CMAKE_SYSTEM_NAME, so CMake marks each
# build as a cross build. ggml-vulkan then searches PATH for a host compiler
# to build vulkan-shaders-gen. The hook environment has no compiler on PATH
# on Windows. hook/build.dart passes this empty file as
# GGML_VULKAN_SHADERS_GEN_TOOLCHAIN, so the helper uses the generator,
# platform and toolset of the main build. The helper runs on the build
# machine during the build and does not ship.
