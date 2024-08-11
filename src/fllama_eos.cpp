#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
// iOS-specific includes
#include "../ios/llama.cpp/common/base64.hpp"
#include "../ios/llama.cpp/common/common.h"
#include "../ios/llama.cpp/common/sampling.h"
#include "../ios/llama.cpp/ggml/include/ggml.h"
#include "../ios/llama.cpp/include/llama.h"

#elif TARGET_OS_OSX
// macOS-specific includes
#include "../macos/llama.cpp/common/base64.hpp"
#include "../macos/llama.cpp/common/common.h"
#include "../macos/llama.cpp/common/sampling.h"
#include "../macos/llama.cpp/ggml/include/ggml.h"
#include "../macos/llama.cpp/include/llama.h"
#else
// Other platforms
#include "base64.hpp"
#include "common.h"
#include "ggml.h"
#include "llama.h"
#include <climits>
#endif

#include "fllama_eos.h"

static int gguf_data_to_int(enum gguf_type type, const void *data, int i);

extern "C" {
EMSCRIPTEN_KEEPALIVE const char *fllama_get_eos_token(const char *fname) {
  struct ggml_context *meta = NULL;

  struct gguf_init_params params = {
      /*.no_alloc = */ true,
      /*.ctx      = */ &meta,
  };

  struct gguf_context *ctx = gguf_init_from_file(fname, params);
  if (!ctx) {
    fprintf(stderr, "Unable to load model: %s\n", fname);
    return NULL; // Return NULL to indicate failure to load or find the value.
  }

  const char *tokens_key = "tokenizer.ggml.tokens";
  const int tokens_idx = gguf_find_key(ctx, tokens_key);
  printf("%s: tokens_idx: %d\n", __func__, tokens_idx);

  if (tokens_idx < 0) {
    printf("%s: key '%s' not found.\n", __func__, tokens_key);
    return ""; // Key not found.
  }

  const char *eos_id_key = "tokenizer.ggml.eos_token_id";
  const int eos_id_idx = gguf_find_key(ctx, eos_id_key);
  if (eos_id_idx < 0) {
    printf("%s: key '%s' not found.\n", __func__, eos_id_key);
    return ""; // Key not found.
  }

  const void *eos_id_val_data = gguf_get_val_data(ctx, eos_id_idx);
  const int eos_id_index =
      gguf_data_to_int(gguf_get_kv_type(ctx, eos_id_idx), eos_id_val_data, 0);
  if (eos_id_index == INT_MIN) {
    printf("%s: eos_id_val is INT_MIN, indicating an error.\n", __func__);
    return ""; // Key not found.
  }

  const uint32_t n_vocab = gguf_get_arr_n(ctx, tokens_idx);
  if (n_vocab <= tokens_idx) {
    printf("%s: tokens key found, but index %d is out of bounds for array of "
           "size %d.\n",
           __func__, eos_id_idx, n_vocab);
  }

  std::string word = gguf_get_arr_str(ctx, tokens_idx, eos_id_index);
  printf("%s: word: %s\n", __func__, word.c_str());
  char *heapWord = new char[word.length() + 1]; // +1 for the null terminator

  // Copy the contents of `word` to the allocated memory.
  std::strcpy(heapWord, word.c_str());

  ggml_free(meta);
  gguf_free(ctx);
  // Return the pointer to the caller. The caller must `delete[]` this memory.
  return heapWord;
}

EMSCRIPTEN_KEEPALIVE const char *fllama_get_bos_token(const char *fname) {
  struct ggml_context *meta = NULL;

  struct gguf_init_params params = {
      /*.no_alloc = */ true,
      /*.ctx      = */ &meta,
  };

  struct gguf_context *ctx = gguf_init_from_file(fname, params);
  if (!ctx) {
    fprintf(stderr, "Unable to load model: %s\n", fname);
    return NULL; // Return NULL to indicate failure to load or find the value.
  }

  const char *tokens_key = "tokenizer.ggml.tokens";
  const int tokens_idx = gguf_find_key(ctx, tokens_key);
  printf("%s: tokens_idx: %d\n", __func__, tokens_idx);

  if (tokens_idx < 0) {
    printf("%s: key '%s' not found.\n", __func__, tokens_key);
    return ""; // Key not found.
  }

  const char *bos_id_key = "tokenizer.ggml.bos_token_id";
  const int bos_id_idx = gguf_find_key(ctx, bos_id_key);
  if (bos_id_idx < 0) {
    printf("%s: key '%s' not found.\n", __func__, bos_id_key);
    return ""; // Key not found.
  }

  const void *bos_id_val_data = gguf_get_val_data(ctx, bos_id_idx);
  const int bos_id_index =
      gguf_data_to_int(gguf_get_kv_type(ctx, bos_id_idx), bos_id_val_data, 0);
  if (bos_id_index == INT_MIN) {
    printf("%s: bos_id_val is INT_MIN, indicating an error.\n", __func__);
    return ""; // Key not found.
  }

  const uint32_t n_vocab = gguf_get_arr_n(ctx, tokens_idx);
  if (n_vocab <= tokens_idx) {
    printf("%s: tokens key found, but index %d is out of bounds for array of "
           "size %d.\n",
           __func__, bos_id_idx, n_vocab);
  }

  std::string word = gguf_get_arr_str(ctx, tokens_idx, bos_id_index);
  printf("%s: word: %s\n", __func__, word.c_str());
  char *heapWord = new char[word.length() + 1]; // +1 for the null terminator

  // Copy the contents of `word` to the allocated memory.
  std::strcpy(heapWord, word.c_str());

  ggml_free(meta);
  gguf_free(ctx);
  // Return the pointer to the caller. The caller must `delete[]` this memory.
  return heapWord;
}
}

