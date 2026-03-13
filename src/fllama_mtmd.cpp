#include "fllama_mtmd.h"
#include "mtmd-helper.h"

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
#include <cstdio>

// Same tag format that fllama has always used for inline base64 images:
//   <img src="data:image/png;base64,AAAA...">
static const char * IMG_BASE64_TAG_BEGIN_PART1 = "<img src=\"data:image/";
static const char * IMG_BASE64_TAG_BEGIN_PART2 = "base64,";
static const char * IMG_BASE64_TAG_END         = "\">";

// Find all <img src="data:image/...;base64,..."> tags in the prompt.
// Returns pairs of (start_of_base64_data, end_of_base64_data).
static std::vector<std::pair<size_t, size_t>>
find_all_image_tags(const std::string & prompt) {
    std::vector<std::pair<size_t, size_t>> image_positions;
    size_t search_from = 0;
    while ((search_from = prompt.find(IMG_BASE64_TAG_BEGIN_PART1, search_from)) !=
           std::string::npos) {
        size_t format_end =
            prompt.find(";", search_from + strlen(IMG_BASE64_TAG_BEGIN_PART1));
        if (format_end == std::string::npos) break;

        size_t base64_start = prompt.find(IMG_BASE64_TAG_BEGIN_PART2, format_end);
        if (base64_start == std::string::npos) break;

        size_t data_begin = base64_start + strlen(IMG_BASE64_TAG_BEGIN_PART2);
        size_t data_end   = prompt.find(IMG_BASE64_TAG_END, data_begin);
        if (data_end == std::string::npos) break;

        image_positions.emplace_back(data_begin, data_end);
        search_from = data_end + strlen(IMG_BASE64_TAG_END);
    }
    return image_positions;
}

// Find the full extent of each <img ...> tag (from '<' to '>') so we can
// replace the whole thing with the media marker.
static std::vector<std::pair<size_t, size_t>>
find_full_tag_ranges(const std::string & prompt) {
    std::vector<std::pair<size_t, size_t>> ranges;
    size_t search_from = 0;
    while ((search_from = prompt.find(IMG_BASE64_TAG_BEGIN_PART1, search_from)) !=
           std::string::npos) {
        size_t tag_start = search_from;

        size_t format_end =
            prompt.find(";", search_from + strlen(IMG_BASE64_TAG_BEGIN_PART1));
        if (format_end == std::string::npos) break;

        size_t base64_start = prompt.find(IMG_BASE64_TAG_BEGIN_PART2, format_end);
        if (base64_start == std::string::npos) break;

        size_t data_begin = base64_start + strlen(IMG_BASE64_TAG_BEGIN_PART2);
        size_t data_end   = prompt.find(IMG_BASE64_TAG_END, data_begin);
        if (data_end == std::string::npos) break;

        size_t tag_end = data_end + strlen(IMG_BASE64_TAG_END);
        ranges.emplace_back(tag_start, tag_end);
        search_from = tag_end;
    }
    return ranges;
}

bool fllama_prompt_contains_image(const std::string & prompt) {
    return !find_all_image_tags(prompt).empty();
}

fllama_mtmd_bitmap_result fllama_extract_bitmaps(
        mtmd_context * mtmd_ctx,
        const std::string & prompt) {
    fllama_mtmd_bitmap_result result;

    auto image_tags  = find_all_image_tags(prompt);
    auto full_ranges = find_full_tag_ranges(prompt);

    if (image_tags.empty()) {
        result.text_with_markers = prompt;
        return result;
    }

    const char * marker = mtmd_default_marker();

    // Decode each base64 image into raw bytes, then create an mtmd_bitmap
    // via the helper (which handles JPEG/PNG decoding internally via stb).
    for (size_t i = 0; i < image_tags.size(); i++) {
        auto base64_str = prompt.substr(image_tags[i].first,
                                        image_tags[i].second - image_tags[i].first);

        // Decode base64 → raw file bytes (JPEG/PNG/etc.)
        auto required_bytes = base64::required_encode_size(base64_str.size());
        std::vector<unsigned char> img_bytes(required_bytes);
        base64::decode(base64_str.begin(), base64_str.end(), img_bytes.begin());

        // Use mtmd helper to decode image bytes → bitmap (handles stb internally)
        mtmd_bitmap * bmp = mtmd_helper_bitmap_init_from_buf(
            mtmd_ctx, img_bytes.data(), img_bytes.size());
        if (!bmp) {
            fprintf(stderr, "[fllama_mtmd] Warning: failed to decode image %zu, skipping\n", i);
            continue;
        }
        result.bitmaps.push_back(bmp);
    }

    // Build the modified prompt: replace each <img ...> tag with the media marker.
    // Iterate in reverse to preserve indices.
    result.text_with_markers = prompt;
    for (auto it = full_ranges.rbegin(); it != full_ranges.rend(); ++it) {
        result.text_with_markers.replace(it->first,
                                         it->second - it->first,
                                         marker);
    }

    return result;
}
