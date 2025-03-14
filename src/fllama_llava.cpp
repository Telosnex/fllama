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
#include <inttypes.h>

// Initial inspiration via:
// https://github.com/ggerganov/llama.cpp/blob/master/examples/llava/llava-cli.cpp
// Modified since to support PNG as well as JPEG, and to support multiple
// images.
// Gemma3 implementation based on:
// https://github.com/ggerganov/llama.cpp/blob/master/examples/llava/gemma3-cli.cpp

// Helper structure for creating image embedding batches for Gemma3 models
// Based on decode_embd_batch from gemma3-cli.cpp
struct gemma_image_batch {
    std::vector<llama_pos>      pos;
    std::vector<int32_t>        n_seq_id;
    std::vector<llama_seq_id>   seq_id_0;
    std::vector<llama_seq_id *> seq_ids;
    std::vector<int8_t>         logits;
    llama_batch batch;
    
    gemma_image_batch(float * embd, int32_t n_tokens, llama_pos pos_0, llama_seq_id seq_id) {
        pos     .resize(n_tokens);
        n_seq_id.resize(n_tokens);
        seq_ids .resize(n_tokens + 1);
        logits  .resize(n_tokens);
        seq_id_0.resize(1);
        seq_id_0[0] = seq_id;
        seq_ids [n_tokens] = nullptr;
        batch = {
            /*n_tokens       =*/ n_tokens,
            /*tokens         =*/ nullptr,
            /*embd           =*/ embd,
            /*pos            =*/ pos.data(),
            /*n_seq_id       =*/ n_seq_id.data(),
            /*seq_id         =*/ seq_ids.data(),
            /*logits         =*/ logits.data(),
        };
        for (int i = 0; i < n_tokens; i++) {
            batch.pos     [i] = pos_0 + i;
            batch.n_seq_id[i] = 1;
            batch.seq_id  [i] = seq_id_0.data();
            batch.logits  [i] = false;
        }
    }
};

// Helper function to evaluate a token for Gemma models
static bool eval_gemma_token(llama_context* ctx_llama, int* n_past, const char* token_text, const char* fallback_token_name, llama_token fallback_token) {
    int64_t t0 = ggml_time_ms();
    const llama_vocab* vocab = llama_model_get_vocab(llama_get_model(ctx_llama));
    
    // Create a batch for a single token
    std::vector<llama_token> tokens(1);
    int n_tokens = llama_tokenize(vocab, token_text, strlen(token_text), tokens.data(), tokens.size(), true, true);
    
    if (n_tokens <= 0) {
        // Fallback if token not found
        tokens[0] = fallback_token;
        fprintf(stderr, "%s token not found, using %s instead\n", token_text, fallback_token_name);
    }
    
    llama_batch batch = { 1, tokens.data(), nullptr, nullptr, nullptr, nullptr, nullptr };
    if (llama_decode(ctx_llama, batch)) {
        fprintf(stderr, "%s : failed to eval token %s\n", __func__, token_text);
        return false;
    }
    (*n_past)++;
    
    fprintf(stderr, "Token %s processed in %" PRId64 " ms\n", token_text, ggml_time_ms() - t0);
    return true;
}

static const char *IMG_BASE64_TAG_BEGIN_PART1 = "<img src=\"data:image/";
static const char *IMG_BASE64_TAG_BEGIN_PART2 =
    "base64,"; // Common for JPEG, PNG, and others
static const char *IMG_BASE64_TAG_END = "\">";

