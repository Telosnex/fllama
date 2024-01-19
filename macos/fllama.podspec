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

  # This will ensure the source files in Classes/ are included in the native
  # builds of apps using this FFI plugin. Podspec does not support relative
  # paths, so Classes contains a forwarder C file that relatively imports
  # `../src/*` so that the C sources can be shared among all target platforms.
  s.source           = { :path => '.' }
  s.source_files = 'Classes/**/*', 
                   'llama.cpp/llama.cpp', 
                   'llama.cpp/ggml.c', 
                   'llama.cpp/ggml-quants.c', 
                   'llama.cpp/ggml-backend.c', 
                   'llama.cpp/ggml-alloc.c', 
                   'llama.cpp/common/common.cpp', 
                   'llama.cpp/common/build-info.cpp', 
                   'llama.cpp/ggml-metal.m' 
  s.frameworks = 'Foundation', 'Metal', 'MetalKit'
  s.dependency 'FlutterMacOS'

  s.platform = :osx, '10.14'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'USER_HEADER_SEARCH_PATHS' => ['$(PODS_TARGET_SRCROOT)/../llama.cpp/**/*.h', '$(PODS_TARGET_SRCROOT)/../llama.cpp/common/**/*.h'],
    'OTHER_CFLAGS' => ['$(inherited)', '-O3', '-flto', '-fno-objc-arc'],
    'OTHER_CPLUSPLUSFLAGS' => ['$(inherited)', '-O3', '-flto', '-fno-objc-arc'],
    'GCC_PREPROCESSOR_DEFINITIONS' => ['$(inherited)', 'GGML_USE_METAL=1'],
  }
  s.swift_version = '5.0'
end
