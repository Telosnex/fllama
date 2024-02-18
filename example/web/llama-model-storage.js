const cacheName = "telosnex-llama-cpp-wasm-cache";

async function loadBinaryResource(url, callback) {
    let cache = null, window = self;

    // Try to find if the model data is cached in Web Worker memory.
    if (typeof window === "undefined") {
        console.debug("`llama-model-storage] window` is not defined");
    } else if (window && window.caches) {
        console.debug("llama-model-storage] Caches are available");
        cache = await window.caches.open(cacheName);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
            const data = await cachedResponse.arrayBuffer();
            const byteArray = new Uint8Array(data);
            console.debug("[llama-model-storage] Loaded binary resource from cache", url);
            callback(byteArray);
            return;
        }
    }

    console.log("[llama-model-storage] loadBinaryResource", url, callback, cache)
    // Download model and store in cache
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(async arrayBuffer => {
            if (arrayBuffer) {
                console.debug("[llama-model-storage] Loaded binary resource from ", url);
                const byteArray = new Uint8Array(arrayBuffer);
                console.debug("[llama-model-storage] Resource size: ", byteArray.length);

                if (cache) {
                    await cache.put(url, new Response(arrayBuffer))
                };

                callback(byteArray);
            } else {
                console.error("[llama-model-storage] Failed to load binary resource from ", url);
            }
        }).catch(error => {
            console.error("[llama-model-storage] Error fetching resource:", url, error);
            console.error("[llama-model-storage] Stringified error:", JSON.stringify(error));
        });

    // const req = new XMLHttpRequest();
    // req.open("GET", url, true);
    // req.responseType = "arraybuffer";

    // req.onload = async (_) => {
    //     const arrayBuffer = req.response; // Note: not req.responseText

    //     if (arrayBuffer) {
    //         console.debug("[llama-model-storage] Loaded binary resource from ", url);
    //         const byteArray = new Uint8Array(arrayBuffer);
    //         console.debug("[llama-model-storage] Resource size: ", byteArray.length);

    //         if (cache) {
    //             await cache.put(url, new Response(arrayBuffer))
    //         };

    //         callback(byteArray);
    //     } else {
    //         console.error("[llama-model-storage] Failed to load binary resource from ", url);
    //     }
    // };

    // req.onerror = (e) => {
    //     console.error("[llama-model-storage] Network error while fetching resource:", url, e);
    //     console.error("[llama-model-storage] Network error while fetching resource:", url, e, "Status:", req.status, req.statusText);
    //     console.error("[llama-model-storage] Stringified error:", JSON.stringify(e));
    // };

    // // Handle timeout
    // req.ontimeout = (e) => {
    //     console.error("Request timed out:", url, e);
    // };

    console.log("[llama-model-storage] Initiating request:", url);
    // req.send(null);
    console.log("[llama-model-storage] Request sent");
}

export { loadBinaryResource };