/// Runs before each native build of the kiln release workflow, with
/// `dart tool/kiln/prepare.dart` (`dart run` would first run the build hook,
/// which needs these tools):
///
/// - windows-x64, linux-x64: the pinned LunarG Vulkan SDK (ADR 004 §5).
///   hook/build.dart finds it in C:\VulkanSDK\<version> on Windows and in
///   the system directories on Linux, where distribution packages put it.
///   Ubuntu 22.04 packages are too old.
/// - windows-arm64: the ClangCL toolset, which hook/build.dart builds with.
/// - linux-arm64: clang. GCC 11 does not know -march=armv9.2-a+sme, which two
///   CPU variants need (cmakeCompilers in hook/build.dart).
///
/// It sets KILN_TOOLCHAIN or KILN_TOOLCHAIN_EXTRA for the toolchain
/// description.
library;

import 'dart:io';

const _vulkanSdk = '1.4.357.0';
const _vulkanSdkWindowsSha256 =
    '81f474711e9042f4cd22b31b2f7a8870db2e428b21586fb43dd80150be97310d';
const _vulkanSdkLinuxSha256 =
    '0f09bf6a0625e346bf004be70b92907e934a4c76606b323441b2baf3a5a0e66d';

Future<void> main() async {
  final target = Platform.environment['TARGET']!;
  switch (target) {
    case 'windows-x64':
      await _bash('''
exe="\$RUNNER_TEMP/vulkansdk.exe"
curl -sSfLo "\$exe" "https://sdk.lunarg.com/sdk/download/$_vulkanSdk/windows/vulkansdk-windows-X64-$_vulkanSdk.exe"
echo "$_vulkanSdkWindowsSha256  \$exe" | sha256sum -c -
"\$exe" --accept-licenses --default-answer --confirm-command install
test -f "/c/VulkanSDK/$_vulkanSdk/Include/vulkan/vulkan_core.h"
''');
      _env('KILN_TOOLCHAIN_EXTRA', 'MSVC, Vulkan SDK $_vulkanSdk');
    case 'linux-x64':
      await _bash('''
tar="\$RUNNER_TEMP/vulkansdk.tar.xz"
curl -sSfLo "\$tar" "https://sdk.lunarg.com/sdk/download/$_vulkanSdk/linux/vulkansdk-linux-x86_64-$_vulkanSdk.tar.xz"
echo "$_vulkanSdkLinuxSha256  \$tar" | sha256sum -c -
tar -xJf "\$tar" -C "\$RUNNER_TEMP"
sdk="\$RUNNER_TEMP/$_vulkanSdk/x86_64"
sudo cp -r "\$sdk/include/vulkan" "\$sdk/include/vk_video" "\$sdk/include/spirv" /usr/include/
sudo mkdir -p /usr/share/cmake
sudo cp -r "\$sdk/share/cmake/SPIRV-Headers" /usr/share/cmake/
sudo cp -P "\$sdk"/lib/VulkanLoader/lib/libvulkan.so* /usr/lib/x86_64-linux-gnu/
sudo cp "\$sdk/bin/glslc" /usr/local/bin/
sudo ldconfig
ldd /usr/local/bin/glslc
glslc --version | sed -n 1p
''');
      _env('KILN_TOOLCHAIN_EXTRA', 'Vulkan SDK $_vulkanSdk');
    case 'windows-arm64':
      await _run('pwsh', [
        '-NoProfile',
        '-Command',
        r'''
$ErrorActionPreference = 'Stop'
$installer = 'C:\Program Files (x86)\Microsoft Visual Studio\Installer'
$vs = & "$installer\vswhere.exe" -latest -products * -property installationPath
if (-not (Test-Path "$vs\VC\Tools\Llvm")) {
  Write-Host "Adding the ClangCL components to $vs"
  $p = Start-Process -Wait -PassThru "$installer\vs_installer.exe" -ArgumentList @(
    'modify', '--installPath', "`"$vs`"",
    '--add', 'Microsoft.VisualStudio.Component.VC.Llvm.Clang',
    '--add', 'Microsoft.VisualStudio.Component.VC.Llvm.ClangToolset',
    '--quiet', '--norestart', '--nocache')
  if ($p.ExitCode -ne 0) { throw "vs_installer exit code $($p.ExitCode)" }
}
Get-ChildItem -Recurse -Filter clang-cl.exe "$vs\VC\Tools\Llvm" | Select-Object -First 3 FullName
''',
      ]);
      _env('KILN_TOOLCHAIN_EXTRA', 'ClangCL');
    case 'linux-arm64':
      await _bash('''
command -v clang++ || { sudo apt-get update -qq && sudo apt-get install -y -qq clang; }
''');
      final clang = await Process.run('clang', ['--version']);
      _env('KILN_TOOLCHAIN', '${clang.stdout}'.split('\n').first.trim());
  }
}

void _env(String name, String value) {
  stdout.writeln('$name=$value');
  File(
    Platform.environment['GITHUB_ENV']!,
  ).writeAsStringSync('$name=$value\n', mode: FileMode.append);
}

// On Windows, bash on PATH can be the WSL launcher; use Git Bash.
Future<void> _bash(String script) => _run(
  Platform.isWindows ? r'C:\Program Files\Git\bin\bash.exe' : 'bash',
  ['-euo', 'pipefail', '-c', script],
);

Future<void> _run(String executable, List<String> args) async {
  final process = await Process.start(
    executable,
    args,
    mode: ProcessStartMode.inheritStdio,
  );
  final code = await process.exitCode;
  if (code != 0) {
    stderr.writeln('prepare: $executable exited with $code');
    exit(code);
  }
}
