#!/bin/bash
# Note: Not using set -e because build-xcframework.sh may fail at packaging step
# but still successfully build the libraries we need

echo "🔨 Building llama.cpp for iOS..."

check_symbols() {
    local libcommon="$1"
    local libllama="$2"

    # These symbols are used by fllama.cpp. Checking them here avoids confusing
    # link errors when llama.cpp headers were updated but cached libs were not.
    nm -gU "$libcommon" 2>/dev/null | grep -q "common_chat_format_example" || return 1
    nm -gU "$libcommon" 2>/dev/null | grep -q "common_chat_msgs_parse_oaicompat" || return 1
    nm -gU "$libcommon" 2>/dev/null | grep -q "common_chat_tools_parse_oaicompat" || return 1
    nm -gU "$libcommon" 2>/dev/null | grep -q "common_chat_parse" || return 1
    nm -gU "$libllama"  2>/dev/null | grep -q "llama_flash_attn_type_name" || return 1
    return 0
}

check_target_libs() {
    local target="$1" # device|simulator

    if [ ! -f "libs/$target/libllama.a" ] || [ ! -f "libs/$target/libggml.a" ] || [ ! -f "libs/$target/libcommon.a" ]; then
        return 1
    fi

    check_symbols "libs/$target/libcommon.a" "libs/$target/libllama.a" || return 1
    return 0
}

should_skip_build() {
    # Need libs for both device + simulator
    if ! check_target_libs device; then
        return 1
    fi
    if ! check_target_libs simulator; then
        return 1
    fi

    # If llama.cpp is a git checkout, only skip when hash matches.
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

    return 0
}

if should_skip_build; then
    echo "✅ Libraries already exist and look compatible; skipping build"
    exit 0
fi

# Build libraries using the XCFramework script
if [ ! -d "llama.cpp/build-apple/llama.xcframework" ]; then
    echo "📦 Building iOS libraries (this may take a few minutes)..."
    # Use the bundled build-xcframework.sh script
    cd llama.cpp
    bash ../build-xcframework.sh
    cd ..
else
    echo "✅ XCFramework already exists"
fi

# Extract iOS libraries for both device and simulator
echo "📍 Extracting iOS libraries for device and simulator..."
mkdir -p libs/device
mkdir -p libs/simulator

# Copy device libraries
if [ -d "llama.cpp/build-ios-device" ]; then
    echo "Copying device libraries..."
    find llama.cpp/build-ios-device -name "*.a" -path "*/Release*" ! -path "*/build/*" -exec cp {} libs/device/ \;
else
    echo "❌ iOS device build directory not found!"
    exit 1
fi

# Copy simulator libraries
if [ -d "llama.cpp/build-ios-sim" ]; then
    echo "Copying simulator libraries..."
    find llama.cpp/build-ios-sim -name "*.a" -path "*/Release*" ! -path "*/build/*" -exec cp {} libs/simulator/ \;
else
    echo "❌ iOS simulator build directory not found!"
    exit 1
fi

# Check if we got the required libraries for both targets
for target in device simulator; do
    if [ ! -f "libs/$target/libllama.a" ] || [ ! -f "libs/$target/libggml.a" ] || [ ! -f "libs/$target/libcommon.a" ]; then
        echo "❌ Missing required libraries for $target!"
        echo "Found in libs/$target/:"
        ls -la libs/$target/
        exit 1
    fi
done

echo "✅ llama.cpp build complete!"
echo "📊 Generated libraries:"
ls -lah libs/

# Cache the llama.cpp git hash (if available) so we can skip rebuilds safely.
if [ -d "llama.cpp/.git" ]; then
    git -C llama.cpp rev-parse HEAD > libs/.llama_cpp_build_hash 2>/dev/null || true
fi
