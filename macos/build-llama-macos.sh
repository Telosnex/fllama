#!/bin/bash
set -e

echo "🔨 Building llama.cpp for macOS..."

should_skip_build() {
    # If libs don't exist, we obviously need a build
    if [ ! -d "libs" ] || [ -z "$(ls -A libs 2>/dev/null)" ]; then
        return 1
    fi

    # If llama.cpp is a git checkout, use the commit hash to detect changes
    if [ -d "llama.cpp/.git" ]; then
        local current_hash
        current_hash=$(git -C llama.cpp rev-parse HEAD 2>/dev/null || echo "")
        local cached_hash
        cached_hash=$(cat libs/.llama_cpp_build_hash 2>/dev/null || echo "")
        if [ -n "$current_hash" ] && [ "$current_hash" = "$cached_hash" ]; then
            echo "✅ llama.cpp hash unchanged ($current_hash)"
        else
            echo "♻️  llama.cpp changed (or no cached hash); rebuilding"
            return 1
        fi
    fi

    # Sanity-check for symbols that fllama expects. This avoids confusing link
    # errors when headers were updated but libs were cached from an older build.
    nm -gU libs/libcommon.a 2>/dev/null | grep -q "common_chat_format_example" || return 1
    nm -gU libs/libcommon.a 2>/dev/null | grep -q "common_chat_msgs_parse_oaicompat" || return 1
    nm -gU libs/libcommon.a 2>/dev/null | grep -q "common_chat_tools_parse_oaicompat" || return 1
    nm -gU libs/libcommon.a 2>/dev/null | grep -q "common_chat_parse" || return 1
    nm -gU libs/libllama.a  2>/dev/null | grep -q "llama_flash_attn_type_name" || return 1

    return 0
}

if should_skip_build; then
    echo "✅ Libraries already exist and look compatible; skipping build"
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

# Cache the llama.cpp git hash (if available) so we can skip rebuilds safely.
if [ -d "llama.cpp/.git" ]; then
    git -C llama.cpp rev-parse HEAD > libs/.llama_cpp_build_hash 2>/dev/null || true
fi

echo "✅ llama.cpp build complete!"
echo "📊 Generated libraries:"
ls -lah libs/
