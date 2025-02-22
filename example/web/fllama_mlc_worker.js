import * as webllm from "https://esm.run/@mlc-ai/web-llm";
import { action } from "./fllama_wasm_actions.js";

const mlcPrebuiltAppConfigModels = webllm.prebuiltAppConfig.model_list.map(
    (m) => m.model_id,
);

// From https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
// Available models
let llama8b = "Llama-3-8B-Instruct-q4f16_1-MLC";
let qwen05b = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
let tinyLlama = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";
let phi3mini = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
let openHermesMistral = "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC";
let deepSeekR1Llama38B = 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC';
let deepSeekR1Qwen15B = 'DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC';
let selectedModel = phi3mini;

/**
 * Returns a customized version of the prebuilt app config with DeepSeek model added
 * @returns {AppConfig} The modified configuration object
 */
export function getFllamaMLCAppConfig() {
    // Create a deep copy of the prebuilt config to avoid modifying the original
    const customConfig = {
        ...webllm.prebuiltAppConfig,
        model_list: [...webllm.prebuiltAppConfig.model_list]
    };

    // Add the DeepSeek model to the beginning of the model list
    customConfig.model_list.unshift({
        model: "https://huggingface.co/mlc-ai/DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC",
        model_id: "DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC",
        model_lib: webllm.modelLibURLPrefix + webllm.modelVersion + "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
        low_resource_required: true,
        vram_required_MB: 1629.75,
        overrides: {
            context_window_size: 4096,
        },
    });

    return customConfig;
}

// Map to keep track of active requests
let activeRequests = new Map();

// Queue for incoming requests and processing flag
let requestQueue = [];
let isProcessing = false;

// Main message event listener
self.addEventListener('message', (e) => {
    const { event, request } = e.data;
    if (event === action.MLC_INFERENCE) {
        console.log("[fllama_mlc_worker] Received MLC_INFERENCE request", request);
        requestQueue.push(request);
        processNextRequest();
    } else if (event === action.INFERENCE_CANCEL) {
        console.log("[fllama_mlc_worker] Received INFERENCE_CANCEL request for", e.data.requestId);
        handleCancellation(e.data.requestId);
    } else {
        console.error("[fllama_mlc_worker] Ignoring unknown event", event);
    }
});

// Function to handle request cancellation
function handleCancellation(requestId) {
    // Remove the request from the queue if it's still there
    requestQueue = requestQueue.filter(req => req.requestId !== requestId);
    if (activeRequests.has(requestId)) {
        console.log(`Cancelling request ${requestId}`);
        activeRequests.delete(requestId);
    } else {
        console.log(`Request ${requestId} is not active`);
    }
}


let lastEngine = null;
let lastSelectedModel = null;

