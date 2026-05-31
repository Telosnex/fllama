#ifndef FLLAMA_MTMD_H
#define FLLAMA_MTMD_H

#include <cstdint>
#include <string>
#include <vector>

struct fllama_mtmd_result {
    // Raw image file bytes (JPEG/PNG/etc.) decoded from base64.
    // Each entry is one image, in the order they appeared in the prompt.
    std::vector<std::vector<uint8_t>> file_bytes;

    // Prompt text with <img> tags replaced by the mtmd media marker.
    std::string text_with_markers;
};

// Returns true if the prompt contains base64-encoded <img> tags.
bool fllama_prompt_contains_image(const std::string & prompt);

// Extract base64 images from the prompt and decode them to raw file bytes.
// Replace <img> tags with the exact media marker used by the active mtmd_context.
// This must match mtmd_context_params::media_marker (server get_media_marker()).
fllama_mtmd_result fllama_extract_images(const std::string & prompt,
                                         const char * media_marker);

#endif // FLLAMA_MTMD_H
