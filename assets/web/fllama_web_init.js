import { Wllama } from "./wllama/index.js?v=f22c8021d-fast-webgpu";

const WLLAMA_ASSET_VERSION = 'f22c8021d-fast-webgpu';

function versionedAsset(path) {
    const url = new URL(path, import.meta.url);
    url.searchParams.set('v', WLLAMA_ASSET_VERSION);
    return url.href;
}

const WLLAMA_PATHS = {
    'jspi/single-thread/wllama.wasm': versionedAsset('./wllama/jspi-single-thread/wllama.wasm'),
    'asyncify/single-thread/wllama.wasm': versionedAsset('./wllama/asyncify-single-thread/wllama.wasm'),
    'asyncify/multi-thread/wllama.wasm': versionedAsset('./wllama/asyncify-multi-thread/wllama.wasm'),
};

let nextRequestId = 0;
let serverWllama = null;
let lastServerModelKey = '';
const abortControllers = new Map();
const localModelFiles = new Map();

function createWllama(backend = navigator.gpu ? 'webgpu' : 'cpu') {
    return new Wllama(WLLAMA_PATHS, {
        backend,
        allowOffline: true,
        suppressNativeLog: true,
    });
}

function modelKey(modelPath) {
    return modelPath;
}

function samplingFromRequest(request) {
    return {
        temp: request.temperature,
        top_p: request.topP,
        penalty_freq: request.penaltyFrequency,
        penalty_repeat: request.penaltyRepeat,
    };
}

function messagesFromRequest(request) {
    const rawMessages = JSON.parse(request.messagesAsJsonString || '[]');
    return rawMessages.map((message) => ({
        role: message.role || 'user',
        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
    }));
}

function toolsFromRequest(request) {
    return JSON.parse(request.toolsAsJsonString || '[]');
}

function openAiRequestFromFllamaRequest(request) {
    if (request.openAiRequestJsonString) {
        return JSON.parse(request.openAiRequestJsonString);
    }
    const tools = toolsFromRequest(request);
    return {
        messages: messagesFromRequest(request),
        tools,
        ...(tools.length > 0 ? { tool_choice: 'required' } : {}),
    };
}

async function loadServerModelIfNeeded(modelPath, request = {}, loadCallback = () => { }) {
    if (!globalThis.crossOriginIsolated) {
        throw new Error(
            'fllama web requires cross-origin isolation so wllama can use SharedArrayBuffer/pthreads. ' +
            'Run the example with `flutter run -d chrome --cross-origin-isolation`, or build and serve it with `node web/server.js`.'
        );
    }

    const key = modelKey(modelPath);
    if (serverWllama !== null && lastServerModelKey === key && serverWllama.isServerModelLoaded()) {
        loadCallback(1, 1);
        return serverWllama;
    }

    if (serverWllama !== null) {
        try {
            await serverWllama.exit();
        } catch (error) {
            console.warn('[fllama_web_init.js.loadServerModelIfNeeded] error unloading previous model:', error);
        }
    }

    lastServerModelKey = key;
    serverWllama = createWllama();

    const loadConfig = {
        n_ctx: request.contextSize || 4096,
        n_threads: request.numThreads || Math.max(1, Math.min(4, navigator.hardwareConcurrency || 4)),
        useCache: true,
        progressCallback: ({ loaded, total }) => {
            const progress = total > 0 ? loaded / total : 0;
            loadCallback(progress, 0);
        },
    };

    async function doLoad(instance) {
        const localFile = localModelFiles.get(modelPath);
        if (localFile) {
            loadCallback(1, 0);
            await instance.loadServerModel([localFile], loadConfig);
        } else if (modelPath.startsWith('blob:')) {
            const blob = await fetch(modelPath).then((response) => response.blob());
            loadCallback(1, 0);
            await instance.loadServerModel([blob], loadConfig);
        } else {
            await instance.loadServerModelFromUrl(modelPath, loadConfig);
        }
    }

    console.log('[fllama_web_init.js.loadServerModelIfNeeded] loading server model', modelPath);
    try {
        await doLoad(serverWllama);
    } catch (error) {
        if (navigator.gpu) {
            console.warn('[fllama_web_init.js.loadServerModelIfNeeded] WebGPU load failed, retrying CPU:', error);
            try { await serverWllama.exit(); } catch (_) { }
            serverWllama = createWllama('cpu');
            await doLoad(serverWllama);
        } else {
            throw error;
        }
    }

    loadCallback(1, 1);
    console.log('[fllama_web_init.js.loadServerModelIfNeeded] server model loaded');
    return serverWllama;
}

