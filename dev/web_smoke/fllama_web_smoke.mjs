#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const exampleDir = path.join(repoRoot, 'example');
const defaultModel = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  'Downloads/qwens/Qwen3.5-0.8B-Q4_K_M.gguf',
);

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

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.stdio ?? 'inherit',
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited code=${code} signal=${signal}`));
    });
  });
}

function spawnServer() {
  const child = spawn('node', ['web/server.js'], {
    cwd: exampleDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[server] ${chunk}`));
  return child;
}

async function waitForHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? lastError}`);
}

const packageAssetDir = path.join(exampleDir, 'build', 'web', 'assets', 'packages', 'fllama', 'assets', 'web');

async function resetPackageWebAssets() {
  await rm(path.join(packageAssetDir, 'wllama'), { recursive: true, force: true });
  await mkdir(path.join(packageAssetDir, 'wllama'), { recursive: true });
}

async function overlayCurrentWorkingTreeAssets() {
  await resetPackageWebAssets();
  await cp(
    path.join(repoRoot, 'assets', 'web', 'fllama_web_init.js'),
    path.join(packageAssetDir, 'fllama_web_init.js'),
  );
  await cp(
    path.join(repoRoot, 'assets', 'web', 'wllama'),
    path.join(packageAssetDir, 'wllama'),
    { recursive: true },
  );
}

async function writeGitFile(ref, sourcePath, destPath) {
  await mkdir(path.dirname(destPath), { recursive: true });
  const bytes = execFileSync('git', ['show', `${ref}:${sourcePath}`], {
    cwd: repoRoot,
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  });
  await writeFile(destPath, bytes);
}

async function overlayLegacyReeseAssets(ref) {
  await resetPackageWebAssets();
  const files = [
    'assets/web/fllama_web_init.js',
    'assets/web/wllama/index.js',
    'assets/web/wllama/jspi-single-thread/wllama.js',
    'assets/web/wllama/jspi-single-thread/wllama.wasm',
    'assets/web/wllama/asyncify-single-thread/wllama.js',
    'assets/web/wllama/asyncify-single-thread/wllama.wasm',
    'assets/web/wllama/asyncify-multi-thread/wllama.js',
    'assets/web/wllama/asyncify-multi-thread/wllama.wasm',
  ];
  for (const file of files) {
    await writeGitFile(ref, file, path.join(packageAssetDir, path.relative('assets/web', file)));
  }
}

const modelPath = path.resolve(argValue('--model', process.env.FLLAMA_SMOKE_MODEL || defaultModel));
const prompt = argValue('--prompt', process.env.FLLAMA_SMOKE_PROMPT || 'Write a long poem.');
const maxTokens = Number(argValue('--max-tokens', process.env.FLLAMA_SMOKE_MAX_TOKENS || '100'));
const contextSize = Number(argValue('--ctx', process.env.FLLAMA_SMOKE_CTX || '4096'));
const url = argValue('--url', process.env.FLLAMA_SMOKE_URL || 'http://localhost:8080');
const shouldBuild = hasFlag('--build') || process.env.FLLAMA_SMOKE_BUILD === '1';
const headless = process.env.HEADLESS !== '0';
const channel = process.env.PLAYWRIGHT_CHROME_CHANNEL || 'chrome';
const runtime = argValue('--runtime', process.env.FLLAMA_SMOKE_RUNTIME || 'current');
const legacyRef = argValue('--legacy-ref', process.env.FLLAMA_SMOKE_LEGACY_REF || 'HEAD');
const outputDir = path.resolve(argValue('--out', process.env.FLLAMA_SMOKE_OUT || path.join(repoRoot, 'tmp', `web_smoke_${runtime}`)));

if (!existsSync(modelPath)) {
  console.error(`Model does not exist: ${modelPath}`);
  process.exit(2);
}

if (shouldBuild) {
  await run('flutter', ['build', 'web', '--debug'], { cwd: exampleDir });
} else if (!existsSync(path.join(exampleDir, 'build', 'web', 'index.html'))) {
  console.error('example/build/web/index.html not found. Run with --build first, or run flutter build web --debug in example/.');
  process.exit(2);
}

await mkdir(outputDir, { recursive: true });

if (!existsSync(packageAssetDir)) {
  console.error(`Package asset directory not found: ${packageAssetDir}`);
  console.error('Build the example first with --build or flutter build web --debug.');
  process.exit(2);
}

switch (runtime) {
  case 'current':
  case 'working':
  case 'ngxson':
    await overlayCurrentWorkingTreeAssets();
    break;
  case 'legacy':
  case 'reese':
  case 'reeselevine':
    await overlayLegacyReeseAssets(legacyRef);
    break;
  default:
    console.error(`Unknown --runtime=${runtime}. Use current or legacy.`);
    process.exit(2);
}

console.log(`Using runtime=${runtime}${runtime === 'legacy' || runtime === 'reese' || runtime === 'reeselevine' ? ` ref=${legacyRef}` : ''}`);

const server = spawnServer();
let browser;
try {
  await waitForHttp(url);

  try {
    browser = await chromium.launch({
      channel,
      headless,
      args: [
        '--enable-unsafe-webgpu',
        '--enable-features=SharedArrayBuffer',
      ],
    });
  } catch (error) {
    console.warn(`Failed to launch channel=${channel}; falling back to bundled chromium: ${error.message}`);
    browser = await chromium.launch({
      headless,
      args: [
        '--enable-unsafe-webgpu',
        '--enable-features=SharedArrayBuffer',
      ],
    });
  }

  const page = await browser.newPage();
  const logs = [];
  page.on('console', (message) => {
    const text = `[${message.type()}] ${message.text()}`;
    logs.push(text);
    console.log(text);
  });
  page.on('pageerror', (error) => {
    const text = `[pageerror] ${error.stack || error.message}`;
    logs.push(text);
    console.error(text);
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  // Flutter web may do a service-worker/bootstrap navigation shortly after the
  // initial load. Let that settle before starting the file picker so the
  // evaluate() context is not destroyed mid-call.
  await page.waitForTimeout(2000);
  await page.waitForFunction(() => typeof window.fllamaChatWebJs === 'function', null, { timeout: 60000 });
  await page.waitForFunction(() => typeof window.fllamaWebPickModelJs === 'function', null, { timeout: 60000 });

  let modelToken = '';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const chooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
      const pickPromise = page
        .evaluate(() => window.fllamaWebPickModelJs())
        .catch((error) => ({ __fllamaSmokeError: String(error?.message || error) }));
      const chooser = await chooserPromise;
      await chooser.setFiles(modelPath);
      const picked = await pickPromise;
      if (picked && typeof picked === 'object' && picked.__fllamaSmokeError) {
        throw new Error(picked.__fllamaSmokeError);
      }
      modelToken = picked;
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      console.warn(`Model picker attempt ${attempt} failed; retrying: ${error.message}`);
      await page.waitForLoadState('load', { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
  }
  if (!modelToken || !String(modelToken).startsWith('fllama-local-file://')) {
    throw new Error(`Unexpected model token: ${modelToken}`);
  }
  console.log(`Picked model token: ${modelToken}`);

  const result = await page.evaluate(async ({ modelPath, prompt, maxTokens, contextSize }) => {
    const messages = [{ role: 'user', content: prompt }];
    const request = {
      openAiRequestJsonString: JSON.stringify({
        messages,
        tools: [],
        temperature: 0.1,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 1.1,
      }),
      messagesAsJsonString: JSON.stringify(messages),
      toolsAsJsonString: '[]',
      maxTokens,
      modelPath,
      contextSize,
      temperature: 0.1,
      penaltyFrequency: 0,
      penaltyRepeat: 1.1,
      topP: 1,
      numThreads: Math.max(1, Math.min(4, navigator.hardwareConcurrency || 4)),
      numGpuLayers: 99999,
    };

    const chunks = [];
    let finalText = '';
    let finalTimings = null;
    const startedAt = performance.now();
    const requestId = await window.fllamaChatWebJs(
      request,
      (downloadProgress, loadProgress) => {
        chunks.push({ type: 'load', downloadProgress, loadProgress, atMs: performance.now() - startedAt });
      },
      (text, json, done) => {
        finalText = text || finalText;
        if (json) {
          try {
            const parsed = JSON.parse(json);
            const chunks = Array.isArray(parsed) ? parsed : [parsed];
            for (const chunk of chunks) {
              if (chunk?.timings) finalTimings = chunk.timings;
            }
          } catch (error) {
            chunks.push({ type: 'json-parse-error', json, error: String(error) });
          }
        }
        chunks.push({ type: 'inference', done, json, textLength: (text || '').length, atMs: performance.now() - startedAt });
      },
    );

    const deadline = performance.now() + 180000;
    while (performance.now() < deadline) {
      if (chunks.some((chunk) => chunk.type === 'inference' && chunk.done)) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const done = chunks.some((chunk) => chunk.type === 'inference' && chunk.done);
    return {
      requestId,
      done,
      durationMs: performance.now() - startedAt,
      chunkCount: chunks.filter((chunk) => chunk.type === 'inference' && chunk.json).length,
      finalTextLength: finalText.length,
      finalTextPrefix: finalText.slice(0, 500),
      finalTimings,
      chunks,
      support: {
        hasWebGpu: Boolean(navigator.gpu),
        crossOriginIsolated: Boolean(globalThis.crossOriginIsolated),
        hardwareConcurrency: navigator.hardwareConcurrency,
      },
    };
  }, { modelPath: modelToken, prompt, maxTokens, contextSize });

  await writeFile(path.join(outputDir, 'console.log'), logs.join('\n') + '\n');
  await writeFile(path.join(outputDir, 'result.json'), JSON.stringify(result, null, 2));

  console.log('\n=== fllama web smoke result ===');
  console.log(JSON.stringify({
    requestId: result.requestId,
    done: result.done,
    durationMs: result.durationMs,
    chunkCount: result.chunkCount,
    finalTextLength: result.finalTextLength,
    finalTimings: result.finalTimings,
    runtime,
    legacyRef: runtime === 'legacy' || runtime === 'reese' || runtime === 'reeselevine' ? legacyRef : undefined,
    support: result.support,
    outputDir,
  }, null, 2));

  if (!result.done) throw new Error('Inference did not complete before timeout');
  if (!result.finalTextLength) throw new Error('Inference completed with empty output');
  if (result.finalTimings?.predicted_per_second && result.finalTimings.predicted_per_second < 20) {
    throw new Error(`Very slow inference: ${result.finalTimings.predicted_per_second} tok/s`);
  }
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
