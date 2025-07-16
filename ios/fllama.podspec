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
  s.dependency 'Flutter'
  s.platform = :ios, '13.0'
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
  
  s.pod_target_xcconfig = { 
    'DEFINES_MODULE' => 'YES', 
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386',
    # Header paths for llama.cpp includes - the source code uses paths like:
    # - "llama.h" (in include/)
    # - "ggml.h" (in ggml/include/)  
    # - <nlohmann/json.hpp> (in vendor/)
    'HEADER_SEARCH_PATHS' => '$(PODS_TARGET_SRCROOT)/llama.cpp/include $(PODS_TARGET_SRCROOT)/llama.cpp/ggml/include $(PODS_TARGET_SRCROOT)/llama.cpp/vendor',
    # C++17 required for std::scoped_lock, CTAD, and other modern features in vendor/minja/
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'CLANG_CXX_LIBRARY' => 'libc++',
    # Metal library embedding for iOS
    'GCC_PREPROCESSOR_DEFINITIONS' => ['$(inherited)', 'GGML_USE_METAL=1', 'GGML_METAL_EMBED_LIBRARY=1'],
  }
  
  # Build llama.cpp using the existing build-xcframework.sh script
  # This runs once and creates an XCFramework that we'll extract libraries from
  s.prepare_command = <<-CMD
    set -e
    
    # Build XCFramework if needed
    if [ ! -d "llama.cpp/build-apple/llama.xcframework" ]; then
      echo "Building llama.cpp XCFramework..."
      cd llama.cpp
      bash build-xcframework.sh
      cd ..
    fi
    
    # Extract static libraries from the iOS slice of the XCFramework
    echo "Extracting iOS libraries from XCFramework..."
    mkdir -p libs
    
    # Copy static libraries from the iOS simulator build (works for both device and sim on arm64)
    if [ -d "llama.cpp/build-ios-sim" ]; then
      find llama.cpp/build-ios-sim -name "*.a" -path "*/Release*" ! -path "*/build/*" -exec cp {} libs/ \\;
    fi
    
    echo "Setup complete!"
  CMD
end