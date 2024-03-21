import { action } from "./fllama_wasm_actions.js";
import './fllama_wasm_main_worker.js';

let nextRequestId = 0;
let inferenceWorker = null;
let lastInferenceModelPath = '';
function fllamaInferenceJs(request, callback) {
    if (inferenceWorker === null || lastInferenceModelPath !== request.modelPath) {
        lastInferenceModelPath = request.modelPath;
        inferenceWorker = initializeWorker(request.modelPath);
    }

    return inferenceWorker.then(worker => inferenceWithWorker(worker, request, callback));
}

async function inferenceWithWorker(worker, request, callback) {
    request.requestId = nextRequestId++;
    worker.onmessage = function (e) {
        // console.log('[fllama_wasm_init.js] received message', e.data);
        switch (e.data.event) {
            case action.INITIALIZED:
                // console.log('[fllama_wasm_init.js] worker initialized. Requesting inference.');
                worker.postMessage({ event: action.INFERENCE, ...request });
                break;
            case action.INFERENCE_CANCEL:
                console.log('[fllama_wasm_init.js] inferenceWithWorker received inference cancel', e.data);
                worker.postMessage({ event: action.INFERENCE_CANCEL, ...e.data });
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

    // console.log('[fllama_wasm_init.js.fllamaInferenceJs] hello!', request);
    return new Promise(async (resolve, reject) => {
        let blobFailed = false;
        if (request.modelPath.startsWith('blob:')) {
            // Handle the blob URL
            // console.log('[fllama_wasm_init.js.fllamaInferenceJs] Detected blob URL, processing it.', request.modelPath);
            await fetch(request.modelPath)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => {
                    console.log("[fllama_wasm_init.js.fllamaInferenceJs] loaded blob arrayBuffer", arrayBuffer.byteLength, arrayBuffer.slice(0, 10));
                    request = Object.assign({}, request, { modelArrayBuffer: arrayBuffer });
                })
                .catch(error => {
                    console.error('[fllamaInferenceJs] Error fetching blob:', error);
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
        worker.postMessage(message);
        console.log('[fllama_wasm_init.js.fllamaInferenceJs] resolving promise with request ID', request.requestId);
        resolve(request.requestId);
        // console.log('[fllama_wasm_init.js.fllamaInferenceJs] posted message to main worker', message);
    });
}

window.fllamaInferenceJs = fllamaInferenceJs;

let tokenizeWorker = null;
let lastTokenizeModelPath = '';

async function fllamaTokenizeJs(modelPath, input) {
    if (tokenizeWorker === null || lastTokenizeModelPath !== modelPath) {
        lastTokenizeModelPath = modelPath;
        tokenizeWorker = initializeWorker(modelPath);
    }
    return tokenizeWorker.then(worker => tokenizeWithWorker(worker, input));
}

function initializeWorker(modelPath) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('fllama_wasm_main_worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = function (e) {
            // console.log('[fllama_wasm_init.js.initializeWorker] received message', e.data);
            if (e.data.event === action.INITIALIZED) {
                resolve(worker);
            }
        };

        worker.onerror = function (error) {
            // console.error('[fllama_wasm_init.js.initializeWorker] Worker error:', error);
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
                    console.error('[fllama_wasm_init.js.initializeWorker] Error fetching blob:', error);
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

window.fllamaTokenizeJs = fllamaTokenizeJs;



let chatTemplateWorker = null;
let lastChatTemplateModelPath = '';

async function fllamaChatTemplateGetJs(modelPath) {
    if (chatTemplateWorker === null || lastChatTemplateModelPath !== modelPath) {
        lastChatTemplateModelPath = modelPath;
        chatTemplateWorker = initializeWorker(modelPath);
    }
    return chatTemplateWorker.then(worker => chatTemplateWithWorker(worker));
}

function chatTemplateWithWorker(worker, input) {
    return new Promise((resolve, reject) => {
        const handleMessage = function (e) {
            console.log('[fllama_wasm_init.js.chatTemplateWithWorker] received message', e.data);
            switch (e.data.event) {
                case action.GET_CHAT_TEMPLATE_CALLBACK:
                    worker.removeEventListener('message', handleMessage);
                    resolve(e.data.chatTemplate);
                    break;
                default:
                    reject(new Error('Unexpected message'));
                    break;
            }
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage({ event: action.GET_CHAT_TEMPLATE, input });
    });
}

window.fllamaChatTemplateGetJs = fllamaChatTemplateGetJs;


let eosTokenWorker = null;
let lastEosTokenTemplateModelPath = '';

async function fllamaEosTokenGetJs(modelPath) {
    if (eosTokenWorker === null || lastEosTokenTemplateModelPath !== modelPath) {
        lastEosTokenTemplateModelPath = modelPath;
        eosTokenWorker = initializeWorker(modelPath);
    }
    return eosTokenWorker.then(worker => eosTokenWithWorker(worker));
}

function eosTokenWithWorker(worker) {
    return new Promise((resolve, reject) => {
        const handleMessage = function (e) {
            console.log('[fllama_wasm_init.js.eosTokenWithWorker] received message', e.data);
            switch (e.data.event) {
                case action.GET_EOS_TOKEN_CALLBACK:
                    worker.removeEventListener('message', handleMessage);
                    resolve(e.data.eosToken);
                    break;
                default:
                    reject(new Error('Unexpected message'));
                    break;
            }
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage({ event: action.GET_EOS_TOKEN });
    });
}

window.fllamaEosTokenGetJs = fllamaEosTokenGetJs;



async function fllamaCancelInferenceJs(requestId) {

    console.log('[fllama_wasm_init.js.fllamaCancelInferenceJs] cancel inference called for request ID', requestId);
    // Check if inferenceWorker is initialized. If so, send cancel message.
    if (inferenceWorker !== null) {
        console.log('[fllama_wasm_init.js.fllamaCancelInferenceJs] inferenceWorker is initialized, sending cancel message');
        inferenceWorker.then(worker => worker.postMessage({ event: action.INFERENCE_CANCEL, requestId }));
    } else {
        console.log('[fllama_wasm_init.js.fllamaCancelInferenceJs] inferenceWorker is not initialized, skipping cancel message');
    }
}

window.fllamaCancelInferenceJs = fllamaCancelInferenceJs;