// Function to process requests serially
async function processNextRequest() {
    console.log("[fllama_mlc_worker] Processing next request");
    if (isProcessing || requestQueue.length === 0) {
        return;
    }

    isProcessing = true;
    const request = requestQueue.shift();
    const requestId = request.requestId;
    console.log(`[fllama_mlc_worker] Processing request ${requestId}`);

    // Store the request in our active requests map
    activeRequests.set(requestId, request);
    if (!request.modelId || (!mlcPrebuiltAppConfigModels.includes(request.modelId) && (request.modelId != deepSeekR1Qwen15B) )) {
        console.error(`[fllama_mlc_worker] Invalid model: ${request.modelId}`);
        self.postMessage({
            type: 'error',
            error: `Invalid model: ${request.modelId}`,
            requestId: requestId,
        });
        isProcessing = false;
        processNextRequest(); // Process the next request in the queue
        return;
    }
    const selectedModel = request.modelId || phi3mini;
    try {
        let engine;
        if (lastEngine && selectedModel === lastSelectedModel) {
            console.log("Reusing existing engine");
            engine = lastEngine;
        } else {
            console.log("Creating new engine");
            engine = await initializeEngine();
        }

        let curMessage = "";

        console.log("Creating session.");
        const messagesAsJsonString = request.messagesAsJsonString;
        const messages = JSON.parse(messagesAsJsonString);
        const toolsAsJsonString = request.toolsAsJsonString;
        const tools = JSON.parse(toolsAsJsonString);
        // If there are no messages, MLC's code crashes due to trying to access 'role' on a null object
        if (messages.length === 0) {
            messages.push({ role: "system", content: "" });
        }

        // MLC only supports system messages at the start of the conversation.
        messages.forEach((message, index) => {
            if (index > 0 && message.role === "system") {
                message.role = "user";
            }
        });

        // MLC only supports user or tool messages at the end of the conversation.
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role !== "user" && lastMessage.role !== "tool") {
                messages.push({ role: "user", content: "Continue from there." });
            }
        }

        // Note error for tools:
        // fllama_wasm_init.js:139 [fllama_wasm_init.js.mlcInferenceWithWorker] received error message Qwen2-0.5B-Instruct-q4f16_1-MLC is not supported for ChatCompletionRequest.tools. Currently, models that support function calling are: Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC, Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC, Hermes-2-Pro-Mistral-7B-q4f16_1-MLC
        const supportedModels = ["Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC", "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC", "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC"];
        const requestObject = {
            // See params @ https://github.com/mlc-ai/web-llm/blob/main/src/openai_api_protocols/chat_completion.ts#L71
            // TODO: tool_choice, response_format
            temperature: request.temperature || 0.0,
            top_p: request.top_p || 1.0,
            repetition_penalty: request.repetition_penalty,
            frequency_penalty: request.frequency_penalty,
            max_tokens: request.maxTokens || (250 * 4 / 3), // i.e. one page = 250 words
            stream: true,
            messages,
            stream_options: { include_usage: true },
        };
        // If tools is not empty
        if (tools.length > 0) {
            console.log("tools[0] is", tools[0]);
            // If model is in supported models, set tools on request object
            if (supportedModels.includes(selectedModel)) {
                requestObject.tools = tools;
            } else {
                const firstTool = tools[0];
                const schemaAsJsonString = firstTool.function.parameters;
                const schema = JSON.parse(schemaAsJsonString);
                requestObject.response_format = { "type": "json_object", "schema": schema };
                // Insert message with tools.
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
            // Check if the request has been cancelled
            if (!activeRequests.has(requestId)) {
                console.log(`Request ${requestId} was cancelled`);
                self.postMessage({
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
                self.postMessage({
                    type: 'inferenceProgress',
                    requestId,
                    text: curMessage,
                    done: false
                });
            }
        }

        console.log("Inference finished.");
        const finalMessage = await engine.getMessage();
        self.postMessage({
            type: 'inferenceProgress',
            requestId,
            text: finalMessage,
            done: true
        });
        console.log("Posted inference result.");
    } catch (error) {
        console.log("Error processing request", error);
        self.postMessage({
            type: 'error',
            requestId,
            error: error.message
        });
    } finally {
        // Remove the request from our active requests map
        activeRequests.delete(requestId);
        isProcessing = false;
        processNextRequest(); // Process the next request in the queue
    }

    async function initializeEngine() {
        console.log("Initializing engine");

        // 2025-02-21: Manually adding DeepSeek 1.5B; MLC doesn't support it yet, it is
        // commented out a month ago, when lading, in their prebuiltAppConfig.model_list 
        // with: "Qwen2-1.5B is experiencing correctness issue, hence commented for now."
        
        // Create a deep copy of the prebuilt config to avoid modifying the original
        const customConfig = {
            ...webllm.prebuiltAppConfig,
            model_list: [...webllm.prebuiltAppConfig.model_list]
        };

        // Add the DeepSeek model to the beginning of the model list
        customConfig.model_list.unshift({
            model: "https://huggingface.co/mlc-ai/DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC",
            model_id: "DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC",
            model_lib: webllm.modelLibURLPrefix + webllm.modelVersion + "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
            low_resource_required: true,
            vram_required_MB: 1629.75,
            overrides: {
                context_window_size: 4096,
            },
        });

        // Initialize the engine with the custom config
        const engine = new webllm.MLCEngine({
            appConfig: customConfig,
        });

        engine.setInitProgressCallback((report) => {
            let downloadProgress = 0;
            let loadingProgress = 0;

            if (report.text && report.text.includes("Loading model from cache")) {
                downloadProgress = 1.0;

                // Extract progress from text like [21/24]
                const match = report.text.match(/\[(\d+)\/(\d+)\]/);
                if (match) {
                    const [_, current, total] = match.map(Number);
                    loadingProgress = current / total;
                }
            } else {
                downloadProgress = report.progress || 0;
                loadingProgress = 0.0;
            }

            self.postMessage({
                type: 'loadProgress',
                requestId,
                downloadProgress,
                loadingProgress,
                text: report.text,
                timeElapsed: report.timeElapsed
            });
        });

        try {
            // Doesn't make sense to set anything in config, as we cache the engine, and the config
            // parameters vary per request (ex. temperature, top_p, etc.)
            const config = {};
            await engine.reload(selectedModel, config);
            console.log("Initialized engine for model ID", selectedModel);
            lastEngine = engine;
            lastSelectedModel = selectedModel;

            // *Nothing* else works other than poking at this thing we're probably not expected to touch.
            // Tried:
            // - overriding in config.convo_config
            // - reimplemnting the built-in list of models
            // It seems the default config JSON for the model will always be used. So either:
            // - we rehost the models and change the config JSON for each
            // - we poke at the engine object after it's been initialized
            // 2024-09-02: For some reason Phi-3.5 throws on this.
            try {
                engine.config.conv_template.system_message = "";
            } catch (systemMessageError) {
                console.warn("Error setting system_message to empty string:", systemMessageError);
            }

            return engine;
        } catch (error) {
            console.error("Error initializing engine", error);
            throw error;
        }
    }
}