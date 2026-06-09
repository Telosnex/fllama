import { Wllama } from "./wllama/index.js?v=ngxson-v7-llamacpp-b9555";

const WLLAMA_ASSET_VERSION = 'ngxson-v7-llamacpp-b9555';

function versionedAsset(path) {
    const url = new URL(path, import.meta.url);
    url.searchParams.set('v', WLLAMA_ASSET_VERSION);
    return url.href;
}

const WLLAMA_PATHS = {
    default: versionedAsset('./wllama/wasm/wllama.wasm'),
};

// Keep web default aligned with native fllama's
// ServerManager::DEFAULT_N_PARALLEL. Callers can override per request.
const DEFAULT_N_PARALLEL = 4;

let nextRequestId = 0;
let serverWllama = null;
let lastServerModelKey = '';
let serverRequestQueue = Promise.resolve();
let serverModelLoadQueue = Promise.resolve();
let serverModelLoadPromise = null;
let serverModelLoadKey = '';
let activeServerRequestCount = 0;
let activeServerRequestKey = '';
let activeServerRequestZeroResolvers = [];
let serverKeySwitchQueue = Promise.resolve();
const abortControllers = new Map();
const localModelFiles = new Map();
const FSA_MODEL_HANDLE_DB = 'fllama-model-handles.db';
const FSA_MODEL_HANDLE_STORE = 'files';
const FSA_MODEL_HANDLE_KEY_PROP = 'id';
const FSA_MODEL_HANDLE_PROP = 'handle';

// 26-05-20: Temporarily bypass the JS-side request Promise queue. Upstream
// wllama/llama.cpp server code may now handle multiple in-flight requests via
// continuous batching, so test direct concurrent createChatCompletion calls.
const DISABLE_SERVER_REQUEST_QUEUE = true;

function waitForNoActiveServerRequests() {
    if (activeServerRequestCount === 0) return Promise.resolve();
    return new Promise((resolve) => activeServerRequestZeroResolvers.push(resolve));
}

function noteServerRequestFinished() {
    activeServerRequestCount = Math.max(0, activeServerRequestCount - 1);
    if (activeServerRequestCount === 0) {
        activeServerRequestKey = '';
        const resolvers = activeServerRequestZeroResolvers;
        activeServerRequestZeroResolvers = [];
        for (const resolve of resolvers) resolve();
    }
}

function enqueueServerRequest(kind, request, task) {
    const key = request?.modelPath ? modelKey(request.modelPath, request) : '';
    const runTask = async () => {
        if (key) {
            activeServerRequestKey = key;
            activeServerRequestCount += 1;
        }
        try {
            return await task();
        } finally {
            if (key) noteServerRequestFinished();
        }
    };

    if (DISABLE_SERVER_REQUEST_QUEUE) {
        if (key && activeServerRequestCount > 0 && activeServerRequestKey !== key) {
            console.info('[fllama_web_init.js.enqueueServerRequest] waiting for active request before model-key switch', {
                kind,
                requestId: request.requestId,
                activeServerRequestCount,
            });
            const queuedSwitchTask = serverKeySwitchQueue.catch(() => { }).then(async () => {
                await waitForNoActiveServerRequests();
                console.info('[fllama_web_init.js.enqueueServerRequest] model-key switch unblocked; starting request', {
                    kind,
                    requestId: request.requestId,
                });
                return runTask();
            });
            serverKeySwitchQueue = queuedSwitchTask.catch((error) => {
                console.error('[fllama_web_init.js.enqueueServerRequest] model-key switch request failed', {
                    kind,
                    requestId: request.requestId,
                    error,
                });
            });
            return queuedSwitchTask;
        }

        console.info('[fllama_web_init.js.enqueueServerRequest] queue disabled; starting request immediately', {
            kind,
            requestId: request.requestId,
        });
        return runTask();
    }

    const queuedTask = serverRequestQueue.catch(() => { }).then(runTask);
    serverRequestQueue = queuedTask.catch((error) => {
        console.error('[fllama_web_init.js.enqueueServerRequest] queued request failed', {
            kind,
            requestId: request.requestId,
            error,
        });
    });
    return queuedTask;
}

