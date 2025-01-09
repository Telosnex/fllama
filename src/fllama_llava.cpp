#include "fllama_llava.h"
#include "clip.h"

// LLaMA.cpp cross-platform support
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

#if TARGET_OS_IOS
#include "../ios/llama.cpp/common/base64.hpp"
#elif TARGET_OS_OSX
#include "../macos/llama.cpp/common/base64.hpp"
#else
#include "llama.cpp/common/base64.hpp"
#endif

#include <cstring>
#include <string>
#include <vector>

// Initial inspiration via:
// https://github.com/ggerganov/llama.cpp/blob/master/examples/llava/llava-cli.cpp
// Modified since to support PNG as well as JPEG, and to support multiple
// images.

static const char *IMG_BASE64_TAG_BEGIN_PART1 = "<img src=\"data:image/";
static const char *IMG_BASE64_TAG_BEGIN_PART2 =
    "base64,"; // Common for JPEG, PNG, and others
static const char *IMG_BASE64_TAG_END = "\">";

bool add_image_embed_to_context(struct llama_context *ctx_llama,
                                llava_image_embed *image_embed, int n_batch,
                                int *n_past) {
  int n_embd = llama_n_embd(llama_get_model(ctx_llama));

  for (int i = 0; i < image_embed->n_image_pos; i += n_batch) {
    int n_eval = image_embed->n_image_pos - i;
    if (n_eval > n_batch) {
      n_eval = n_batch;
    }
    llama_batch batch = {
        int32_t(n_eval),
        nullptr,
        (image_embed->embed + i * n_embd),
        nullptr,
        nullptr,
        nullptr,
        nullptr,
    };
    if (llama_decode(ctx_llama, batch)) {
      fprintf(stderr, "%s : failed to eval\n", __func__);
      return false;
    }
    *n_past += n_eval;
    fprintf(stderr, "%s: n_past: %d\n", __func__, *n_past);
  }
  fprintf(stderr, "finished adding %d image embeddings to context\n",
          image_embed->n_image_pos);
  fprintf(stderr, "finished state n_past: %d\n", *n_past);
  return true;
}

std::vector<std::pair<size_t, size_t>>
find_all_image_tags_in_prompt(const std::string &prompt) {
  std::vector<std::pair<size_t, size_t>> image_positions;
  size_t begin_temp = 0;
  while ((begin_temp = prompt.find(IMG_BASE64_TAG_BEGIN_PART1, begin_temp)) !=
         std::string::npos) {
    size_t format_end =
        prompt.find(";", begin_temp + strlen(IMG_BASE64_TAG_BEGIN_PART1));
    if (format_end == std::string::npos)
      break;

    size_t base64_start = prompt.find(IMG_BASE64_TAG_BEGIN_PART2, format_end);
    if (base64_start == std::string::npos)
      break;

    size_t begin_out = base64_start + strlen(IMG_BASE64_TAG_BEGIN_PART2);
    size_t end_out = prompt.find(IMG_BASE64_TAG_END, begin_out);
    if (end_out == std::string::npos)
      break;

    image_positions.emplace_back(begin_out, end_out);
    begin_temp =
        end_out +
        strlen(IMG_BASE64_TAG_END); // Continue search from the end of this tag
  }
  return image_positions;
}

bool prompt_contains_image(const std::string &prompt) {
  return find_all_image_tags_in_prompt(prompt).size() > 0;
}

// replaces the base64 image tag in the prompt with `replacement`
std::vector<llava_image_embed *> llava_image_embed_make_with_prompt_base64(
    struct clip_ctx *ctx_clip, int n_threads, const std::string &prompt) {
  std::vector<llava_image_embed *> embeddings;
  auto image_tags = find_all_image_tags_in_prompt(prompt);
  for (const auto &tag : image_tags) {
    auto base64_str = prompt.substr(tag.first, tag.second - tag.first);
    auto required_bytes = base64::required_encode_size(base64_str.size());
    auto img_bytes = std::vector<unsigned char>(required_bytes);
    base64::decode(base64_str.begin(), base64_str.end(), img_bytes.begin());

    auto embed = llava_image_embed_make_with_bytes(
        ctx_clip, n_threads, img_bytes.data(), img_bytes.size());
    if (!embed) {
      fprintf(stderr, "%s: could not load image from base64 string.\n",
              __func__);
      continue;
    }
    embeddings.push_back(embed);
  }
  return embeddings;
}

std::string remove_all_images_from_prompt(const std::string &prompt,
                                          const char *replacement) {
  std::string modified_prompt = prompt;
  auto image_tags = find_all_image_tags_in_prompt(prompt);

  // Iterate in reverse to avoid messing up indices due to string modifications
  for (auto it = image_tags.rbegin(); it != image_tags.rend(); ++it) {
    auto pre = modified_prompt.substr(
        0, it->first - strlen(IMG_BASE64_TAG_BEGIN_PART2) -
               strlen(IMG_BASE64_TAG_BEGIN_PART1) -
               1); // Adjust to cut off "<img src=\"data:image/"
    auto post = modified_prompt.substr(it->second + strlen(IMG_BASE64_TAG_END));
    modified_prompt = pre + replacement + post;
  }
  return modified_prompt;
}