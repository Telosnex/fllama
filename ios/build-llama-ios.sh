#!/bin/bash
# Note: Not using set -e because build-xcframework.sh may fail at packaging step
# but still successfully build the libraries we need

echo "🔨 Building llama.cpp for iOS..."

# Check if libraries already exist
if [ -d "libs" ] && [ "$(ls -A libs 2>/dev/null)" ]; then
    echo "✅ Libraries already exist, skipping build"
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