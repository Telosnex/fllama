#!/usr/bin/env bash
set -e

LLAMA_CPP_WASM_BUILD_DIR=wasm_build
LLAMA_CPP_WASM_DIST_DIR=dist
LLAMA_CPP_WASM_DIST_LLAMA_DIR=$LLAMA_CPP_WASM_DIST_DIR/llama-mt
LLAMA_CPP_GIT_HASH="8c933b7"
LLAMA_CPP_SOURCE_DIR="../../src/llama.cpp"
FLLAMA_SOURCE_DIR="../../src"
LLAMA_CPP_BUILD_DIR=$LLAMA_CPP_WASM_BUILD_DIR/build

if [ -d $LLAMA_CPP_WASM_BUILD_DIR ]; then
    rm -rf $LLAMA_CPP_WASM_BUILD_DIR
fi

mkdir -p $LLAMA_CPP_WASM_BUILD_DIR

# git apply ../../00-llama-cpp-enable-main.patch
echo "Making directory: $LLAMA_CPP_BUILD_DIR"
echo "pwd: $(pwd)"
mkdir -p $LLAMA_CPP_BUILD_DIR
cd $LLAMA_CPP_BUILD_DIR
echo "now in directory: $(pwd)"
emcc --clear-cache
emcmake cmake $FLLAMA_SOURCE_DIR
# export EMCC_CFLAGS="-O3 -pthread -DNDEBUG -flto -s SHARED_MEMORY=1 -s EXPORT_ALL=1 -s EXPORT_ES6=1 -s MODULARIZE=1 -s INITIAL_MEMORY=2GB -s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -s FORCE_FILESYSTEM=1 -s EXPORTED_FUNCTIONS=_main -s EXPORTED_RUNTIME_METHODS=callMain -s NO_EXIT_RUNTIME=1"
export EMCC_CFLAGS="-O3 -msimd128 -pthread -fno-rtti -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=32 -DNDEBUG -flto=full -s SHARED_MEMORY=1 -s EXPORT_ALL=1 -s EXPORT_ES6=1 -s MODULARIZE=1 -s INITIAL_MEMORY=800MB -s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -s FORCE_FILESYSTEM=1 -s EXPORTED_FUNCTIONS=['_fllama_get_eos_token_export'] -s EXPORTED_RUNTIME_METHODS=callMain -s NO_EXIT_RUNTIME=1"
emmake make fllama_wasm -j

#
# bundle llama-cpp-wasm dist
#
# if [ -d $LLAMA_CPP_WASM_DIST_LLAMA_DIR ]; then
#     rm -rf $LLAMA_CPP_WASM_DIST_LLAMA_DIR
# fi

# mkdir -p $LLAMA_CPP_WASM_DIST_LLAMA_DIR
# cp -rv src/llama/* $LLAMA_CPP_WASM_DIST_LLAMA_DIR
# cp $LLAMA_CPP_BUILD_DIR/bin/main.* $LLAMA_CPP_WASM_DIST_LLAMA_DIR

# rm -rf docs/llama-mt
# cp -rv $LLAMA_CPP_WASM_DIST_LLAMA_DIR docs/