function isNoisyPerTokenLlamaLog(args) {
    const first = String(args?.[0] ?? '').trim();
    return first === 'set_embeddings: value = 0' ||
        first === 'set_adapters_lora: adapters = 0' ||
        first === 'adapters_lora_are_same: adapters = 0';
}

const fllamaWllamaLogger = {
    debug: (...args) => {
        if (isNoisyPerTokenLlamaLog(args)) return;
        console.debug(...args);
    },
    log: (...args) => console.log(...args),
    // Upstream wllama forwards native stderr through warn(), which makes Chrome
    // attach a huge stack trace to every llama.cpp line. Keep the lines visible
    // but route them through info() so WebGPU/offload diagnostics are readable.
    warn: (...args) => console.info(...args),
    error: (...args) => console.error(...args),
};

function createWllama() {
    return new Wllama(WLLAMA_PATHS, {
        allowOffline: true,
        // Keep llama.cpp/wllama load logs visible. They are the easiest way to
        // confirm whether the browser runtime is using WebGPU, threads, and
        // layer offload without dumping request payloads or per-token chunks.
        suppressNativeLog: false,
        logger: fllamaWllamaLogger,
    });
}

function isIdbUrl(value) {
    return typeof value === 'string' && value.startsWith('idb://');
}

function isFsaUrl(value) {
    return typeof value === 'string' && value.startsWith('fsa://');
}

function fllamaWebIsFileSystemAccessSupportedJs() {
    return typeof window.showOpenFilePicker === 'function' && typeof indexedDB !== 'undefined';
}
window.fllamaWebIsFileSystemAccessSupportedJs = fllamaWebIsFileSystemAccessSupportedJs;

function indexedDbRequest(request) {
    return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
        request.onsuccess = () => resolve(request.result);
    });
}

function indexedDbTransactionComplete(transaction) {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
    });
}

function idbFilenameFromUrl(url) {
    const matchValue = url.searchParams.get('matchValue');
    const fallback = url.hash ? decodeURIComponent(url.hash.slice(1)) : 'model.gguf';
    if (!matchValue) return fallback;
    const parts = matchValue.split('/').filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : fallback;
}

async function getIndexedDbObject({ dbName, objectStoreName, matchPropName, matchPropValue }) {
    const db = await indexedDbRequest(indexedDB.open(dbName));
    try {
        const transaction = db.transaction(objectStoreName, 'readonly');
        const transactionDone = indexedDbTransactionComplete(transaction);
        const store = transaction.objectStore(objectStoreName);
        let object = await indexedDbRequest(store.get(matchPropValue));

        if (!object && matchPropName) {
            try {
                object = await indexedDbRequest(store.index(matchPropName).get(matchPropValue));
            } catch (_) {
                await new Promise((resolve, reject) => {
                    const cursorRequest = store.openCursor();
                    cursorRequest.onerror = () => reject(cursorRequest.error || new Error('IndexedDB cursor failed'));
                    cursorRequest.onsuccess = () => {
                        const cursor = cursorRequest.result;
                        if (!cursor) {
                            resolve();
                            return;
                        }
                        if (cursor.value?.[matchPropName] === matchPropValue) {
                            object = cursor.value;
                            resolve();
                        } else {
                            cursor.continue();
                        }
                    };
                });
            }
        }

        await transactionDone;
        return object;
    } finally {
        db.close();
    }
}

