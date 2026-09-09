param(
  [switch]$RequireNuGet
)

$ErrorActionPreference = 'Stop'

# Codemagic starts every YAML script in a fresh PowerShell process and may
# reconstruct PATH even when another variable written to CM_ENV survives.
# Resolve the installed executable and prepend it in every step that can run a
# Dart/Flutter native-assets build hook.
$cmakeCandidates = @(
  'C:\Program Files\CMake\bin\cmake.exe',
  'C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe',
  'C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'
)
$cmakeExe = $cmakeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $cmakeExe) {
  throw "Modern CMake not found. Checked: $($cmakeCandidates -join ', ')"
}
$cmakeBin = Split-Path -Parent $cmakeExe
$env:PATH = "$cmakeBin;$env:DOTNET_PATH;$env:PATH"

$resolvedCmake = (Get-Command cmake -ErrorAction Stop).Source
if ($resolvedCmake -ne $cmakeExe) {
  throw "Expected CMake '$cmakeExe', but PATH resolved '$resolvedCmake'."
}
& $cmakeExe --version
if ($LASTEXITCODE -ne 0) {
  throw "CMake failed with exit code $LASTEXITCODE."
}

$nugetExe = Join-Path $env:DOTNET_PATH 'nuget.exe'
$env:NUGET_EXE = $nugetExe
if ($RequireNuGet -and -not (Test-Path $nugetExe)) {
  throw "NuGet not found at '$nugetExe'."
}

Write-Host "CMake: $cmakeExe"
Write-Host "NuGet: $nugetExe"
