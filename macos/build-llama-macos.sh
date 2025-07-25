#!/bin/bash
set -e

echo "🔨 Building llama.cpp for macOS..."

# Check if libraries already exist
if [ -d "libs" ] && [ "$(ls -A libs 2>/dev/null)" ]; then
    echo "✅ Libraries already exist, skipping build"
    exit 0
fi

# Build using CMake if needed
if [ ! -d "llama.cpp/build-macos" ]; then
    echo "📦 Configuring CMake build..."
    cd llama.cpp
    cmake -B build-macos -G Xcode \
        -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" \
        -DCMAKE_OSX_DEPLOYMENT_TARGET=10.15 \
        -DBUILD_SHARED_LIBS=OFF \
        -DGGML_METAL=ON \
        -DGGML_METAL_EMBED_LIBRARY=ON \
        -S .
    
    echo "🏗️ Building libraries (this may take a few minutes)..."
    cmake --build build-macos --config Release
    cd ..
else
    echo "✅ CMake build already exists"
fi

# Copy libraries
echo "📋 Copying static libraries..."
mkdir -p libs
find llama.cpp/build-macos -name "*.a" -path "*/Release/*" ! -path "*/build/*" -exec cp {} libs/ \;

echo "✅ llama.cpp build complete!"
echo "📊 Generated libraries:"
ls -lah libs/