let cachedFllamaModelPath = null;
let cachedFllamaModelPromise = null;
import { runLlamaWasm } from "./llama-app.js";
import './llama-worker.js';

const fllamaWorker = new Worker(new URL('llama-worker.js', import.meta.url), { type: 'module' });
const fllamaMessageIdToResolve = new Map();
const fllamaMessageIdToReject = new Map();

fllamaWorker.onmessage = function (e) {
  const { messageId, action, transcript, error } = e.data;
  if (action === "inferenceResult" && fllamaMessageIdToResolve.has(messageId)) {
    fllamaMessageIdToResolve.get(messageId)(transcript);
    cleanup(messageId);
  } else if (action === "error" && fllamaMessageIdToReject.has(messageId)) {
    fllamaMessageIdToReject.get(messageId)(new Error(error));
    cleanup(messageId);
  } else {
    console.error('[fllamaInferenceAsyncJs] unexpected message', e.data);
  }
};

function cleanup(messageId) {
  fllamaMessageIdToResolve.delete(messageId);
  fllamaMessageIdToReject.delete(messageId);
}

function fllamaInferenceAsyncJs(request, callback) {
  console.log('[fllamaInferenceAsyncJs] hello!', request);
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(2);
    fllamaMessageIdToResolve.set(messageId, resolve);
    fllamaMessageIdToReject.set(messageId, reject);
    runLlamaWasm(request.modelPath, request, callback, messageId);
    console.log('[fllamaInferenceAsyncJs] posted message', request);
  });
}

window.fllamaInferenceAsyncJs = fllamaInferenceAsyncJs;