async function fileFromIdbUrl(idbUrl) {
    const url = new URL(idbUrl);
    const dbName = decodeURIComponent(url.hostname);
    const objectStoreName = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const matchPropName = url.searchParams.get('matchProp');
    const matchPropValue = url.searchParams.get('matchValue');
    const bytesPropName = url.searchParams.get('bytesProp') || 'contents';
    if (!dbName || !objectStoreName || !matchPropValue) {
        throw new Error(`Invalid idb model URL: ${idbUrl}`);
    }

    const object = await getIndexedDbObject({
        dbName,
        objectStoreName,
        matchPropName,
        matchPropValue,
    });
    if (!object) {
        throw new Error(`IndexedDB model file not found: ${matchPropValue}`);
    }
    const contents = object[bytesPropName];
    if (!contents) {
        throw new Error(`IndexedDB model file has no byte property "${bytesPropName}": ${matchPropValue}`);
    }
    return new File([contents], idbFilenameFromUrl(url), { type: 'application/octet-stream' });
}

async function modelFilesFromIdbUrls(modelPath, mmprojPath) {
    const modelFile = await fileFromIdbUrl(modelPath);
    if (!mmprojPath) return [modelFile];
    if (!isIdbUrl(mmprojPath)) {
        throw new Error(`Model path is idb:// but mmproj path is not: ${mmprojPath}`);
    }
    return [modelFile, await fileFromIdbUrl(mmprojPath)];
}

function openFsaModelHandleDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(FSA_MODEL_HANDLE_DB, 1);
        request.onerror = () => reject(request.error || new Error('Failed to open fllama model handle database'));
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(FSA_MODEL_HANDLE_STORE)) {
                db.createObjectStore(FSA_MODEL_HANDLE_STORE, { keyPath: FSA_MODEL_HANDLE_KEY_PROP });
            }
        };
        request.onsuccess = () => resolve(request.result);
    });
}

function fsaModelHandleUrl(id, fileName) {
    const url = new URL(`fsa://${FSA_MODEL_HANDLE_DB}/${FSA_MODEL_HANDLE_STORE}`);
    url.searchParams.set('id', id);
    url.searchParams.set('name', fileName || 'model.gguf');
    url.searchParams.set('handleProp', FSA_MODEL_HANDLE_PROP);
    return url.href;
}

function fsaIdFromUrl(fsaUrl) {
    const id = new URL(fsaUrl).searchParams.get('id');
    if (!id) throw new Error(`Invalid fsa model URL: ${fsaUrl}`);
    return id;
}

async function putFsaModelHandle({ id, handle, file }) {
    const db = await openFsaModelHandleDb();
    try {
        const transaction = db.transaction(FSA_MODEL_HANDLE_STORE, 'readwrite');
        const transactionDone = indexedDbTransactionComplete(transaction);
        const store = transaction.objectStore(FSA_MODEL_HANDLE_STORE);
        await indexedDbRequest(store.put({
            [FSA_MODEL_HANDLE_KEY_PROP]: id,
            [FSA_MODEL_HANDLE_PROP]: handle,
            name: file?.name || handle?.name || 'model.gguf',
            size: Number(file?.size || 0),
            lastModified: Number(file?.lastModified || 0),
            updatedAt: new Date().toISOString(),
        }));
        await transactionDone;
    } finally {
        db.close();
    }
}

async function getFsaModelHandleRecord(fsaUrl) {
    const db = await openFsaModelHandleDb();
    try {
        const transaction = db.transaction(FSA_MODEL_HANDLE_STORE, 'readonly');
        const transactionDone = indexedDbTransactionComplete(transaction);
        const store = transaction.objectStore(FSA_MODEL_HANDLE_STORE);
        const record = await indexedDbRequest(store.get(fsaIdFromUrl(fsaUrl)));
        await transactionDone;
        return record;
    } finally {
        db.close();
    }
}

async function deleteFsaModelHandleRecord(fsaUrl) {
    const db = await openFsaModelHandleDb();
    try {
        const transaction = db.transaction(FSA_MODEL_HANDLE_STORE, 'readwrite');
        const transactionDone = indexedDbTransactionComplete(transaction);
        const store = transaction.objectStore(FSA_MODEL_HANDLE_STORE);
        await indexedDbRequest(store.delete(fsaIdFromUrl(fsaUrl)));
        await transactionDone;
    } finally {
        db.close();
    }
}

