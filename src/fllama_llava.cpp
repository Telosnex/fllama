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
#include <algorithm>

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
                                int *n_past, bool is_gemma3) {
  int n_embd = llama_n_embd(llama_get_model(ctx_llama));
  
  if (is_gemma3) {
    fprintf(stderr, "Using Gemma 3 image embedding format\n");
    
    // 1. Add <start_of_image> token
    const char* start_token = "<start_of_image>";
    const llama_vocab *vocab = llama_model_get_vocab(llama_get_model(ctx_llama));
    
    // Simplified token handling - create a single-token batch for the start token
    std::vector<llama_token> tokens(1);
    int n_tokens = llama_tokenize(vocab, start_token, strlen(start_token), tokens.data(), tokens.size(), true, true);
    
    // Process the token
    if (n_tokens <= 0) {
      // Fallback to BOS if token not found
      tokens[0] = llama_token_bos(llama_model_get_vocab(llama_get_model(ctx_llama)));
      fprintf(stderr, "<start_of_image> token not found, using BOS instead\n");
    }
    
    llama_batch batch_start = { 1, tokens.data(), nullptr, nullptr, nullptr, nullptr, nullptr };
    if (llama_decode(ctx_llama, batch_start)) {
      fprintf(stderr, "%s : failed to eval start token\n", __func__);
      return false;
    }
    (*n_past)++;
    
    // 2. Disable causal attention for image embeddings
    llama_set_causal_attn(ctx_llama, false);
    
    // 3. Process all image embeddings in a single batch (like in gemma3-cli.cpp)
    // Prepare positions for all embedding tokens
    std::vector<llama_pos> positions(image_embed->n_image_pos);
    std::vector<int32_t> n_seq_id(image_embed->n_image_pos, 1);
    std::vector<llama_seq_id> seq_id_0(1, 0);
    std::vector<llama_seq_id*> seq_ids(image_embed->n_image_pos + 1, nullptr);
    std::vector<int8_t> logits(image_embed->n_image_pos, 0);
    
    // Set up sequence IDs and positions
    for (int i = 0; i < image_embed->n_image_pos; i++) {
      positions[i] = *n_past + i;
      seq_ids[i] = seq_id_0.data();
    }
    seq_ids[image_embed->n_image_pos] = nullptr;
    
    // Create the batch for all image embeddings at once
    llama_batch batch_img = {
        int32_t(image_embed->n_image_pos),
        nullptr,
        image_embed->embed,
        positions.data(),
        n_seq_id.data(),
        seq_ids.data(),
        logits.data(),
    };
    
    // Process the entire image in one go
    fprintf(stderr, "Processing all %d image embeddings in a single batch\n", image_embed->n_image_pos);
    if (llama_decode(ctx_llama, batch_img)) {
      fprintf(stderr, "%s : failed to process image embeddings\n", __func__);
      llama_set_causal_attn(ctx_llama, true); // Restore causal attention in case of failure
      return false;
    }
    *n_past += image_embed->n_image_pos;
    fprintf(stderr, "All image embeddings processed, n_past: %d\n", *n_past);
    
    // 4. Re-enable causal attention
    llama_set_causal_attn(ctx_llama, true);
    
    // 5. Add <end_of_image> token
    const char* end_token = "<end_of_image>";
    tokens.resize(1);
    n_tokens = llama_tokenize(vocab, end_token, strlen(end_token), tokens.data(), tokens.size(), true, true);
    
    if (n_tokens <= 0) {
      // Fallback to EOS if token not found
      tokens[0] = llama_token_eos(llama_model_get_vocab(llama_get_model(ctx_llama)));
      fprintf(stderr, "<end_of_image> token not found, using EOS instead\n");
    }
    
    llama_batch batch_end = { 1, tokens.data(), nullptr, nullptr, nullptr, nullptr, nullptr };
    if (llama_decode(ctx_llama, batch_end)) {
      fprintf(stderr, "%s : failed to eval end token\n", __func__);
      return false;
    }
    (*n_past)++;
  } else {
    // Original LLaVA implementation for non-Gemma models
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