#
# To learn more about a Podspec see http://guides.cocoapods.org/syntax/podspec.html.
# Run `pod lib lint fllama.podspec` to validate before publishing.
#
Pod::Spec.new do |s|
  s.name             = 'fllama'
  s.version          = '0.0.1'
  s.summary          = 'A new Flutter FFI plugin project.'
  s.description      = <<-DESC
A new Flutter FFI plugin project.
                       DESC
  s.homepage         = 'http://example.com'
  s.license          = { :file => '../LICENSE' }
  s.author           = { 'Your Company' => 'email@example.com' }
  s.dependency 'FlutterMacOS'
  s.swift_version = '5.0'

  s.source           = { :path => '.' }
  
  # Classes contains only the wrapper fllama.cpp that includes ../src/*.cpp files
  s.source_files = 'Classes/**/*'
  
  # We use pre-built static libraries instead of compiling llama.cpp sources directly because:
  # 1. llama.cpp uses architecture-specific subdirectories (arch/arm/, arch/x86/) with duplicate symbols
  # 2. CocoaPods compiles all source files together, causing "duplicate symbol" errors
  # 3. CMake properly selects the right architecture files at build time
  # The libs/ directory contains: libllama.a, libggml*.a, libcommon.a
  s.vendored_libraries = 'libs/*.a'
  
  # Required frameworks:
  # - Foundation, Metal, MetalKit: Core llama.cpp/ggml requirements
  # - Accelerate: Required for vDSP functions in ggml-cpu optimizations
  s.frameworks = 'Foundation', 'Metal', 'MetalKit', 'Accelerate'
  s.platform = :osx, '10.15'
  
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    # Header paths for llama.cpp includes - the source code uses paths like:
    # - "llama.h" (in include/)
    # - "ggml.h" (in ggml/include/)  
    # - <nlohmann/json.hpp> (in vendor/)
    'HEADER_SEARCH_PATHS' => '$(PODS_TARGET_SRCROOT)/llama.cpp/include $(PODS_TARGET_SRCROOT)/llama.cpp/ggml/include $(PODS_TARGET_SRCROOT)/llama.cpp/vendor',
    # C++17 required for std::scoped_lock, CTAD, and other modern features in vendor/minja/
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'CLANG_CXX_LIBRARY' => 'libc++',
  }
  
  # Build llama.cpp using CMake during pod install
  # This runs once and creates all the static libraries we need
  s.prepare_command = <<-CMD
    set -e
    
    # Build if needed
    if [ ! -d "llama.cpp/build-macos" ]; then
      echo "Building llama.cpp..."
      cd llama.cpp
      cmake -B build-macos -G Xcode -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" -DCMAKE_OSX_DEPLOYMENT_TARGET=10.15 -DBUILD_SHARED_LIBS=OFF -DGGML_METAL=ON -DGGML_METAL_EMBED_LIBRARY=ON -S .
      cmake --build build-macos --config Release
      cd ..
    fi
    
    # Copy ALL static libraries
    # This finds all .a files in Release directories (excluding intermediate build artifacts)
    # Result: ~7 libraries totaling ~170MB that get linked into the final ~11MB framework
    echo "Copying static libraries..."
    mkdir -p libs
    find llama.cpp/build-macos -name "*.a" -path "*/Release/*" ! -path "*/build/*" -exec cp {} libs/ \\;
    
    echo "Setup complete!"
  CMD
end