// Resizes embeddings to exactly 256 tokens for Gemma3 models
static float* resize_embeddings_for_gemma(float* embeddings, int n_current_tokens, int n_embd) {
    // Gemma3 requires exactly 256 tokens
    const int n_target_tokens = 256;
    float* new_embeddings = (float*)malloc(n_target_tokens * n_embd * sizeof(float));
    
    if (n_current_tokens == n_target_tokens) {
      fprintf(stderr, "Image embeddings already have exactly 256 tokens\n");
        // If already exactly 256 tokens, just copy
        memcpy(new_embeddings, embeddings, n_target_tokens * n_embd * sizeof(float));
    } else if (n_current_tokens < n_target_tokens) {
      fprintf(stderr, "Padded image embeddings from %d to %d tokens\n", n_current_tokens, n_target_tokens);
        // If fewer than 256 tokens, copy what we have and pad the rest with zeros
        memcpy(new_embeddings, embeddings, n_current_tokens * n_embd * sizeof(float));
        memset(new_embeddings + n_current_tokens * n_embd, 0, (n_target_tokens - n_current_tokens) * n_embd * sizeof(float));
        fprintf(stderr, "Padded image embeddings from %d to %d tokens\n", n_current_tokens, n_target_tokens);
    } else {
      fprintf(stderr, "Truncated image embeddings from %d to %d tokens\n", n_current_tokens, n_target_tokens);
        // If more than 256 tokens, take the first 256
        memcpy(new_embeddings, embeddings, n_target_tokens * n_embd * sizeof(float));
        fprintf(stderr, "Truncated image embeddings from %d to %d tokens\n", n_current_tokens, n_target_tokens);
    }
    
    return new_embeddings;
}

bool add_image_embed_to_context(struct llama_context *ctx_llama,
                                llava_image_embed *image_embed, int n_batch,
                                int *n_past, bool is_gemma3) {
  int n_embd = llama_n_embd(llama_get_model(ctx_llama));
  
  if (is_gemma3) {
    fprintf(stderr, "Using Gemma 3 image embedding format\n");
    int64_t t0 = ggml_time_ms();
    
    // Completely separate Gemma3 branch using our helper functions
    
    // 1. Add <start_of_image> token
    if (!eval_gemma_token(ctx_llama, n_past, "<start_of_image>", "BOS", 
                         llama_token_bos(llama_model_get_vocab(llama_get_model(ctx_llama))))) {
        return false;
    }
    
    // 2. Disable causal attention for image embeddings
    llama_set_causal_attn(ctx_llama, false);
    
    // 3. Process image embeddings - CRITICAL: Always use exactly 256 tokens for Gemma3
    int64_t t1 = ggml_time_ms();
    
    // Resize embeddings to exactly 256 tokens as required by Gemma3
    const int n_target_tokens = 256;
    fprintf(stderr, "Resizing image embeddings from %d to %d tokens for Gemma3\n", 
            image_embed->n_image_pos, n_target_tokens);
    
    float* gemma_embeddings = resize_embeddings_for_gemma(image_embed->embed, 
                                                        image_embed->n_image_pos, n_embd);
    
    // Create batch with exactly 256 tokens
    gemma_image_batch batch_img(gemma_embeddings, n_target_tokens, *n_past, 0);
    
    fprintf(stderr, "Processing exactly %d image embeddings in a single batch\n", n_target_tokens);
    if (llama_decode(ctx_llama, batch_img.batch)) {
      fprintf(stderr, "%s : failed to process image embeddings\n", __func__);
      llama_set_causal_attn(ctx_llama, true); // Restore causal attention in case of failure
      free(gemma_embeddings);
      return false;
    }
    *n_past += n_target_tokens;
    fprintf(stderr, "Image embeddings processed in %" PRId64 " ms, n_past: %d\n", 
             ggml_time_ms() - t1, *n_past);
    
    // 4. Re-enable causal attention
    llama_set_causal_attn(ctx_llama, true);
    
    // 5. Add <end_of_image> token
    if (!eval_gemma_token(ctx_llama, n_past, "<end_of_image>", "EOS", 
                         llama_token_eos(llama_model_get_vocab(llama_get_model(ctx_llama))))) {
        return false;
    }
    
    fprintf(stderr, "Total Gemma image processing time: %" PRId64 " ms\n", ggml_time_ms() - t0);
  } else {
    fprintf(stderr, "Using non-Gemma image embedding format\n");
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