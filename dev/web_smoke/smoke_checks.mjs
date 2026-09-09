// Hardware-independent correctness checks; throughput is an opt-in benchmark.
export function smokeOptions(args = process.argv, env = process.env) {
  function numberOption(flag, variable, fallback, { integer = false, min = 0 } = {}) {
    const prefix = `${flag}=`;
    const inline = args.find((arg) => arg.startsWith(prefix));
    const index = args.indexOf(flag);
    const raw = inline ? inline.slice(prefix.length)
      : index !== -1 ? args[index + 1] : env[variable] ?? fallback;
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value) || value < min || (integer && !Number.isInteger(value))) {
      throw new Error(`Invalid ${flag}: ${raw}`);
    }
    return value;
  }
  return {
    timeoutMs: numberOption('--timeout-ms', 'FLLAMA_SMOKE_TIMEOUT_MS', 180000, { integer: true, min: 1 }),
    minTokensPerSecond: numberOption('--min-tokens-per-second', 'FLLAMA_SMOKE_MIN_TOKENS_PER_SECOND', 0),
    numGpuLayers: numberOption('--gpu-layers', 'FLLAMA_SMOKE_NUM_GPU_LAYERS', 99999, { integer: true }),
    noThinking: args.includes('--no-think') || env.FLLAMA_SMOKE_NO_THINK === '1',
  };
}

export function checkSmokeResult(result, {
  timeoutMs = 180000,
  minTokensPerSecond = 0,
  expectRegex = '',
  expectContentRegex = '',
} = {}) {
  if (!result.done) throw new Error(`Inference did not complete within ${timeoutMs}ms`);
  if (!result.finalTextLength) throw new Error('Inference completed with empty output');
  if (result.chunks?.some((chunk) => chunk.type === 'json-parse-error')) {
    throw new Error('Inference returned invalid JSON');
  }
  if (result.concurrent && result.concurrentRequests > 1 && result.interleavingTransitions <= 0) {
    throw new Error('Concurrent inference completed without interleaved deltas');
  }
  if (expectRegex) {
    const text = result.finalContent || result.finalText || '';
    if (!new RegExp(expectRegex, 'i').test(text)) {
      throw new Error(`Expected ${JSON.stringify(text)} to match /${expectRegex}/i`);
    }
  }
  if (expectContentRegex) {
    const content = result.finalContent || '';
    if (!new RegExp(expectContentRegex, 'i').test(content.trim())) {
      throw new Error(`Expected final content ${JSON.stringify(content)} to match /${expectContentRegex}/i`);
    }
  }
  if (minTokensPerSecond > 0) {
    const speed = result.finalTimings?.predicted_per_second;
    const aggregate = speed * (result.concurrent ? result.concurrentRequests : 1);
    if (!Number.isFinite(aggregate) || aggregate < minTokensPerSecond) {
      throw new Error(`Inference speed ${aggregate} tok/s is below ${minTokensPerSecond} tok/s`);
    }
  }
}