function textDeltaFromChunk(chunk) {
    const choice = chunk?.choices?.[0];
    const delta = choice?.delta || {};
    return delta.content || delta.reasoning_content || '';
}

function shouldLogFllamaRequestShape() {
    // Temporary crash triage: always emit the exact request shape so it is not
    // lost when Telosnex routing drops query parameters during navigation.
    return true;
}

function base64EncodeUtf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function logFllamaRequestShape(kind, request) {
    if (!shouldLogFllamaRequestShape()) return;
    try {
        const copy = {};
        for (const key of Object.keys(request || {})) {
            const value = request[key];
            if (typeof value === 'function') continue;
            copy[key] = value;
        }
        const json = JSON.stringify(copy, null, 2);
        const base64 = base64EncodeUtf8(json);
        const chunkSize = 12000;
        const totalChunks = Math.max(1, Math.ceil(base64.length / chunkSize));
        console.log(`[FLLAMA_REQUEST_SHAPE_JSON_BEGIN ${kind}]`);
        console.log(json);
        console.log(`[FLLAMA_REQUEST_SHAPE_JSON_END ${kind}]`);
        for (let i = 0; i < totalChunks; i += 1) {
            console.log(
                `[FLLAMA_REQUEST_SHAPE_BASE64_CHUNK ${kind} ${i + 1}/${totalChunks}] ` +
                base64.slice(i * chunkSize, (i + 1) * chunkSize)
            );
        }
    } catch (error) {
        console.warn('[fllama_web_init.js] failed to log request shape', error);
    }
}

function fllamaInferenceJs(request, callback) {
    request.requestId = nextRequestId++;
    logFllamaRequestShape('fllamaInferenceJs', request);
    runCompletion(request, callback).catch((error) => {
        console.error('[fllama_web_init.js.fllamaInferenceJs] error:', error);
        callback(String(error?.message || error || 'Unknown fllama web error'), '', true);
    });
    return Promise.resolve(request.requestId);
}
window.fllamaInferenceJs = fllamaInferenceJs;

async function runCompletion(request, callback) {
    const instance = await loadServerModelIfNeeded(request.modelPath, request);
    const abortController = new AbortController();
    abortControllers.set(request.requestId, abortController);

    let lastText = '';
    try {
        const stream = await instance.createServerChatCompletionStream({
            messages: [{ role: 'user', content: request.input || '' }],
        }, {
            model: request.modelPath,
            nPredict: request.maxTokens,
            sampling: samplingFromRequest(request),
        });

        for await (const item of stream) {
            if (abortController.signal.aborted) break;
            lastText += textDeltaFromChunk(item.chunk);
            callback(lastText, item.rawChunk, false);
        }
        callback(lastText, '', true);
    } finally {
        abortControllers.delete(request.requestId);
    }
}

function fllamaChatWebJs(request, loadCallback, inferenceCallback) {
    request.requestId = nextRequestId++;
    logFllamaRequestShape('fllamaChatWebJs', request);
    runChat(request, loadCallback, inferenceCallback).catch((error) => {
        console.error('[fllama_web_init.js.fllamaChatWebJs] error:', error);
        inferenceCallback(String(error?.message || error || 'Unknown fllama web error'), '', true);
    });
    return Promise.resolve(request.requestId);
}
window.fllamaChatWebJs = fllamaChatWebJs;

