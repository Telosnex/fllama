"""Offline tests for the CUDA timing launcher and report (no CUDA needed).

Run: python3 -B -m unittest discover -s test -p cuda_timing_test.py
"""

from concurrent.futures import ThreadPoolExecutor
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("timings", ROOT / "scripts/summarize_cuda_timings.py")
TIMINGS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TIMINGS)


class CudaTimingTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="cuda timing ")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.compiler = self.root / "fake nvcc.py"
        self.compiler.write_text('''import pathlib, sys
csv = next(arg.split("=", 1)[1] for arg in sys.argv if arg.startswith("--time="))
pathlib.Path(csv).write_text("source file name , phase name , phase input files , phase output file , arch , tool, metric , unit\\nin.cu , cicc , in.cu , out.ptx , compute_80 , nvcc , 2000 , ms\\nin.cu , ptxas , out.ptx , out.cubin , sm_80 , nvcc , 500 , ms\\n")
sys.exit(3 if "--fail" in sys.argv else 0)
''')

    def launch(self, name, *extra):
        obj = self.root / "cache" / "key" / name
        result = subprocess.run([
            "cmake", "-P", str(ROOT / "src/cmake/time_cuda.cmake"), "--",
            sys.executable, str(self.compiler), "-o", str(obj), *extra,
        ], capture_output=True, text=True)
        return obj, result

    def test_parallel_objects_have_separate_reports(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(self.launch, [f"kernel {i}.cu.obj" for i in range(4)]))
        for obj, result in results:
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(Path(str(obj) + ".nvcc-wall-seconds").exists())
        report = TIMINGS.summarize(self.root / "cache", self.root / "report")
        self.assertIn("Objects with nvcc CSVs: **4**", report)
        self.assertIn("| cicc [compute_80] | 8.00 |", report)
        self.assertIn("| ptxas [sm_80] | 2.00 |", report)
        self.assertEqual(len(list((self.root / "report/raw").rglob("*.csv"))), 4)

    def test_failure_is_not_swallowed_and_retains_timings(self):
        obj, result = self.launch("failed.cu.obj", "--fail")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("CUDA compiler failed (3)", result.stderr)
        self.assertTrue(Path(str(obj) + ".nvcc-timing.csv").exists())
        self.assertTrue(Path(str(obj) + ".nvcc-wall-seconds").exists())

    def test_recompile_replaces_old_timings(self):
        obj, result = self.launch("repeat.cu.obj")
        self.assertEqual(result.returncode, 0, result.stderr)
        Path(str(obj) + ".nvcc-timing.csv").write_text("in.cu , old , in , out , sm_80 , nvcc , 999999 , ms\n")
        _, result = self.launch("repeat.cu.obj")
        self.assertEqual(result.returncode, 0, result.stderr)
        report = TIMINGS.summarize(self.root / "cache", self.root / "report")
        self.assertNotIn("| old", report)
        self.assertIn("| cicc [compute_80] | 2.00 |", report)

    def test_missing_cache_and_partial_csv_are_safe(self):
        report = TIMINGS.summarize(self.root / "missing", self.root / "empty-report")
        self.assertIn("Objects with nvcc CSVs: **0**", report)
        self.launch("partial.cu.obj")
        csv = next((self.root / "cache").rglob("*.csv"))
        with csv.open("a") as stream:
            stream.write("incomplete\nin.cu , ptxas , in , out , sm_80 , nvcc , , ms\n")
        ninja = self.root / "cache/key/.ninja_log"
        ninja.write_text("# ninja log v5\n0\t1000\t0\tggml-cuda.obj\thash\n")
        report = TIMINGS.summarize(self.root / "cache", self.root / "partial-report")
        self.assertIn("| cicc [compute_80] | 2.00 |", report)
        self.assertTrue((self.root / "partial-report/raw/key/.ninja_log").exists())

    def test_windows_toolchain_supports_ninja_and_visual_studio(self):
        toolkit = (self.root / "CUDA Toolkit").as_posix()
        for generator in ("Ninja", "Visual Studio 17 2022"):
            script = self.root / "toolchain-check.cmake"
            script.write_text(f'''set(CMAKE_GENERATOR "{generator}")
set(FLLAMA_CUDA_TOOLKIT_DIR "{toolkit}")
include("{(ROOT / 'src/cmake/windows-cuda.toolchain.cmake').as_posix()}")
if(CMAKE_GENERATOR STREQUAL "Ninja")
  if(NOT CMAKE_SYSTEM_PROCESSOR STREQUAL "AMD64")
    message(FATAL_ERROR "Ninja needs an explicit x64 processor for ggml CPU variants")
  endif()
  set(CMAKE_GENERATOR_PLATFORM_LWR "")
  set(CMAKE_OSX_ARCHITECTURES "")
  include("{(ROOT / 'src/llama.cpp/ggml/cmake/common.cmake').as_posix()}")
  ggml_get_system_arch()
  if(NOT GGML_SYSTEM_ARCH STREQUAL "x86")
    message(FATAL_ERROR "ggml must recognize Ninja as x86, not UNKNOWN")
  endif()
  if(DEFINED CMAKE_GENERATOR_TOOLSET OR NOT CMAKE_CUDA_COMPILER STREQUAL "{toolkit}/bin/nvcc.exe")
    message(FATAL_ERROR "Wrong Ninja compiler/toolset")
  endif()
elseif(NOT CMAKE_GENERATOR_TOOLSET STREQUAL "cuda={toolkit}")
  message(FATAL_ERROR "Wrong Visual Studio toolset")
endif()
''')
            result = subprocess.run(["cmake", "-P", str(script)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