async function fsaModelHandleExists(fsaUrl) {
    try {
        const record = await getFsaModelHandleRecord(fsaUrl);
        return Boolean(record?.[FSA_MODEL_HANDLE_PROP]);
    } catch (_) {
        return false;
    }
}

async function ensureFsaReadPermission(handle) {
    if (!handle) throw new Error('Missing File System Access handle');
    const options = { mode: 'read' };
    if (typeof handle.queryPermission === 'function') {
        const state = await handle.queryPermission(options);
        if (state === 'granted') return;
    }
    if (typeof handle.requestPermission === 'function') {
        const state = await handle.requestPermission(options);
        if (state === 'granted') return;
    }
    throw new Error('Permission denied for browser file handle. Re-select the custom model file in Settings > AIs.');
}

async function fileFromFsaUrl(fsaUrl) {
    const record = await getFsaModelHandleRecord(fsaUrl);
    const handle = record?.[new URL(fsaUrl).searchParams.get('handleProp') || FSA_MODEL_HANDLE_PROP];
    if (!handle) {
        throw new Error(`Stored browser file handle not found for ${fsaUrl}`);
    }
    await ensureFsaReadPermission(handle);
    return await handle.getFile();
}

async function modelFilesFromFsaUrls(modelPath, mmprojPath) {
    const modelFile = await fileFromFsaUrl(modelPath);
    if (!mmprojPath) return [modelFile];
    if (isFsaUrl(mmprojPath)) return [modelFile, await fileFromFsaUrl(mmprojPath)];
    if (isIdbUrl(mmprojPath)) return [modelFile, await fileFromIdbUrl(mmprojPath)];
    throw new Error(`Model path is fsa:// but mmproj path is not browser-local: ${mmprojPath}`);
}

function normalizedModelExtensions(extensionsJson) {
    let extensions = [];
    try {
        extensions = JSON.parse(extensionsJson || '[]');
    } catch (_) {
        extensions = [];
    }
    extensions = Array.isArray(extensions) ? extensions : [];
    extensions = extensions
        .map((extension) => String(extension || '').trim().toLowerCase())
        .filter(Boolean)
        .map((extension) => extension.startsWith('.') ? extension : `.${extension}`);
    return extensions.length > 0 ? extensions : ['.gguf'];
}

function hasAcceptedModelExtension(fileName, extensions) {
    const lower = String(fileName || '').toLowerCase();
    return extensions.some((extension) => lower.endsWith(extension));
}

async function fllamaWebPickPersistentModelFileJs(extensionsJson, importId, fallbackFilename) {
    if (!fllamaWebIsFileSystemAccessSupportedJs()) return '';
    const extensions = normalizedModelExtensions(extensionsJson);
    const options = {
        multiple: false,
        excludeAcceptAllOption: false,
        types: [{
            description: 'Model files',
            accept: {
                'application/octet-stream': extensions,
                'application/gguf': extensions,
            },
        }],
    };

    let handles;
    try {
        handles = await window.showOpenFilePicker(options);
    } catch (error) {
        if (String(error?.name || error).includes('AbortError')) return '';
        throw error;
    }
    const handle = handles?.[0];
    if (!handle) return '';
    await ensureFsaReadPermission(handle);
    const file = await handle.getFile();
    const fileName = file?.name || handle.name || fallbackFilename || 'model.gguf';
    if (!hasAcceptedModelExtension(fileName, extensions)) {
        throw new Error(`Choose a ${extensions.join(' or ')} file.`);
    }

    const idPrefix = String(importId || crypto.randomUUID()).replace(/[^A-Za-z0-9._-]+/g, '_');
    const id = `${idPrefix}/${crypto.randomUUID()}`;
    await putFsaModelHandle({ id, handle, file });
    return JSON.stringify({
        path: fsaModelHandleUrl(id, fileName),
        displayName: fileName,
        sizeBytes: Number(file.size || 0),
    });
}
window.fllamaWebPickPersistentModelFileJs = fllamaWebPickPersistentModelFileJs;

