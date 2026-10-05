import 'package:code_assets/code_assets.dart';
import 'package:test/test.dart';

import '../hook/build.dart' as hook;

void main() {
  group('split libraries (ADR 004, D1)', () {
    test('only Windows and Linux x64 split', () {
      expect(hook.usesSplitLibraries(OS.windows, Architecture.x64), isTrue);
      expect(hook.usesSplitLibraries(OS.windows, Architecture.arm64), isTrue);
      expect(hook.usesSplitLibraries(OS.linux, Architecture.x64), isTrue);
      expect(hook.usesSplitLibraries(OS.linux, Architecture.arm64), isFalse);
      expect(hook.usesSplitLibraries(OS.macOS, Architecture.arm64), isFalse);
      expect(hook.usesSplitLibraries(OS.iOS, Architecture.arm64), isFalse);
      expect(hook.usesSplitLibraries(OS.android, Architecture.arm64), isFalse);
    });

    test('x64 builds every CPU variant with backend loading', () {
      for (final os in [OS.windows, OS.linux]) {
        final defines = hook.computeDefines(os, Architecture.x64, '');
        expect(defines['BUILD_SHARED_LIBS'], 'ON', reason: os.name);
        expect(defines['GGML_BACKEND_DL'], 'ON', reason: os.name);
        expect(defines['GGML_CPU_ALL_VARIANTS'], 'ON', reason: os.name);
        expect(defines['GGML_NATIVE'], 'OFF', reason: os.name);
        expect(defines, isNot(contains('GGML_CPU_ARM_ARCH')));
        expect(defines, isNot(contains('GGML_VULKAN')));
      }
      expect(
        hook.computeDefines(
          OS.linux,
          Architecture.x64,
          '',
        )['CMAKE_PLATFORM_NO_VERSIONED_SONAME'],
        'ON',
      );
    });

    test('Windows arm64 builds the baseline CPU variant first', () {
      final defines = hook.computeDefines(OS.windows, Architecture.arm64, '');
      expect(defines['GGML_BACKEND_DL'], 'ON');
      expect(defines, isNot(contains('GGML_CPU_ALL_VARIANTS')));
      expect(defines['GGML_CPU_ARM_ARCH'], 'armv8-a');
      expect(hook.windowsArm64CpuVariants, {
        'armv8.0': 'armv8-a',
        'armv8.2-dotprod': 'armv8.2-a+dotprod',
      });
    });

    test('other targets keep one static fllama library', () {
      for (final (os, arch, variant) in [
        (OS.macOS, Architecture.arm64, ''),
        (OS.iOS, Architecture.arm64, 'iphoneos'),
        (OS.android, Architecture.arm64, ''),
        (OS.linux, Architecture.arm64, ''),
      ]) {
        final defines = hook.computeDefines(os, arch, variant);
        expect(defines['BUILD_SHARED_LIBS'], 'OFF', reason: os.name);
        expect(defines, isNot(contains('GGML_BACKEND_DL')), reason: os.name);
      }
    });

    test('Windows never sets the unused LLAMA_VULKAN name', () {
      for (final arch in [Architecture.x64, Architecture.arm64]) {
        expect(
          hook.computeDefines(OS.windows, arch, ''),
          isNot(contains('LLAMA_VULKAN')),
        );
      }
    });

    test('a Vulkan SDK enables the Vulkan backend', () {
      const sdk = hook.VulkanSdk(
        headerVersion: 357,
        defines: {'Vulkan_LIBRARY': 'vulkan-1.lib'},
      );
      final defines = hook.computeDefines(
        OS.windows,
        Architecture.x64,
        '',
        vulkan: sdk,
      );
      expect(defines['GGML_VULKAN'], 'ON');
      expect(defines['Vulkan_LIBRARY'], 'vulkan-1.lib');
      expect(
        hook.computeDefines(OS.macOS, Architecture.arm64, '', vulkan: sdk),
        isNot(contains('GGML_VULKAN')),
      );
    });

    test('reads VK_HEADER_VERSION', () {
      expect(
        hook.readVulkanHeaderVersion(
          '#define VK_HEADER_VERSION_COMPLETE x\n'
          '// comment\n'
          '#define VK_HEADER_VERSION 357\n',
        ),
        357,
      );
      expect(hook.readVulkanHeaderVersion('#define OTHER 1\n'), isNull);
    });

    test('code asset names', () {
      expect(hook.codeAssetName('fllama.dll'), 'fllama_io.dart');
      expect(hook.codeAssetName('libfllama.so'), 'fllama_io.dart');
      expect(hook.codeAssetName('ggml-base.dll'), 'native/ggml-base');
      expect(
        hook.codeAssetName('ggml-cpu-armv8.2-dotprod.dll'),
        'native/ggml-cpu-armv8.2-dotprod',
      );
      expect(hook.codeAssetName('libggml-vulkan.so'), 'native/libggml-vulkan');
    });

    test('reads the GPU pack list that CMake writes', () {
      expect(hook.parseGpuPackFiles('[]'), isEmpty);
      final files = hook.parseGpuPackFiles(
        '[{"pack":"vulkan","name":"ggml-vulkan.dll","sha256":"ab12",'
        '"url":"https://example.com/windows-x64-ggml-vulkan.dll.gz"}]',
      );
      expect(files, hasLength(1));
      expect(files.single.pack, 'vulkan');
      expect(files.single.name, 'ggml-vulkan.dll');
      expect(files.single.sha256, 'ab12');
      expect(
        files.single.url,
        'https://example.com/windows-x64-ggml-vulkan.dll.gz',
      );
    });

    test('only a release build makes ggml-vulkan a GPU pack (ADR 005 D7)', () {
      const sdk = hook.VulkanSdk(headerVersion: 357);
      const url =
          'https://github.com/Telosnex/fllama/releases/download/native-0123456789abcdef/windows-x64-ggml-vulkan.dll.gz';
      expect(
        hook.computeDefines(OS.windows, Architecture.x64, '', vulkan: sdk),
        isNot(contains('FLLAMA_GPU_PACK_VULKAN_URL')),
      );
      expect(
        hook.computeDefines(
          OS.windows,
          Architecture.x64,
          '',
          vulkan: sdk,
          vulkanPackUrl: url,
        )['FLLAMA_GPU_PACK_VULKAN_URL'],
        url,
      );
      // No Vulkan backend, no pack.
      expect(
        hook.computeDefines(
          OS.windows,
          Architecture.x64,
          '',
          vulkanPackUrl: url,
        ),
        isNot(contains('FLLAMA_GPU_PACK_VULKAN_URL')),
      );
    });

    test('library file names', () {
      expect(
        hook.sharedLibraryFileName(OS.windows, 'ggml-vulkan'),
        'ggml-vulkan.dll',
      );
      expect(
        hook.sharedLibraryFileName(OS.linux, 'ggml-vulkan'),
        'libggml-vulkan.so',
      );
    });
  });
}
