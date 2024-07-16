import * as webllm from "https://esm.run/@mlc-ai/web-llm";
import { action } from "../fllama_wasm_actions.js";

const availableModels = webllm.prebuiltAppConfig.model_list.map(
    (m) => m.model_id,
);

// Available models
let llama8b = "Llama-3-8B-Instruct-q4f16_1-MLC";
let qwen05b = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
let tinyLlama = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";
let phi3mini = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
let openHermesMistral = "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC";
let selectedModel = phi3mini;

// Map to keep track of active requests
let activeRequests = new Map();

// Queue for incoming requests and processing flag
let requestQueue = [];
let isProcessing = false;

let lastEngine = null;
let lastSelectedModel = null;

export async function handleMlcMessage(message, progressCallback) {
    const { event, request } = message;
    if (event === action.MLC_INFERENCE) {
        console.log("[fllama_mlc_module] Received MLC_INFERENCE request", request);
        requestQueue.push(request);
        await processNextRequest(progressCallback);
    } else if (event === action.INFERENCE_CANCEL) {
        console.log("[fllama_mlc_module] Received INFERENCE_CANCEL request for", message.requestId);
        handleCancellation(message.requestId);
    } else {
        console.error("[fllama_mlc_module] Ignoring unknown event", event);
    }
}

// Function to handle request cancellation
function handleCancellation(requestId) {
    requestQueue = requestQueue.filter(req => req.requestId !== requestId);
    if (activeRequests.has(requestId)) {
        console.log(`Cancelling request ${requestId}`);
        activeRequests.delete(requestId);
    } else {
        console.log(`Request ${requestId} is not active`);
    }
}

// Function to process requests serially
async function processNextRequest(progressCallback) {
    console.log("[fllama_mlc_module] Processing next request");
    if (isProcessing || requestQueue.length === 0) {
        return;
    }

    isProcessing = true;
    const request = requestQueue.shift();
    const requestId = request.requestId;
    console.log(`[fllama_mlc_module] Processing request ${requestId}`);

    activeRequests.set(requestId, request);
    if (!request.modelId || !availableModels.includes(request.modelId)) {
        console.error(`[fllama_mlc_module] Invalid model: ${request.modelId}`);
        progressCallback({
            type: 'error',
            error: `Invalid model: ${request.modelId}`,
            requestId: requestId,
        });
        isProcessing = false;
        processNextRequest(progressCallback);
        return;
    }
    const selectedModel = request.modelId;
    try {
        let engine;
        if (lastEngine && selectedModel === lastSelectedModel) {
            console.log("Reusing existing engine");
            engine = lastEngine;
        } else {
            console.log("Creating new engine");
            engine = await initializeEngine(selectedModel, requestId, progressCallback);
        }

        let curMessage = "";

        console.log("Creating session.");
        const messagesAsJsonString = request.messagesAsJsonString;
        const messages = JSON.parse(messagesAsJsonString);
        const toolsAsJsonString = request.toolsAsJsonString;
        const tools = JSON.parse(toolsAsJsonString);

        const supportedModels = ["Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC", "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC", "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC"];
        const requestObject = {
            temperature: request.temperature || 0.0,
            top_p: request.top_p || 1.0,
            repetition_penalty: request.repetition_penalty,
            frequency_penalty: request.frequency_penalty,
            max_tokens: request.maxTokens || (250 * 4 / 3),
            stream: true,
            messages,
            stream_options: { include_usage: true },
        };

        if (tools.length > 0) {
            console.log("tools[0] is", tools[0]);
            if (supportedModels.includes(selectedModel)) {
                requestObject.tools = tools;
            } else {
                const firstTool = tools[0];
                const schemaAsJsonString = firstTool.function.parameters;
                const schema = JSON.parse(schemaAsJsonString);
                requestObject.response_format = { "type": "json_object", "schema": schema };
                requestObject.messages.push({
                    role: "user",
                    content: tools.map(tool => {
                        return ({
                            type: "tool",
                            tool: tool
                        }).toString();
                    }).join("\n") + "\n\nUse one of the tools above to help you with your task."
                });
            }
        }
        console.log("Starting inference for request", requestId, "with request object", requestObject);
        const completion = await engine.chat.completions.create(requestObject);
        for await (const chunk of completion) {
            if (!activeRequests.has(requestId)) {
                console.log(`Request ${requestId} was cancelled`);
                progressCallback({
                    type: 'inferenceProgress',
                    requestId,
                    text: curMessage,
                    done: true
                });
                engine.interruptGenerate();
                return;
            }

            const curDelta = chunk.choices[0]?.delta.content;
            if (curDelta) {
                curMessage += curDelta;
                progressCallback({
                    type: 'inferenceProgress',
                    requestId,
                    text: curMessage,
                    done: false
                });
            }
        }

        console.log("Inference finished.");
        const finalMessage = await engine.getMessage();
        progressCallback({
            type: 'inferenceProgress',
            requestId,
            text: finalMessage,
            done: true
        });
        console.log("Posted inference result.");
    } catch (error) {
        progressCallback({
            type: 'error',
            requestId,
            error: error.message
        });
    } finally {
        activeRequests.delete(requestId);
        isProcessing = false;
        processNextRequest(progressCallback);
    }
}

const registerServiceWorker = async () => {
    console.log("[fllama_mlc_worker.js] Registering service worker");
    if ("serviceWorker" in navigator) {
        try {
            console.log("[fllama_mlc_worker.js] Unregistering existing service worker");
            await navigator.serviceWorker.getRegistration('/').then(registration => registration?.unregister());
            console.log("[fllama_mlc_worker.js] Registering new service worker");
            const registration = await navigator.serviceWorker.register(
                new URL("/mlc/fllama_mlc_core_worker.js", import.meta.url),
                { type: "module",  scope: '/mlc/' },
            );
            if (registration.installing) {
                console.log("[fllama_mlc_worker.js] Service worker installing");
            } else if (registration.waiting) {
                console.log("[fllama_mlc_worker.js] Service worker installed");
            } else if (registration.active) {
                console.log("[fllama_mlc_worker.js] Service worker active");
            }
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};
console.log("Registering service worker");
registerServiceWorker();


async function initializeEngine(selectedModel, requestId, progressCallback) {
    console.log("Initializing engine");
    const progressCallbackWrapper = (report) => {
        console.log("Progress report", report);
        let downloadProgress = 0;
        let loadingProgress = 0;

        if (report.text && report.text.includes("Loading model from cache")) {
            downloadProgress = 1.0;
            const match = report.text.match(/\[(\d+)\/(\d+)\]/);
            if (match) {
                const [_, current, total] = match.map(Number);
                loadingProgress = current / total;
            }
        } else {
            downloadProgress = report.progress || 0;
            loadingProgress = 0.0;
        }

        progressCallback({
            type: 'loadProgress',
            requestId,
            downloadProgress,
            loadingProgress,
            text: report.text,
            timeElapsed: report.timeElapsed
        });
    };



    try {
        await registerServiceWorker();
        console.log("Service Worker ready state:", await navigator.serviceWorker.ready);
        console.log("Service Worker controller:", navigator.serviceWorker.controller);
        console.log("Initializing engine for model ID.", selectedModel);
        const engine = await webllm.CreateServiceWorkerMLCEngine(selectedModel, {
            initProgressCallback: progressCallbackWrapper,
        });
        console.log("Initialized engine for model ID", selectedModel);
        lastEngine = engine;
        lastSelectedModel = selectedModel;

        engine.config.conv_template.system_message = "";
        return engine;

    } catch (error) {
        console.error("Error initializing engine", error);
        throw error;
    }
}