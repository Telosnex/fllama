import { action } from "./llama-actions.js";
import { loadBinaryResource } from "./llama-model-storage.js";
import Module from "./llama-main.js";

// WASM Module
let module;

// hard-coded filepath for loaded model in vfs
const model_path = "/models/model.bin";

// Function to send model line result
const print = (text) => {
    postMessage({
        event: action.WRITE_RESULT,
        text: text,
    });
};

// Function to initialize worker 
// and download model file
const decoder = new TextDecoder('utf-8');
const punctuationBytes = [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 58, 59, 60, 61, 62, 63, 64, 91, 92, 93, 94, 95, 96, 123, 124, 125, 126];
const whitespaceBytes = [32, 9, 10, 13, 11, 12];
const splitBytes = [...punctuationBytes, ...whitespaceBytes];
const stdoutBuffer = [];
const stderrBuffer = [];

const stdin  = () => {};

const stdout = (c) => {
    stdoutBuffer.push(c);

    if (splitBytes.indexOf(c) == -1) {
        return;
    }

    const text = decoder.decode(new Uint8Array(stdoutBuffer));
    stdoutBuffer.splice(0, stdoutBuffer.length);
    print(text);
};

const stderrFlushSize = 1024; // Flush when buffer exceeds this size

// Modified stderr to accumulate output and flush based on conditions
const stderr = (c) => {
    stderrBuffer.push(c);

    // Flush conditions: buffer size or newline character
    if (stderrBuffer.length > stderrFlushSize || c === 10) {
        const errorText = decoder.decode(new Uint8Array(stderrBuffer));
        stderrBuffer.length = 0; // Clear the buffer
        console.debug('[stderr] ' + errorText.trim()); // Log error, trim for aesthetics
    }
};

const initWorker = async (modelPath, modelSize) => {
    console.log("[llama-worker.js] initializing worker at model path ", modelPath);

    const emscrModule = {
        noInitialRun: true,
        preInit: [() => {
            emscrModule.TTY.register(emscrModule.FS.makedev(5, 0), {
                get_char: tty => stdin(tty),
                put_char: (tty, val) => { tty.output.push(val); stdout(val); },
                flush: tty => tty.output = [],
                fsync: tty => console.log("fsynced stdout (EmscriptenRunnable does nothing in this case)")
            });

            emscrModule.TTY.register(emscrModule.FS.makedev(6, 0), {
                get_char: tty => stdin(tty),
                put_char: (tty, val) => { tty.output.push(val); stderr(val); },
                flush: tty => tty.output = [],
                fsync: tty => console.log("fsynced stderr (EmscriptenRunnable does nothing in this case)")
            });
        }],
    };

    module = await Module(emscrModule);
    console.log("[llama-worker.js] Module loaded", module);

    const initCallback = (bytes) => {
        // create vfs folder for storing model bins
        module['FS_createPath']("/", "models", true, true);

        // load model
        module['FS_createDataFile']('/models', 'model.bin', bytes, true, true, true);
        
        // update callback action to worker main thread
        postMessage({
            event: action.INITIALIZED
        });
    }
    console.log("[llama-worker.js] Loading binary resource from model path ", modelPath);
    loadBinaryResource(modelPath, modelSize, initCallback);
}

const run_main = (
    prompt,
    chatml,
    n_predict,
    ctx_size,
    batch_size,
    temp,
    n_gpu_layers,
    top_k,
    top_p,
    no_display_prompt
) => {
    const args = [
        "--model", model_path,
        "--n-predict", n_predict.toString(),
        "--ctx-size", ctx_size.toString(),
        "--temp", temp.toString(),
        "--top_k", top_k.toString(),
        "--top_p", top_p.toString(),
        // "--no-mmap",
        "--simple-io",
        "--prompt", prompt.toString(),
    ];

    if (!!globalThis.SharedArrayBuffer) {
        const threads = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));
        args.push("--threads");
        args.push(threads.toString());
    }

    if (chatml) {
        args.push("--chatml");
    }

    if (no_display_prompt) {
        args.push("--no-display-prompt");
    }
    console.log("[llama-worker] Running main with args ", args);

    try {
        module['callMain'](args);
    } catch (e) {
        console.error("[llama-worker] Error running main", e);
        console.error("[llama-worker] Stringified error " + e.toString());
        console.error('[llama-worker] Module:', module);
        console.error('[llama-worker] Args:', args);
    }

    postMessage({
        event: action.RUN_COMPLETED
    });
} 

// Worker Events
self.addEventListener('message', (e) => {
    console.log("[llama-worker] Received message", e.data);
    switch (e.data.event) {
        case action.LOAD:
            console.log("[llama-worker] action.LOAD calling init worker for data:", e.data);
            // load event
            initWorker(e.data.url, e.data.modelSize);
            console.log("[llama-worker] initWorker loaded model");
            break;
        case action.RUN_MAIN:
            if (module === undefined) {
                console.error("[llama-worker] run_main returning early, module is undefined");
                return;
            }
            console.log("[llama-worker] Running main");
            // run main
            run_main(
                e.data.prompt,
                e.data.chatml,
                e.data.n_predict,
                e.data.ctx_size,
                e.data.batch_size,
                e.data.temp,
                e.data.n_gpu_layers,
                e.data.top_k,
                e.data.top_p,
                e.data.no_display_prompt,
            );

            break;
    }
}, false);