async function runChat(request, loadCallback, inferenceCallback) {
    const instance = await loadServerModelIfNeeded(request.modelPath, request, loadCallback);
    const abortController = new AbortController();
    abortControllers.set(request.requestId, abortController);

    let lastText = '';
    try {
        const openAiRequest = openAiRequestFromFllamaRequest(request);
        const stream = await instance.createServerChatCompletionStream(openAiRequest, {
            model: request.modelPath,
            jinjaTemplate: openAiRequest.jinja_template,
            nPredict: request.maxTokens,
            sampling: samplingFromRequest(request),
        });

        for await (const item of stream) {
            if (abortController.signal.aborted) break;
            lastText += textDeltaFromChunk(item.chunk);
            inferenceCallback(lastText, item.rawChunk, false);
        }
        inferenceCallback(lastText, '', true);
    } finally {
        abortControllers.delete(request.requestId);
    }
}

async function fllamaWebModelDeleteJs(modelPath) {
    console.log('[fllama_web_init.js.fllamaWebModelDeleteJs] deleting model', modelPath);
    localModelFiles.delete(modelPath);
    if (lastServerModelKey === modelKey(modelPath) && serverWllama !== null) {
        try {
            await serverWllama.exit();
        } catch (error) {
            console.warn('[fllama_web_init.js.fllamaWebModelDeleteJs] error unloading active model:', error);
        }
        serverWllama = null;
        lastServerModelKey = '';
    }
    try {
        const manager = (serverWllama || createWllama()).modelManager;
        const models = await manager.getModels({ includeInvalid: true });
        const model = models.find((m) => m.url === modelPath);
        if (model) {
            await model.remove();
        }
    } catch (error) {
        console.error('[fllama_web_init.js.fllamaWebModelDeleteJs] Error deleting model:', error);
    }
}
window.fllamaWebModelDeleteJs = fllamaWebModelDeleteJs;

async function fllamaWebIsModelDownloadedJs(modelPath) {
    if (localModelFiles.has(modelPath)) {
        return true;
    }
    if (modelPath.startsWith('blob:')) {
        return true;
    }
    try {
        const manager = (serverWllama || createWllama()).modelManager;
        const models = await manager.getModels();
        return models.some((m) => m.url === modelPath);
    } catch (error) {
        console.error('[fllama_web_init.js.fllamaWebIsModelDownloadedJs] Error checking model cache:', error);
        return false;
    }
}
window.fllamaWebIsModelDownloadedJs = fllamaWebIsModelDownloadedJs;

async function fllamaWebPickModelJs() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gguf,application/octet-stream';

    const file = await new Promise((resolve) => {
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
    });

    if (!file) {
        return '';
    }

    const id = `fllama-local-file://${crypto.randomUUID()}`;
    localModelFiles.set(id, file);
    return id;
}
window.fllamaWebPickModelJs = fllamaWebPickModelJs;

async function fllamaTokenizeJs(_modelPath, input) {
    // The web example's chat path uses llama.cpp server_context as the model owner.
    // Tokenization is only used by the native example UI for throughput display.
    return Math.ceil((input || '').length / 4);
}
window.fllamaTokenizeJs = fllamaTokenizeJs;

async function fllamaChatTemplateGetJs(_modelPath) {
    return '';
}
window.fllamaChatTemplateGetJs = fllamaChatTemplateGetJs;

async function fllamaBosTokenGetJs(_modelPath) {
    return '';
}
window.fllamaBosTokenGetJs = fllamaBosTokenGetJs;

async function fllamaEosTokenGetJs(_modelPath) {
    return '';
}
window.fllamaEosTokenGetJs = fllamaEosTokenGetJs;

function fllamaCancelInferenceJs(requestId) {
    console.log('[fllama_web_init.js.fllamaCancelInferenceJs] cancel inference called for request ID', requestId);
    const abortController = abortControllers.get(requestId);
    if (abortController) {
        abortController.abort();
    }
}
window.fllamaCancelInferenceJs = fllamaCancelInferenceJs;
