import { action } from "./fllama_wasm_actions.js";
import './fllama_wasm_main_worker.js';

function fllamaInferenceAsyncJs2(request, callback) {
    const fllamaWorker = new Worker(new URL('fllama_wasm_main_worker.js', import.meta.url), { type: 'module' });

    fllamaWorker.onmessage = function (e) {
        // console.log('[fllama_wasm_init.js] received message', e.data);
        switch (e.data.event) {
            case action.INITIALIZED:
                // console.log('[fllama_wasm_init.js] worker initialized. Requesting inference.');
                fllamaWorker.postMessage({ event: action.INFERENCE, ...request });
                break;
            case action.INFERENCE_CALLBACK:
                // console.log('[fllama_wasm_init.js] received inference callback', e.data);
                callback(e.data.response, e.data.isDone !== 0);
                break;
            default:
                // console.error('[fllama_wasm_init.js] unexpected message', e);
                break;
        }
    };

    // console.log('[fllama_wasm_init.js.fllamaInferenceAsyncJs2] hello!', request);
    return new Promise(async (resolve, reject) => {
        let blobFailed = false;
        if (request.modelPath.startsWith('blob:')) {
            // Handle the blob URL
            // console.log('[fllama_wasm_init.js.fllamaInferenceAsyncJs2] Detected blob URL, processing it.', request.modelPath);
            await fetch(request.modelPath)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                    console.log("[fllama_wasm_init.js.fllamaInferenceAsyncJs2] loaded blob arrayBuffer", arrayBuffer.byteLength, arrayBuffer.slice(0, 10));
                    request = Object.assign({}, request, { modelArrayBuffer: arrayBuffer });
                })
                .catch(error => {
                    console.error('[fllamaInferenceAsyncJs2] Error fetching blob:', error);
                });
        } else {
            // If not a blob URL, proceed normally
        }
        if (blobFailed) {
            // console.error('Failed to fetch blob model. Anonymous error during fetch(), the model is likely too large for the browser fetch() API');
            return;
        }
        const message = {
            event: action.LOAD,
            url: request.modelPath,
            modelSize: request.modelSize,
        };
        fllamaWorker.postMessage(message);
        // console.log('[fllama_wasm_init.js.fllamaInferenceAsyncJs2] posted message to main worker', message);
    });
}

window.fllamaInferenceAsyncJs2 = fllamaInferenceAsyncJs2;
let tokenizeWorker = null;
let lastModelPath = '';

async function fllamaTokenizeJs2(modelPath, input) {
    if (tokenizeWorker === null || lastModelPath !== modelPath) {
        lastModelPath = modelPath;
        tokenizeWorker = initializeTokenizeWorker(modelPath);
    }
    return tokenizeWorker.then(worker => tokenizeWithWorker(worker, input));
}

function initializeTokenizeWorker(modelPath) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('fllama_wasm_main_worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = function (e) {
            // console.log('[fllama_wasm_init.js.initializeTokenizeWorker] received message', e.data);
            if (e.data.event === action.INITIALIZED) {
                resolve(worker);
            }
        };

        worker.onerror = function (error) {
            // console.error('[fllama_wasm_init.js.initializeTokenizeWorker] Worker error:', error);
            reject(new Error('Worker error'));
        };

        let modelSize = -1;
        if (modelPath.startsWith('blob:')) {
            fetch(modelPath)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                    modelSize = arrayBuffer.byteLength;
                    sendMessage(worker, { event: action.LOAD, url: modelPath, modelSize: modelSize });
                })
                .catch(error => {
                    // console.error('[fllama_wasm_init.js.initializeTokenizeWorker] Error fetching blob:', error);
                    worker.terminate();
                    reject(new Error('Failed to load blob model'));
                });
        } else {
            sendMessage(worker, { event: action.LOAD, url: modelPath, modelSize: modelSize });
        }
    });
}

function sendMessage(worker, message) {
    worker.postMessage(message);
    // console.log('[fllama_wasm_init.js.sendMessage] posted message to worker', message);
}

function tokenizeWithWorker(worker, input) {
    return new Promise((resolve, reject) => {
        const handleMessage = function (e) {
            // console.log('[fllama_wasm_init.js.tokenizeWithWorker] received message', e.data);
            switch (e.data.event) {
                case action.TOKENIZE_CALLBACK:
                    worker.removeEventListener('message', handleMessage);
                    resolve(e.data.tokenCount);
                    break;
                default:
                    // console.error('[fllama_wasm_init.js.tokenizeWithWorker] unexpected message', e);
                    reject(new Error('Unexpected message'));
                    break;
            }
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage({ event: action.TOKENIZE, input });
    });
}

window.fllamaTokenizeJs2 = fllamaTokenizeJs2;