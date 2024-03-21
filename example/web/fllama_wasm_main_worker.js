import { action } from "./fllama_wasm_actions.js";
import { loadBinaryResource } from "./fllama_wasm_storage.js";
import Module from "./fllama_wasm.js";

let module;
let wroteModel = false;

const initWorker = async (modelPath, modelSize) => {
    // console.log(["[fllama_wasm_main_worker.js.initWorker] Loading binary resource from model path ", modelPath]);
    const emscriptenModuleOptions = {};
    module = await Module(emscriptenModuleOptions);
    // console.log("[fllama_wasm_main_worker.js.initWorker] Module loaded", module);
    // console.log("[fllama_wasm_main_worker.js.initWorker] initializing worker at model path ", modelPath);
    const initCallback = (bytes) => {
        // create vfs folder for storing model bins
        module['FS_createPath']("/", "models", true, true);
        // load model
        module['FS_createDataFile']('/models', 'model.bin', bytes, true, true, true);
        // update callback action to worker main thread
        wroteModel = true;
        postMessage({
            event: action.INITIALIZED,
        });
    }
    // console.log("[fllama_wasm_main_worker.js.initWorker] Loading binary resource from model path ", modelPath);
    loadBinaryResource(modelPath, modelSize, initCallback);
}

let loadStartTimestamp; // Declared outside to keep track of loading start time
let loadCompleteTimestamp; // Also declared outside to track when loading is completed