function base64ToArrayBuffer(base64) {
    const binary = atob(base64.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function contentPartsFromImageTags(text) {
    const imageTagPattern = /<img\s+[^>]*src\s*=\s*(["'])(data:image\/[^;"']+;base64,([^"']+))\1[^>]*>/gi;
    const parts = [];
    let cursor = 0;
    let match;

    while ((match = imageTagPattern.exec(text)) !== null) {
        const leadingText = text.slice(cursor, match.index);
        if (leadingText.length > 0) {
            parts.push({ type: 'text', text: leadingText });
        }
        parts.push({ type: 'image', data: base64ToArrayBuffer(match[3]) });
        cursor = match.index + match[0].length;
    }

    if (parts.length === 0) {
        return text;
    }

    const trailingText = text.slice(cursor);
    if (trailingText.length > 0) {
        parts.push({ type: 'text', text: trailingText });
    }
    return parts;
}

function normalizeMessageContentForWllama(message) {
    const content = message.content;
    if (typeof content !== 'string') {
        return content;
    }
    return contentPartsFromImageTags(content);
}

function normalizeOpenAiRequestForWllama(openAiRequest) {
    return {
        ...openAiRequest,
        messages: (openAiRequest.messages || []).map((message) => ({
            ...message,
            content: normalizeMessageContentForWllama(message),
        })),
    };
}

function openAiRequestFromFllamaRequest(request) {
    if (request.openAiRequestObject) {
        return normalizeOpenAiRequestForWllama(request.openAiRequestObject);
    }
    if (request.openAiRequestJsonString) {
        return normalizeOpenAiRequestForWllama(JSON.parse(request.openAiRequestJsonString));
    }
    const tools = JSON.parse(request.toolsAsJsonString || '[]');
    const messages = JSON.parse(request.messagesAsJsonString || '[]');
    return normalizeOpenAiRequestForWllama({
        messages: messages.map((message) => ({
            role: message.role || 'user',
            content: typeof message.content === 'string'
                ? message.content
                : JSON.stringify(message.content),
        })),
        tools,
        ...(tools.length > 0 ? { tool_choice: 'required' } : {}),
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        frequency_penalty: request.penaltyFrequency,
        presence_penalty: request.penaltyRepeat,
    });
}

function chatTemplateFromRequest(request) {
    try {
        return openAiRequestFromFllamaRequest(request).jinja_template || undefined;
    } catch (_) {
        return undefined;
    }
}

function requestNParallel(request = {}) {
    if (typeof request.nParallel === 'number' && request.nParallel > 0) {
        return Math.floor(request.nParallel);
    }
    return DEFAULT_N_PARALLEL;
}

function modelKey(modelPath, request = {}) {
    return JSON.stringify({
        modelPath,
        mmprojPath: request.modelMmprojPath || '',
        contextSize: request.contextSize || 4096,
        nParallel: requestNParallel(request),
        numThreads: request.numThreads || 0,
        numGpuLayers: requestGpuLayers(request),
    });
}

function samplingFieldsFromRequest(request) {
    return {
        temp: request.temperature,
        top_p: request.topP,
        penalty_freq: request.penaltyFrequency,
        penalty_repeat: request.penaltyRepeat,
    };
}

function requestGpuLayers(request) {
    if (!navigator.gpu) return 0;
    if (typeof request.numGpuLayers === 'number' && request.numGpuLayers > 0) {
        return request.numGpuLayers;
    }
    return 99999;
}

async function loadModelIfNeeded(modelPath, request = {}, loadCallback = () => { }) {
    const key = modelKey(modelPath, request);
    if (serverWllama !== null && lastServerModelKey === key && serverWllama.isModelLoaded()) {
        loadCallback(1, 1);
        return serverWllama;
    }

    if (serverModelLoadPromise !== null && serverModelLoadKey === key) {
        console.info('[fllama_web_init.js.loadModelIfNeeded] waiting for in-flight model load ' + JSON.stringify({
            modelPath,
            requestId: request.requestId,
        }));
        const instance = await serverModelLoadPromise;
        loadCallback(1, 1);
        return instance;
    }

    const loadTask = async () => {
        const currentKey = modelKey(modelPath, request);
        if (serverWllama !== null && lastServerModelKey === currentKey && serverWllama.isModelLoaded()) {
            loadCallback(1, 1);
            return serverWllama;
        }
        console.info('[fllama_web_init.js.loadModelIfNeeded] starting serialized model load ' + JSON.stringify({
            modelPath,
            requestId: request.requestId,
        }));
        return loadModelIfNeededUnlocked(modelPath, request, loadCallback);
    };

    serverModelLoadKey = key;
    serverModelLoadPromise = serverModelLoadQueue.catch(() => { }).then(loadTask);
    serverModelLoadQueue = serverModelLoadPromise.catch((error) => {
        console.error('[fllama_web_init.js.loadModelIfNeeded] serialized model load failed', {
            modelPath,
            requestId: request.requestId,
            error,
        });
    });

    try {
        return await serverModelLoadPromise;
    } finally {
        if (serverModelLoadPromise !== null && serverModelLoadKey === key) {
            serverModelLoadPromise = null;
            serverModelLoadKey = '';
        }
    }
}

async function loadModelIfNeededUnlocked(modelPath, request = {}, loadCallback = () => { }) {
    const key = modelKey(modelPath, request);
    if (serverWllama !== null && lastServerModelKey === key && serverWllama.isModelLoaded()) {
        loadCallback(1, 1);
        return serverWllama;
    }

    if (serverWllama !== null) {
        try {
            await serverWllama.exit();
        } catch (error) {
            console.warn('[fllama_web_init.js.loadModelIfNeeded] error unloading previous model:', error);
        }
    }

    lastServerModelKey = key;
    serverWllama = createWllama();

    const loadConfig = {
        // Upstream ngxson/wllama's src/types/types.ts defines
        // `LogLevel.DEBUG = 1`. Keep DEBUG while validating the migration so
        // llama.cpp prints WebGPU/layer-offload diagnostics.
        log_level: 1,
        n_ctx: request.contextSize || 4096,
        n_threads: request.numThreads || Math.max(1, Math.min(4, navigator.hardwareConcurrency || 4)),
        n_gpu_layers: requestGpuLayers(request),
        n_batch: 512,
        n_parallel: requestNParallel(request),
        offload_kqv: true,
        flash_attn: true,
        useCache: true,
        jinja: true,
        progressCallback: ({ loaded, total }) => {
            const progress = total > 0 ? loaded / total : 0;
            loadCallback(progress, 0);
        },
    };

    async function doLoad(instance, config) {
        console.info('[fllama_web_init.js] loading model ' + JSON.stringify({
            modelPath,
            hasMmproj: Boolean(request.modelMmprojPath),
            hasWebGpu: Boolean(navigator.gpu),
            crossOriginIsolated: Boolean(globalThis.crossOriginIsolated),
            nCtx: config.n_ctx,
            nThreads: config.n_threads,
            nGpuLayers: config.n_gpu_layers,
            nBatch: config.n_batch,
            nParallel: config.n_parallel,
            offloadKqv: config.offload_kqv,
            flashAttn: config.flash_attn,
            useCache: config.useCache,
        }));

        const localFile = localModelFiles.get(modelPath);
        const localMmprojFile = localModelFiles.get(request.modelMmprojPath || '');
        if (localFile) {
            loadCallback(1, 0);
            await instance.loadModel(
                localMmprojFile ? [localFile, localMmprojFile] : [localFile],
                config
            );
        } else if (modelPath.startsWith('blob:')) {
            const blob = await fetch(modelPath).then((response) => response.blob());
            const mmprojBlob = request.modelMmprojPath
                ? await fetch(request.modelMmprojPath).then((response) => response.blob())
                : null;
            loadCallback(1, 0);
            await instance.loadModel(mmprojBlob ? [blob, mmprojBlob] : [blob], config);
        } else if (isIdbUrl(modelPath)) {
            // idb:// is a browser-local storage locator, not a fetchable .gguf
            // URL. Read the bytes and pass a File through wllama's local path.
            loadCallback(1, 0);
            await instance.loadModel(
                await modelFilesFromIdbUrls(modelPath, request.modelMmprojPath || ''),
                config
            );
        } else if (isFsaUrl(modelPath)) {
            // fsa:// points at a persisted File System Access handle. This is
            // the fastest web custom-model path: no GGUF copy into IndexedDB.
            loadCallback(1, 0);
            await instance.loadModel(
                await modelFilesFromFsaUrls(modelPath, request.modelMmprojPath || ''),
                config
            );
        } else {
            const source = request.modelMmprojPath
                ? { url: modelPath, mmprojUrl: request.modelMmprojPath }
                : modelPath;
            await instance.loadModelFromUrl(source, config);
        }
    }

    try {
        await doLoad(serverWllama, loadConfig);
    } catch (error) {
        if (navigator.gpu && loadConfig.n_gpu_layers !== 0) {
            console.warn('[fllama_web_init.js.loadModelIfNeeded] WebGPU load failed, retrying CPU:', error);
            try { await serverWllama.exit(); } catch (_) { }
            serverWllama = createWllama();
            await doLoad(serverWllama, { ...loadConfig, n_gpu_layers: 0 });
        } else {
            throw error;
        }
    }

    try {
        const metadata = serverWllama.getModelMetadata?.();
        console.info('[fllama_web_init.js] model loaded ' + JSON.stringify({
            modelPath,
            isSupportWebGPU: serverWllama.isSupportWebGPU?.(),
            isMultithread: serverWllama.isMultithread?.(),
            numThreads: serverWllama.getNumThreads?.(),
            nLayer: metadata?.hparams?.n_layer,
            nCtxTrain: metadata?.hparams?.n_ctx_train,
            modelType: metadata?.metadata?.['general.type'],
            architecture: metadata?.metadata?.['general.architecture'],
        }));
    } catch (error) {
        console.warn('[fllama_web_init.js] unable to read loaded model info', error);
    }

    loadCallback(1, 1);
    return serverWllama;
}

function textDeltaFromChunk(chunk) {
    const choice = chunk?.choices?.[0];
    const delta = choice?.delta || {};
    return delta.content || delta.reasoning_content || '';
}

function rawTextDeltaFromChunk(chunk) {
    const choice = chunk?.choices?.[0];
    return choice?.text || '';
}

function jsonPayloadFromParsedChunk(chunk) {
    return JSON.stringify(chunk);
}

function fllamaInferenceJs(request, callback) {
    request.requestId = nextRequestId++;
    const abortController = new AbortController();
    abortControllers.set(request.requestId, abortController);
    enqueueServerRequest('completion', request, () =>
        runCompletion(request, callback, abortController)
    ).catch((error) => {
        console.error('[fllama_web_init.js.fllamaInferenceJs] error:', error);
        callback(String(error?.message || error || 'Unknown fllama web error'), '', true);
    });
    return Promise.resolve(request.requestId);
}
window.fllamaInferenceJs = fllamaInferenceJs;

async function runCompletion(request, callback, abortController) {
    let lastText = '';
    try {
        if (abortController.signal.aborted) {
            callback(lastText, '', true);
            return;
        }
        const instance = await loadModelIfNeeded(request.modelPath, request);
        if (abortController.signal.aborted) {
            callback(lastText, '', true);
            return;
        }
        const stream = await instance.createChatCompletion({
            messages: [{ role: 'user', content: request.input || '' }],
            stream: true,
            model: request.modelPath,
            max_tokens: request.maxTokens,
            temperature: request.temperature,
            top_p: request.topP,
            frequency_penalty: request.penaltyFrequency,
            presence_penalty: request.penaltyRepeat,
            ...samplingFieldsFromRequest(request),
            abortSignal: abortController.signal,
        });

        for await (const chunk of stream) {
            if (abortController.signal.aborted) break;
            lastText += textDeltaFromChunk(chunk) || rawTextDeltaFromChunk(chunk);
            if (chunk?.timings) {
                console.info('[fllama_web_init.js] completion timings ' + JSON.stringify(chunk.timings));
            }
            callback(lastText, jsonPayloadFromParsedChunk(chunk), false);
        }
        callback(lastText, '', true);
    } finally {
        abortControllers.delete(request.requestId);
    }
}

function fllamaChatWebJs(request, loadCallback, inferenceCallback) {
    request.requestId = nextRequestId++;
    const abortController = new AbortController();
    abortControllers.set(request.requestId, abortController);
    enqueueServerRequest('chat', request, () =>
        runChat(request, loadCallback, inferenceCallback, abortController)
    ).catch((error) => {
        console.error('[fllama_web_init.js.fllamaChatWebJs] error:', error);
        inferenceCallback(String(error?.message || error || 'Unknown fllama web error'), '', true);
    });
    return Promise.resolve(request.requestId);
}
window.fllamaChatWebJs = fllamaChatWebJs;

async function runChat(request, loadCallback, inferenceCallback, abortController) {
    let lastText = '';
    try {
        if (abortController.signal.aborted) {
            inferenceCallback(lastText, '', true);
            return;
        }
        const instance = await loadModelIfNeeded(request.modelPath, request, loadCallback);
        if (abortController.signal.aborted) {
            inferenceCallback(lastText, '', true);
            return;
        }
        const openAiRequest = openAiRequestFromFllamaRequest(request);
        const stream = await instance.createChatCompletion({
            ...openAiRequest,
            stream: true,
            model: request.modelPath,
            max_tokens: request.maxTokens ?? openAiRequest.max_tokens,
            temperature: request.temperature ?? openAiRequest.temperature,
            top_p: request.topP ?? openAiRequest.top_p,
            frequency_penalty: request.penaltyFrequency ?? openAiRequest.frequency_penalty,
            presence_penalty: request.penaltyRepeat ?? openAiRequest.presence_penalty,
            ...samplingFieldsFromRequest(request),
            abortSignal: abortController.signal,
        });

        for await (const chunk of stream) {
            if (abortController.signal.aborted) break;
            lastText += textDeltaFromChunk(chunk);
            if (chunk?.timings) {
                console.info('[fllama_web_init.js] chat timings ' + JSON.stringify(chunk.timings));
            }
            inferenceCallback(lastText, jsonPayloadFromParsedChunk(chunk), false);
        }
        inferenceCallback(lastText, '', true);
    } finally {
        abortControllers.delete(request.requestId);
    }
}

async function fllamaWebModelDeleteJs(modelPath) {
    localModelFiles.delete(modelPath);
    if (isFsaUrl(modelPath)) {
        await deleteFsaModelHandleRecord(modelPath);
    }
    if (lastServerModelKey.includes(modelPath) && serverWllama !== null) {
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
        const model = models.find((m) => m.url === modelPath || m.mmprojUrl === modelPath);
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
    if (isIdbUrl(modelPath)) {
        return true;
    }
    if (isFsaUrl(modelPath)) {
        return await fsaModelHandleExists(modelPath);
    }
    try {
        const manager = (serverWllama || createWllama()).modelManager;
        const models = await manager.getModels();
        return models.some((m) => m.url === modelPath || m.mmprojUrl === modelPath);
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

    const id = `fllama-local-file://${crypto.randomUUID()}/${encodeURIComponent(file.name)}`;
    localModelFiles.set(id, file);
    return id;
}
window.fllamaWebPickModelJs = fllamaWebPickModelJs;

async function fllamaTokenizeJs(_modelPath, input) {
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
    const abortController = abortControllers.get(requestId);
    if (abortController) {
        abortController.abort();
    }
}
window.fllamaCancelInferenceJs = fllamaCancelInferenceJs;
