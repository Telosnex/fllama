#include "fllama_mtmd.h"
#include "mtmd.h"   // for mtmd_default_marker()

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

#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

// Tag format that fllama has always used:
//   <img src="data:image/png;base64,AAAA...">
static const char * TAG_PART1 = "<img src=\"data:image/";
static const char * TAG_PART2 = "base64,";
static const char * TAG_END   = "\">";

// Locate every <img src="data:image/...;base64,..."> tag.
// Returns (tag_start, tag_end, data_begin, data_end) for each tag.
struct img_tag {
    size_t tag_start;   // index of '<'
    size_t tag_end;     // index one-past '>'
    size_t data_begin;  // index of first base64 char
    size_t data_end;    // index one-past last base64 char
};

static std::vector<img_tag> find_image_tags(const std::string & prompt) {
    std::vector<img_tag> tags;
    size_t pos = 0;
    while ((pos = prompt.find(TAG_PART1, pos)) != std::string::npos) {
        size_t semi = prompt.find(";", pos + strlen(TAG_PART1));
        if (semi == std::string::npos) break;

        size_t b64 = prompt.find(TAG_PART2, semi);
        if (b64 == std::string::npos) break;

        size_t d_begin = b64 + strlen(TAG_PART2);
        size_t d_end   = prompt.find(TAG_END, d_begin);
        if (d_end == std::string::npos) break;

        size_t t_end = d_end + strlen(TAG_END);
        tags.push_back({pos, t_end, d_begin, d_end});
        pos = t_end;
    }
    return tags;
}

bool fllama_prompt_contains_image(const std::string & prompt) {
    return !find_image_tags(prompt).empty();
}

fllama_mtmd_result fllama_extract_images(const std::string & prompt) {
    fllama_mtmd_result result;
    auto tags = find_image_tags(prompt);
    if (tags.empty()) {
        result.text_with_markers = prompt;
        return result;
    }

    const char * marker = mtmd_default_marker();

    // Decode each base64 segment → raw file bytes (JPEG/PNG/etc.).
    for (auto & t : tags) {
        auto b64 = prompt.substr(t.data_begin, t.data_end - t.data_begin);
        auto required = base64::required_encode_size(b64.size());
        std::vector<uint8_t> bytes(required);
        base64::decode(b64.begin(), b64.end(), bytes.begin());
        result.file_bytes.push_back(std::move(bytes));
    }

    // Replace tags in reverse order to preserve indices.
    result.text_with_markers = prompt;
    for (auto it = tags.rbegin(); it != tags.rend(); ++it) {
        result.text_with_markers.replace(it->tag_start,
                                         it->tag_end - it->tag_start,
                                         marker);
    }
    return result;
}
