import assert from 'node:assert/strict';
import test from 'node:test';
import { checkSmokeResult, smokeOptions } from './smoke_checks.mjs';

const red = {
  done: true,
  finalTextLength: 3,
  finalContent: 'red',
  finalTimings: { predicted_per_second: 5.915183439398348 },
};

test('slow but correct CPU inference passes without a benchmark limit', () => {
  assert.doesNotThrow(() => checkSmokeResult(red, { expectContentRegex: '^red$' }));
});
test('benchmark speed floor is still enforced when explicitly requested', () => {
  assert.throws(() => checkSmokeResult(red, { minTokensPerSecond: 20 }), /below 20/);
  assert.doesNotThrow(() => checkSmokeResult(red, { minTokensPerSecond: 5 }));
});
test('timeout, empty output and wrong color still fail', () => {
  assert.throws(() => checkSmokeResult({ ...red, done: false }, { timeoutMs: 600000 }), /600000ms/);
  assert.throws(() => checkSmokeResult({ ...red, finalTextLength: 0 }), /empty output/);
  assert.throws(() => checkSmokeResult({ ...red, finalContent: 'blue' }, { expectContentRegex: '^red$' }), /match/);
});
test('reasoning containing red cannot substitute for the answer', () => {
  assert.throws(() => checkSmokeResult({ ...red, finalContent: '', finalText: 'It looks red' }, {
    expectContentRegex: '^red$',
  }), /final content/);
});
test('malformed JSON fails even when there is text', () => {
  assert.throws(() => checkSmokeResult({ ...red, chunks: [{ type: 'json-parse-error' }] }), /invalid JSON/);
});
test('default timeout remains bounded and benchmarking is opt-in', () => {
  assert.deepEqual(smokeOptions([], {}), {
    timeoutMs: 180000, minTokensPerSecond: 0, numGpuLayers: 99999, noThinking: false,
  });
});
test('CI overrides reach timeout, CPU mode and thinking settings', () => {
  assert.deepEqual(smokeOptions([], {
    FLLAMA_SMOKE_TIMEOUT_MS: '600000',
    FLLAMA_SMOKE_NUM_GPU_LAYERS: '0',
    FLLAMA_SMOKE_NO_THINK: '1',
  }), { timeoutMs: 600000, minTokensPerSecond: 0, numGpuLayers: 0, noThinking: true });
});
test('CLI settings override environment settings', () => {
  assert.deepEqual(smokeOptions(['--timeout-ms=1000', '--min-tokens-per-second', '20', '--gpu-layers=0', '--no-think'], {
    FLLAMA_SMOKE_TIMEOUT_MS: '600000',
  }), { timeoutMs: 1000, minTokensPerSecond: 20, numGpuLayers: 0, noThinking: true });
});
test('invalid limits cannot silently disable the deadline', () => {
  for (const value of ['', 'NaN', 'Infinity', '0', '-1', '0.5']) {
    assert.throws(() => smokeOptions([`--timeout-ms=${value}`], {}), /Invalid/);
  }
  assert.throws(() => smokeOptions(['--min-tokens-per-second=-1'], {}), /Invalid/);
});
test('an error on the last callback fails the check', () => {
  assert.throws(() => checkSmokeResult({ ...red, error: { type: 'backend', message: 'x' } }), /Inference failed/);
});
test('an expected error type passes only with that type and a message', () => {
  const failed = { done: true, finalTextLength: 0, error: { type: 'model_load', message: 'bad magic' } };
  assert.doesNotThrow(() => checkSmokeResult(failed, { expectErrorType: 'model_load' }));
  assert.throws(() => checkSmokeResult(failed, { expectErrorType: 'invalid_request' }), /Expected a invalid_request/);
  assert.throws(() => checkSmokeResult(red, { expectErrorType: 'model_load' }), /got null/);
  assert.throws(() => checkSmokeResult({ ...failed, error: { type: 'model_load' } }, { expectErrorType: 'model_load' }), /no message/);
});
test('concurrent requests must interleave only with more than one slot', () => {
  const serial = { ...red, concurrent: true, concurrentRequests: 3, interleavingTransitions: 0 };
  assert.doesNotThrow(() => checkSmokeResult(serial, { nParallel: 1 }));
  assert.doesNotThrow(() => checkSmokeResult(serial, {}));
  assert.throws(() => checkSmokeResult(serial, { nParallel: 2 }), /interleaved/);
});
