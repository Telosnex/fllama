import { LlamaCpp } from "./llama.js";

let app;


const onModelLoaded = () => {
  const prompt = "hello world";
  console.debug("[llama-app] onModelLoaded");
  app.run({
    prompt: prompt,
    ctx_size: 2048,
    temp: 0.8,
    top_k: 40,
    no_display_prompt: true,
  });
}

const onMessageChunk = (text) => {
  console.debug("[llama-app] onMessageChunk", text);
};

const onComplete = () => {
  console.debug("[llama-app] onComplete");
};

// `request` defined as JSFllamaInfRequest in fllama_html.dart.
const runLlamaWasm = (modelUrl, request, callback, messageId) => {
  console.log("[llama-app] runLlamaWasm", modelUrl, prompt, messageId);
  var accumulatedText = "";

  app = new LlamaCpp(
    modelUrl,
    () => {
      console.debug("[llama-app] onModelLoaded");
      console.debug("[llama-app] run for request", request);
      // llama.js
      app.run({
        ctx_size: request.contextSize,
        prompt: request.input,
        n_predict: request.maxTokens,
        // model path skip
        // model mmproj path skip
        n_gpu_layers: request.numGpuLayers,
        n_threads: request.numThreads,
        temp: request.temperature,
        // penaltyFrequency
        // penaltyRepeat
        top_p: request.topP,
        // grammar
        // logger
        no_display_prompt: true,
      });
    },
    (text) => { 
      accumulatedText += text;
      callback(accumulatedText, false);
    },
    () => { callback(accumulatedText, true) },
  );
};

export { runLlamaWasm };