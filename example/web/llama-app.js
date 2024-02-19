import { LlamaCpp } from "./llama.js";

let app;

// `request` defined as JSFllamaInfRequest in fllama_html.dart.
const runLlamaWasm = (modelUrl, request, callback, messageId) => {
  console.log("[llama-app] runLlamaWasm", modelUrl, prompt, messageId);
  var accumulatedText = "";

  app = new LlamaCpp(
    request,
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
        // logger
        no_display_prompt: true,
        grammar: request.grammar,
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