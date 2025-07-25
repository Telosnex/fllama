#!/bin/bash
set -e

echo "🔨 Building llama.cpp for iOS..."

# Check if libraries already exist
if [ -d "libs" ] && [ "$(ls -A libs 2>/dev/null)" ]; then
    echo "✅ Libraries already exist, skipping build"
    exit 0
fi

# Build XCFramework if needed (this creates both device and simulator builds)
if [ ! -d "llama.cpp/build-apple/llama.xcframework" ]; then
    echo "📦 Building XCFramework (this may take a few minutes)..."
    # Use the bundled build-xcframework.sh script
    cd llama.cpp
    bash ../build-xcframework.sh
    cd ..
else
    echo "✅ XCFramework already exists"
fi

# Extract libraries from the iOS simulator build
echo "📋 Extracting iOS libraries..."
mkdir -p libs

# The iOS simulator build works for both device and simulator on arm64
if [ -d "llama.cpp/build-ios-sim" ]; then
    find llama.cpp/build-ios-sim -name "*.a" -path "*/Release*" ! -path "*/build/*" -exec cp {} libs/ \;
else
    echo "❌ iOS simulator build not found!"
    exit 1
fi

echo "✅ llama.cpp build complete!"
echo "📊 Generated libraries:"
ls -lah libs/