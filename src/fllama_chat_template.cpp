
#include <stdio.h>

// LLaMA.cpp cross-platform support
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif
#if TARGET_OS_IOS
#include "../ios/llama.cpp/ggml.h"
#elif TARGET_OS_OSX
#include "../macos/llama.cpp/ggml.h"
#else
#include "ggml.h"
#endif

const char *fllama_get_chat_template(const char *fname) {
  struct ggml_context *meta = NULL;

  struct gguf_init_params params = {
      /*.no_alloc = */ true,
      /*.ctx      = */ &meta,
  };

  struct gguf_context *ctx = gguf_init_from_file(fname, params);
  if (!ctx) {
    fprintf(stderr, "Unable to load model to get chat template: %s\n", fname);
    return ""; // Return NULL to indicate failure to load or find the value.
  }

  const char *result = "";

  const char *targetKey = "tokenizer.chat_template";
  const int keyidx = gguf_find_key(ctx, targetKey);

  if (keyidx >= 0) { // Key found.
    const char *keyValue = gguf_get_val_str(ctx, keyidx);
    if (keyValue) {
      // If keyValue is not null, assign our result to the key value.
      result = keyValue;
    } else {
      // Key was found, but it doesn't have an associated string value, or the
      // value is null.
      printf("%s: key '%s' found, but it has no associated string value or "
             "value is null.\n",
             __func__, targetKey);
      // result already initialized to "", so just leave it as it is.
    }
  } else {
    printf("%s: key '%s' not found.\n", __func__, targetKey);
    // result already initialized to "", so just leave it as it is.
  }

  // Assuming gguf_free(ctx) should be called regardless of the conditional
  // branches above.
  ggml_free(meta);
  gguf_free(ctx);

  return result;
}
