#!/bin/bash
# Note: Not using set -e because build-xcframework.sh may fail at packaging step
# but still successfully build the libraries we need

echo "🔨 Building llama.cpp for iOS..."

# Check if libraries already exist
if [ -d "libs" ] && [ "$(ls -A libs 2>/dev/null)" ]; then
    echo "✅ Libraries already exist, skipping build"
    exit 0
fi

# Build libraries using the XCFramework script (ignore final packaging errors)
echo "📦 Building iOS libraries (this may take a few minutes)..."
# Use the bundled build-xcframework.sh script, but ignore final packaging errors
cd llama.cpp
bash ../build-xcframework.sh || echo "XCFramework packaging failed, but libraries should be built"
cd ..

# Extract libraries from the iOS simulator build
echo "📋 Extracting iOS libraries..."
mkdir -p libs

# The iOS simulator build works for both device and simulator on arm64
if [ -d "llama.cpp/build-ios-sim" ]; then
    find llama.cpp/build-ios-sim -name "*.a" -path "*/Release*" ! -path "*/build/*" -exec cp {} libs/ \;
    
    # Check if we actually got the libraries we need
    if [ ! -f "libs/libllama.a" ] || [ ! -f "libs/libggml.a" ] || [ ! -f "libs/libcommon.a" ]; then
        echo "❌ Missing required libraries after copy!"
        echo "Found in libs/:"
        ls -la libs/
        exit 1
    fi
else
    echo "❌ iOS simulator build not found!"
    exit 1
fi

echo "✅ llama.cpp build complete!"
echo "📊 Generated libraries:"
ls -lah libs/