static int gguf_data_to_int(enum gguf_type type, const void *data, int i) {
  switch (type) {
  case GGUF_TYPE_UINT8:
    return static_cast<int>(((const uint8_t *)data)[i]);
  case GGUF_TYPE_INT8:
    return static_cast<int>(((const int8_t *)data)[i]);
  case GGUF_TYPE_UINT16:
    return static_cast<int>(((const uint16_t *)data)[i]);
  case GGUF_TYPE_INT16:
    return static_cast<int>(((const int16_t *)data)[i]);
  case GGUF_TYPE_UINT32:
    // Check if the uint32_t value can fit in an int, otherwise return INT_MIN
    {
      uint32_t val = ((const uint32_t *)data)[i];
      return val <= static_cast<uint32_t>(INT_MAX) ? static_cast<int>(val)
                                                   : INT_MIN;
    }
  case GGUF_TYPE_INT32:
    return static_cast<int>(((const int32_t *)data)[i]);
  case GGUF_TYPE_UINT64:
  case GGUF_TYPE_INT64:
    // For both 64-bit integer types, converting directly to int could lead to
    // significant data loss. This logic limits the conversion to IN_MIN if out
    // of the `int` range.
    {
      int64_t val = type == GGUF_TYPE_UINT64
                        ? static_cast<int64_t>(((const uint64_t *)data)[i])
                        : ((const int64_t *)data)[i];
      if (val >= static_cast<int64_t>(INT_MIN) &&
          val <= static_cast<int64_t>(INT_MAX)) {
        return static_cast<int>(val);
      } else {
        return INT_MIN;
      }
    }
  case GGUF_TYPE_FLOAT32:
    // For float, we attempt to cast to int directly, but large values could
    // cause undefined behavior.
    return static_cast<int>(((const float *)data)[i]);
  case GGUF_TYPE_FLOAT64:
    // Similar to float, casting directly from double to int, with potential for
    // large value issues.
    return static_cast<int>(((const double *)data)[i]);
  case GGUF_TYPE_BOOL:
    return ((const bool *)data)[i] ? 1 : 0;
  default:
    return INT_MIN; // Sentinel value indicating "not a number-y type" or
                    // "error"
  }
}
