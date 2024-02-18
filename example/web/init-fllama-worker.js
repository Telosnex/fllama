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
  return new Promise(async (resolve, reject) =>  {
    const messageId = Math.random().toString(36).substring(2);
    fllamaMessageIdToResolve.set(messageId, resolve);
    fllamaMessageIdToReject.set(messageId, reject);

    let blobFailed = false;
    if (request.modelPath.startsWith('blob:')) {
      // Handle the blob URL
      console.log('[fllamaInferenceAsyncJs] Detected blob URL, processing it.', request.modelPath);
      await fetch(request.modelPath)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          console.log("[fllamaInferenceAsyncJs] loaded blob arrayBuffer", arrayBuffer.byteLength, arrayBuffer.slice(0, 10));
          request = Object.assign({}, request, { modelArrayBuffer: arrayBuffer });
        })
        .catch(error => {
          blobFailed = true;
          console.error('[fllamaInferenceAsyncJs] Error fetching blob:', error);
        });
    } else {
      // If not a blob URL, proceed normally
    }
    if (blobFailed) {
      reject(new Error('Failed to fetch blob model. Anonymous error during fetch(), the model is likely too large for the browser fetch() API'));
      cleanup(messageId);
      return;
    }
    runLlamaWasm(request.modelPath, request, callback, messageId);
    console.log('[fllamaInferenceAsyncJs] posted message', request);
  });
}

window.fllamaInferenceAsyncJs = fllamaInferenceAsyncJs;