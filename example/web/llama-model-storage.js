const cacheName = "telosnex-llama-cpp-wasm-cache";

async function loadBinaryResource(url, modelSize, callback) {
    // Define cache and cacheKey variables
    let cache = null;
    const cacheKey = url.startsWith('blob:') ? 'cached_blob_model' : url;

    // Check cache availability in a Web Worker environment
    if (typeof self !== "undefined" && self.caches) {
        console.debug("[llama-model-storage] Caches are available");

        try {
            cache = await self.caches.open('llama-model-storage');
            const cachedResponse = await cache.match(cacheKey);
            
            if (cachedResponse) {
                const data = await cachedResponse.arrayBuffer();
                // Check for model size mismatch if the cached model is a blob URL
                if (cacheKey === 'cached_blob_model' && data.byteLength !== modelSize) {
                    console.error("[llama-model-storage] Cached model size mismatch. Expected:", modelSize, "Got:", data.byteLength);
                } else {
                    const byteArray = new Uint8Array(data);
                    console.debug("[llama-model-storage] Loaded resource from cache:", cacheKey);
                    callback(byteArray);
                    return;
                }
            }
        } catch (error) {
            console.error("[llama-model-storage] Error accessing cache:", error);
        }
    } else {
        console.debug("[llama-model-storage] `window` or caches are not available");
    }

    // Fallback to fetching the resource and update cache if necessary
    console.log("[llama-model-storage] Fetching resource:", url);
    fetch(url).then(async response => {
        const arrayBuffer = await response.arrayBuffer();
        const byteArray = new Uint8Array(arrayBuffer);
        console.debug("[llama-model-storage] Loaded binary resource from URL:", url, "Resource size:", byteArray.length);

        if (cache) {
            await cache.put(cacheKey, new Response(arrayBuffer));
            console.debug(`[llama-model-storage] Cached the data for ${cacheKey === 'cached_blob_model' ? 'blob URL' : 'URL'}:`, cacheKey);
        }

        callback(byteArray);
    }).catch(error => {
        console.error("[llama-model-storage] Error fetching or caching resource:", url, error);
    });
}

export { loadBinaryResource };