import 'package:test/test.dart';

import '../hook/cache_key.dart';

void main() {
  String key({
    String os = 'macos',
    String arch = 'arm64',
    String targetVariant = '',
    String? toolset,
    Map<String, String> defines = const {'CMAKE_BUILD_TYPE': 'Release'},
    Map<String, String> extra = const {},
    String sourceKey = 'a',
  }) => computeBuildKey(
    os: os,
    arch: arch,
    targetVariant: targetVariant,
    toolset: toolset,
    defines: defines,
    extra: extra,
    sourceKey: sourceKey,
  );

  test('changes with the source key (ADR 005 D4)', () {
    expect(key(sourceKey: 'a'), key(sourceKey: 'a'));
    expect(key(sourceKey: 'a'), isNot(key(sourceKey: 'b')));
  });

  test('ignores the order of defines', () {
    expect(
      key(defines: const {'A': '1', 'B': '2'}),
      key(defines: const {'B': '2', 'A': '1'}),
    );
    expect(
      key(defines: const {'A': '1'}),
      isNot(key(defines: const {'A': '2'})),
    );
  });

  test('separates iOS device and simulator cache entries', () {
    expect(
      key(os: 'ios', targetVariant: 'iphoneos'),
      isNot(key(os: 'ios', targetVariant: 'iphonesimulator')),
    );
  });

  test('separates toolsets', () {
    expect(key(os: 'windows', toolset: 'ClangCL'), isNot(key(os: 'windows')));
  });

  test('changes with host toolchain inputs', () {
    expect(
      key(extra: const {'vulkan_header': '357'}),
      isNot(key(extra: const {'vulkan_header': '358'})),
    );
    expect(key(extra: const {}), key());
  });
}
