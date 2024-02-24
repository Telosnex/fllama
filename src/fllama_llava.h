#include "llava.h"

#include <string>
#include <vector>

static bool add_image_embed_to_context(struct llama_context *ctx_llama,
                                       llava_image_embed *image_embed,
                                       int n_batch, int *n_past);
static std::vector<std::pair<size_t, size_t>>
find_all_image_tags_in_prompt(const std::string &prompt);
static std::vector<llava_image_embed *>
llava_image_embed_make_with_prompt_base64(struct clip_ctx *ctx_clip,
                                          int n_threads,
                                          const std::string &prompt);
static bool prompt_contains_image(const std::string &prompt);
static std::string remove_all_images_from_prompt(const std::string &prompt,
                                                 const char *replacement);