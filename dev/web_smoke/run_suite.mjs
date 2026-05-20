#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outputRoot = path.resolve(repoRoot, 'tmp', 'web_smoke_suite');

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function runSmoke(test, extraArgs = []) {
  return new Promise((resolve) => {
    const outDir = path.join(outputRoot, test.id);
    const args = [
      'fllama_web_smoke.mjs',
      '--runtime=current',
      '--ctx=4096',
      `--out=${outDir}`,
      ...extraArgs,
    ];
    const startedAt = Date.now();
    const child = spawn('node', args, {
      cwd: __dirname,
      env: { ...process.env, HEADLESS: process.env.HEADLESS ?? '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      process.stdout.write(`[${test.id}] ${chunk}`);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      process.stderr.write(`[${test.id}] ${chunk}`);
    });
    child.on('exit', async (code, signal) => {
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, 'runner.stdout.log'), stdout);
      await writeFile(path.join(outDir, 'runner.stderr.log'), stderr);

      let result = null;
      const resultPath = path.join(outDir, 'result.json');
      if (existsSync(resultPath)) {
        try {
          result = JSON.parse(await readFile(resultPath, 'utf8'));
        } catch (error) {
          stderr += `\nFailed to parse ${resultPath}: ${error.message}`;
        }
      }
      resolve({
        id: test.id,
        description: test.description,
        ok: code === 0,
        code,
        signal,
        durationMs: Date.now() - startedAt,
        outDir,
        result,
      });
    });
  });
}

const tests = [
  {
    id: 'bare_hi',
    description: 'bare model asked to respond to hi',
    args: ['--prompt=hi', '--max-tokens=100'],
  },
  {
    id: 'concurrent_hi',
    description: 'two simultaneous bare-model requests; result records delta interleaving',
    args: [
      '--prompt=Respond with a short friendly greeting.',
      '--max-tokens=100',
      '--concurrent=2',
    ],
  },
  {
    id: 'mmproj_hi',
    description: 'bare model + mmproj asked to respond to hi',
    args: ['--prompt=hi', '--max-tokens=100', '--mmproj=default'],
  },
  {
    id: 'image_title',
    description: 'model + mmproj + fllama_header.png asks for image title',
    args: [
      '--prompt=Do not think. Respond with one word only, the title in the image.',
      '--temperature=0',
      '--max-tokens=128',
      '--mmproj=default',
      '--image=default',
      '--expect-regex=fll+ama',
    ],
  },
  {
    id: 'multiimage_title',
    description: 'model + mmproj + apple/orange images asks for both words',
    args: [
      '--prompt=Two images are attached. Respond with exactly the two words shown, in order, separated by one space.',
      '--temperature=0',
      '--max-tokens=128',
      '--mmproj=default',
      '--images=default',
      '--expect-regex=apple orange',
    ],
  },
];

const selectedIds = (argValue('--only', process.env.FLLAMA_SMOKE_ONLY || '') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const selected = selectedIds.length > 0
  ? tests.filter((test) => selectedIds.includes(test.id))
  : tests;

if (selected.length === 0) {
  console.error(`No smoke tests selected. Known ids: ${tests.map((test) => test.id).join(', ')}`);
  process.exit(2);
}

await mkdir(outputRoot, { recursive: true });

if (hasFlag('--build')) {
  await new Promise((resolve, reject) => {
    const child = spawn('flutter', ['build', 'web', '--debug'], {
      cwd: path.join(repoRoot, 'example'),
      stdio: 'inherit',
    });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`flutter build exited ${code}`)));
    child.on('error', reject);
  });
}

const summary = [];
for (const test of selected) {
  console.log(`\n=== ${test.id}: ${test.description} ===`);
  // Run sequentially because every smoke test owns localhost:8080 and overlays
  // example/build/web package assets.
  // eslint-disable-next-line no-await-in-loop
  summary.push(await runSmoke(test, test.args));
}

const compact = summary.map((item) => {
  const timings = item.result?.finalTimings ?? {};
  return {
    id: item.id,
    ok: item.ok,
    durationMs: item.durationMs,
    finalTextLength: item.result?.finalTextLength,
    predictedPerSecond: timings.predicted_per_second,
    promptPerSecond: timings.prompt_per_second,
    outDir: item.outDir,
  };
});

await writeFile(path.join(outputRoot, 'summary.json'), JSON.stringify(summary, null, 2));
await writeFile(path.join(outputRoot, 'summary.compact.json'), JSON.stringify(compact, null, 2));

console.log('\n=== web smoke suite summary ===');
for (const item of compact) {
  const tok = item.predictedPerSecond == null ? 'n/a' : item.predictedPerSecond.toFixed(2);
  console.log(`${item.ok ? '✅' : '❌'} ${item.id}: ${tok} tok/s, ${item.finalTextLength ?? 0} chars`);
}
console.log(`\nWrote ${path.join(outputRoot, 'summary.json')}`);

if (summary.some((item) => !item.ok)) {
  process.exit(1);
}
