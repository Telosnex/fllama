import { action } from "./llama-actions.js";

class LlamaCpp {
    // callback have to be defined before load_worker
    constructor(request, init_callback, write_result_callback, on_complete_callback) {
        this.url = request.modelPath;
        this.modelSize = request.modelArrayBuffer ? request.modelArrayBuffer.byteLength : 0;
        this.init_callback = init_callback;
        this.write_result_callback = write_result_callback;
        this.on_complete_callback = on_complete_callback;
        this.loadWorker();
    }
    
    loadWorker() {
        this.worker = new Worker(
            new URL("./llama-worker.js", import.meta.url),
            {type: "module"}
        );
        
        
        this.worker.onmessage = (event) => {
            switch (event.data.event) {
                case action.INITIALIZED:
                    console.debug("initialized");
                    // Load Model
                    if (this.init_callback) {
                        this.init_callback();
                    }

                    break;
                case action.WRITE_RESULT:
                    // Capture result
                    if (this.write_result_callback) {
                        this.write_result_callback(event.data.text);
                    }

                    break;
                case action.RUN_COMPLETED:
                    // Execution Completed
                    if (this.on_complete_callback) {
                        this.on_complete_callback();
                    }
                case action.LOAD:
                    break;
            }
        };
        console.debug("[llama.cpp] telling worker to load url", this.url);
        this.worker.postMessage({
            event: action.LOAD,
            url: this.url,
            modelSize: this.modelSize,
        });
    }

    run({
        prompt,
        chatml=false,
        n_predict=-2,
        ctx_size=2048,
        batch_size=512,
        temp=0.8,
        n_gpu_layers=0,
        n_threads=1,
        top_k=40,
        top_p=0.9,
        no_display_prompt=true,
        grammar,
    }={}) {
        this.worker.postMessage({
            event: action.RUN_MAIN,
            prompt,
            chatml,
            n_predict,
            ctx_size,
            batch_size,
            temp,
            n_gpu_layers,
            top_k,
            top_p,
            no_display_prompt,
            grammar
        });
    }
}

export { LlamaCpp };