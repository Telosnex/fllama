#ifndef CLIP_H
#define CLIP_H

#include <stddef.h>
#include <stdint.h>
#include <vector>

#ifdef LLAMA_SHARED
#    if defined(_WIN32) && !defined(__MINGW32__)
#        ifdef LLAMA_BUILD
#            define CLIP_API __declspec(dllexport)
#        else
#            define CLIP_API __declspec(dllimport)
#        endif
#    else
#        define CLIP_API __attribute__ ((visibility ("default")))
#    endif
#else
#    define CLIP_API
#endif

#ifdef __cplusplus
extern "C" {
#endif

struct clip_ctx;

// RGB uint8 image
struct clip_image_u8 {
    int nx;
    int ny;

    std::vector<uint8_t> buf;
};

// RGB float32 image (NHWC)
// Memory layout: RGBRGBRGB...
struct clip_image_f32 {
    int nx;
    int ny;

    std::vector<float> buf;
};

struct clip_image_size {
    int width;
    int height;
};

struct clip_image_u8_batch {
    struct clip_image_u8 * data;
    size_t size;
};

struct clip_image_f32_batch {
    struct clip_image_f32 * data;
    size_t size;
};

struct clip_context_params {
    bool use_gpu;
    int verbosity;
};

// deprecated, use clip_init
CLIP_API struct clip_ctx * clip_model_load(const char * fname, int verbosity);

CLIP_API struct clip_ctx * clip_init(const char * fname, struct clip_context_params ctx_params);

CLIP_API void clip_free(struct clip_ctx * ctx);

CLIP_API size_t clip_embd_nbytes(const struct clip_ctx * ctx);
CLIP_API size_t clip_embd_nbytes_by_img(const struct clip_ctx * ctx, int img_h, int img_w);

CLIP_API int32_t clip_image_size (const struct clip_ctx * ctx);
CLIP_API int32_t clip_patch_size (const struct clip_ctx * ctx);
CLIP_API int32_t clip_hidden_size(const struct clip_ctx * ctx);

// TODO: should be enum, not string
CLIP_API const char * clip_patch_merge_type(const struct clip_ctx * ctx);

CLIP_API const int32_t * clip_image_grid(const struct clip_ctx * ctx);
CLIP_API size_t get_clip_image_grid_size(const struct clip_ctx * ctx);

CLIP_API int clip_n_patches        (const struct clip_ctx * ctx);
CLIP_API int clip_n_patches_by_img (const struct clip_ctx * ctx, struct clip_image_f32 * img);
CLIP_API int clip_n_mmproj_embd    (const struct clip_ctx * ctx);

CLIP_API int clip_uhd_num_image_embeds_col(struct clip_ctx * ctx_clip);
CLIP_API void clip_add_load_image_size(struct clip_ctx * ctx_clip, struct clip_image_size * load_image_size);
CLIP_API struct clip_image_size * clip_get_load_image_size(struct clip_ctx * ctx_clip);

CLIP_API struct clip_image_size * clip_image_size_init();
CLIP_API struct clip_image_u8  * clip_image_u8_init ();
CLIP_API struct clip_image_f32 * clip_image_f32_init();

CLIP_API void clip_image_u8_free (struct clip_image_u8  * img);
CLIP_API void clip_image_f32_free(struct clip_image_f32 * img);
CLIP_API void clip_image_u8_batch_free (struct clip_image_u8_batch  * batch);
CLIP_API void clip_image_f32_batch_free(struct clip_image_f32_batch * batch);

/**
 * Build image from pixels decoded by other libraries instead of stb_image.h for better performance.
 * The memory layout is RGBRGBRGB..., input buffer length must be 3*nx*ny bytes
 */
CLIP_API void clip_build_img_from_pixels(const unsigned char * rgb_pixels, int nx, int ny, struct clip_image_u8 * img);

CLIP_API bool clip_image_load_from_file(const char * fname, struct clip_image_u8 * img);

/** interpret bytes as an image file with length bytes_length, and use the result to populate img */
CLIP_API bool clip_image_load_from_bytes(const unsigned char * bytes, size_t bytes_length, struct clip_image_u8 * img);

/** preprocess img and store the result in res_imgs, pad_to_square may be overridden to false depending on model configuration */
CLIP_API bool clip_image_preprocess(struct clip_ctx * ctx, const struct clip_image_u8 * img, struct clip_image_f32_batch * res_imgs );

CLIP_API struct ggml_tensor * clip_get_newline_tensor(const struct clip_ctx * ctx);

CLIP_API bool clip_image_encode      (struct clip_ctx * ctx, int n_threads, struct clip_image_f32 * img, float * vec);
CLIP_API bool clip_image_batch_encode(struct clip_ctx * ctx, int n_threads, const struct clip_image_f32_batch * imgs, float * vec);

CLIP_API bool clip_model_quantize(const char * fname_inp, const char * fname_out, int itype);

CLIP_API int clip_is_minicpmv(const struct clip_ctx * ctx);
CLIP_API bool clip_is_glm(const struct clip_ctx * ctx);
CLIP_API bool clip_is_qwen2vl(const struct clip_ctx * ctx);

CLIP_API int get_deepest_feature_layer(const struct clip_ctx * ctx);

CLIP_API bool clip_encode_float_image (struct clip_ctx * ctx, int n_threads, float * img, int h, int w, float * vec);

#ifdef __cplusplus

}

// Helper function for selecting the best resolution
CLIP_API std::pair<int, int> select_best_resolution(const std::pair<int, int> & original_size, const std::vector<std::pair<int, int>> & possible_resolutions);

#endif

#endif // CLIP_H
