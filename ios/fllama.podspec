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
    # Link the libraries conditionally based on SDK target
    'OTHER_LDFLAGS[sdk=iphoneos*]' => '-L$(PODS_TARGET_SRCROOT)/libs/device -lcommon -lggml-base -lggml-blas -lggml-cpu -lggml-metal -lggml -lllama',
    'OTHER_LDFLAGS[sdk=iphonesimulator*]' => '-L$(PODS_TARGET_SRCROOT)/libs/simulator -lcommon -lggml-base -lggml-blas -lggml-cpu -lggml-metal -lggml -lllama',
  }
  
  # Build llama.cpp during Xcode compilation (not during pod install!)
  # This provides proper progress feedback and caching
  s.script_phases = [
    {
      :name => 'Build llama.cpp',
      :script => 'cd "${PODS_TARGET_SRCROOT}" && bash build-llama-ios.sh',
      :execution_position => :before_compile,
      :show_env_vars_in_log => false
    }
  ]
end