self.addEventListener('message', async (e) => {
    try {
        const startTimestamp = Date.now();

        console.log("[fllama_wasm_main_worker.js.initWorker] received message", e.data, "at", startTimestamp);

        switch (e.data.event) {
            case action.LOAD:
                loadStartTimestamp = Date.now(); // Capture load start
                await initWorker(e.data.url, e.data.modelSize);
                loadCompleteTimestamp = Date.now(); // Loading completed here
                // console.log("[fllama_wasm_main_worker.js.initWorker] worker initialized at", loadCompleteTimestamp, "elapsed", loadCompleteTimestamp - loadStartTimestamp, "ms");
                break;
            case action.TOKENIZE: {
                const { input } = e.data;
                const virtualModelPath = "/models/model.bin";
                const virtualModelPathRaw = new TextEncoder().encode(virtualModelPath);
                let modelPathPtr = module._malloc(virtualModelPathRaw.length + 1);
                let modelPathChunk = module.HEAPU8.subarray(modelPathPtr, modelPathPtr + virtualModelPathRaw.length + 1);
                modelPathChunk.set(virtualModelPathRaw);
                module.HEAPU8[modelPathPtr + virtualModelPathRaw.length] = 0; // explicitly set the null terminator

                let inputRaw = new TextEncoder().encode(input);
                let inputPtr = module._malloc(inputRaw.length + 1);
                let inputChunk = module.HEAPU8.subarray(inputPtr, inputPtr + inputRaw.length + 1);
                inputChunk.set(inputRaw);
                module.HEAPU8[inputPtr + inputRaw.length] = 0; // explicitly set the null terminator

                // const tokenizeStartTimestamp = Date.now();
                const tokenCount = module._fllama_tokenize_export(modelPathPtr, inputPtr);
                // const endTimestamp = Date.now();
                // const loadingTime = (loadCompleteTimestamp - loadStartTimestamp) || 0;
                // const tokenizationTime = endTimestamp - tokenizeStartTimestamp;
                // const totalTime = endTimestamp - loadStartTimestamp;

                // console.log("[fllama_wasm_main_worker.js.initWorker] posting TOKENIZE_CALLBACK with tokenCount", tokenCount, "at", endTimestamp, 
                //  "total time since load start", totalTime, "ms", 
                //  "loading took", loadingTime, "ms, or percentage", 
                //  ((loadingTime / totalTime) * 100).toFixed(2), 
                //  "% of total. Actual tokenization took", tokenizationTime, "ms");
                postMessage({
                    event: action.TOKENIZE_CALLBACK,
                    tokenCount
                });
                break;
            }
            case action.INFERENCE:
                const { requestId, contextSize, input, maxTokens, modelPath, modelMmprojPath, numGpuLayers, numThreads, temperature, topP, penaltyFrequency, penaltyRepeat, grammar, eosToken } = e.data;
                const inferenceCallbackJs = module.addFunction((response, isDone) => {
                    postMessage({
                        event: action.INFERENCE_CALLBACK,
                        response: module.UTF8ToString(response),
                        isDone,
                    });
                }, 'vii'); // 'vii' indicates the function signature: void return type, 2 integer arguments (pointers)

                const logCallbackJs = module.addFunction((message) => {
                    // Let natural case of logger not set defaulting to cout happen; this automatically shows up
                    // in the browser console. Downside is there's no way to silence logs from the worker other
                    // than changing the default logger in fllama.cpp.
                    //
                    // console.log("[fllama_wasm_main_worker.js.logCallbackJs]: ", module.UTF8ToString(message));
                }, 'vi'); // 'vi' indicates the function signature: void return type, integer argument (pointer)
                const inputRaw = new TextEncoder().encode(input);
                let inputPtr = module._malloc(inputRaw.length);
                let inputChunk = module.HEAPU8.subarray(inputPtr, inputPtr + inputRaw.length);
                inputChunk.set(inputRaw);
                module.HEAPU8[inputPtr + inputRaw.length] = 0; // explicitly set the null terminator


                const virtualModelPath = "/models/model.bin";
                const virtualModelPathRaw = new TextEncoder().encode(virtualModelPath);
                let modelPathPtr = module._malloc(virtualModelPathRaw.length + 1);
                let modelPathChunk = module.HEAPU8.subarray(modelPathPtr, modelPathPtr + virtualModelPathRaw.length + 1);
                modelPathChunk.set(virtualModelPathRaw);
                module.HEAPU8[modelPathPtr + virtualModelPathRaw.length] = 0; // explicitly set the null terminator

                let modelMmprojPathPtr = 0; // Use null pointer (0) in C/C++ if modelMmprojPath is not provided
                if (modelMmprojPath) {
                    const virtualModelMmprojPath = "/models/mmproj.bin";
                    const virtualModelMmprojPathRaw = new TextEncoder().encode(virtualModelMmprojPath);
                    modelMmprojPathPtr = module._malloc(virtualModelMmprojPathRaw.length + 1);
                    let modelMmprojPathChunk = module.HEAPU8.subarray(modelMmprojPathPtr, modelMmprojPathPtr + virtualModelMmprojPathRaw.length + 1);
                    modelMmprojPathChunk.set(virtualModelMmprojPathRaw);
                    module.HEAPU8[modelMmprojPathPtr + virtualModelMmprojPathRaw.length] = 0; // explicitly set the null terminator
                }

                let eosTokenPtr = 0; // Use null pointer (0) in C/C++ if eosToken is not provided
                if (eosToken) {
                    const eosTokenRaw = new TextEncoder().encode(eosToken);
                    eosTokenPtr = module._malloc(eosTokenRaw.length + 1);
                    let eosTokenChunk = module.HEAPU8.subarray(eosTokenPtr, eosTokenPtr + eosTokenRaw.length + 1);
                    eosTokenChunk.set(eosTokenRaw);
                    module.HEAPU8[eosTokenPtr + eosTokenRaw.length] = 0; // explicitly set the null terminator
                }
                console.log('Request ID being passed to _fllama_inference_export:', requestId);

                module._fllama_inference_export(requestId, contextSize, inputPtr, maxTokens, modelPathPtr, modelMmprojPathPtr, numGpuLayers, numThreads, temperature, topP, penaltyFrequency, penaltyRepeat, grammar, eosTokenPtr, inferenceCallbackJs, logCallbackJs);
                // console.log("[fllama_wasm_main_worker.js.initWorker] completed inference request", e.data);
                break;
            case action.INFERENCE_CANCEL:
                const { cancelRequestId } = e.data;
                module._fllama_cancel_inference_export(cancelRequestId);
                break;
            case action.GET_CHAT_TEMPLATE: {
                const virtualModelPath = "/models/model.bin";
                const virtualModelPathRaw = new TextEncoder().encode(virtualModelPath);
                let modelPathPtr = module._malloc(virtualModelPathRaw.length + 1);
                let modelPathChunk = module.HEAPU8.subarray(modelPathPtr, modelPathPtr + virtualModelPathRaw.length + 1);
                modelPathChunk.set(virtualModelPathRaw);
                module.HEAPU8[modelPathPtr + virtualModelPathRaw.length] = 0; // explicitly set the null terminator

                const chatTemplate = module._fllama_get_chat_template_export(modelPathPtr);
                const decodedString = module.UTF8ToString(chatTemplate);
                postMessage({
                    event: action.GET_CHAT_TEMPLATE_CALLBACK,
                    chatTemplate: decodedString,
                });
                break;
            }
            case action.GET_EOS_TOKEN: {
                const virtualModelPath = "/models/model.bin";
                const virtualModelPathRaw = new TextEncoder().encode(virtualModelPath);
                let modelPathPtr = module._malloc(virtualModelPathRaw.length + 1);
                let modelPathChunk = module.HEAPU8.subarray(modelPathPtr, modelPathPtr + virtualModelPathRaw.length + 1);
                modelPathChunk.set(virtualModelPathRaw);
                module.HEAPU8[modelPathPtr + virtualModelPathRaw.length] = 0; // explicitly set the null terminator

                const eosToken = module._fllama_get_eos_token_export(modelPathPtr);
                const decodedString = module.UTF8ToString(eosToken);
                postMessage({
                    event: action.GET_EOS_TOKEN_CALLBACK,
                    eosToken: decodedString,
                });
                break;
            }
            default:
                console.error("[fllama_wasm_main_worker.js] unexpected message", e);
                break;
        }
    } catch (error) {
        console.error('[fllama_wasm_main_worker.js] An error occurred:', error);
        console.error('Error stack trace:', error.stack);
    }
}, false);

