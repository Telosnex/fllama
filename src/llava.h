// Via https://github.com/ggerganov/llama.cpp/blob/dbd8828eb03b9aa8d0af7e4c533d3c2f5b38aba6/examples/llava/llava.h

#ifndef LLAVA_H
#define LLAVA_H

#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
// iOS-specific includes
#include "../ios/llama.cpp/ggml.h"
#include "../ios/llama.cpp/llama.h"
#elif TARGET_OS_OSX
// macOS-specific includes
#include "../macos/llama.cpp/ggml/include/ggml.h"
#include "../macos/llama.cpp/include/llama.h"
#else
// Other platforms
#include "ggml.h"
#include "llama.h"
#endif

#ifdef LLAMA_SHARED
#    if defined(_WIN32) && !defined(__MINGW32__)
#        ifdef LLAMA_BUILD
#            define LLAVA_API __declspec(dllexport)
#        else
#            define LLAVA_API __declspec(dllimport)
#        endif
#    else
#        define LLAVA_API __attribute__ ((visibility ("default")))
#    endif
#else
#    define LLAVA_API
#endif

struct clip_ctx;

#ifdef __cplusplus
extern "C" {
#endif

struct llava_image_embed {
    float * embed;
    int n_image_pos;
};

/** sanity check for clip <-> llava embed size match */
LLAVA_API bool llava_validate_embed_size(const llama_context * ctx_llama, const clip_ctx * ctx_clip);

/** build an image embed from image file bytes */
LLAVA_API struct llava_image_embed * llava_image_embed_make_with_bytes(struct clip_ctx * ctx_clip, int n_threads, const unsigned char * image_bytes, int image_bytes_length);
/** build an image embed from a path to an image filename */
LLAVA_API struct llava_image_embed * llava_image_embed_make_with_filename(struct clip_ctx * ctx_clip, int n_threads, const char * image_path);
LLAVA_API void llava_image_embed_free(struct llava_image_embed * embed);
/** free an embedding made with llava_image_embed_make_* */

/** write the image represented by embed into the llama context with batch size n_batch, starting at context pos n_past. on completion, n_past points to the next position in the context after the image embed. */
LLAVA_API bool llava_eval_image_embed(struct llama_context * ctx_llama, const struct llava_image_embed * embed, int n_batch, int * n_past);

#ifdef __cplusplus
}
#endif

#endif
