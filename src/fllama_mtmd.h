#ifndef FLLAMA_MTMD_H
#define FLLAMA_MTMD_H

#include "mtmd.h"

#include <string>
#include <vector>

struct fllama_mtmd_bitmap_result {
    std::vector<mtmd_bitmap *> bitmaps;   // caller must free via mtmd_bitmap_free()
    std::string text_with_markers;        // prompt with <img> tags replaced by media marker
};

// Returns true if the prompt contains base64-encoded image tags.
bool fllama_prompt_contains_image(const std::string & prompt);

// Extract base64 images from the prompt, decode them to mtmd_bitmap objects,
// and replace the <img> tags with mtmd's media marker.
// Returns empty bitmaps vector and unchanged text if no images found.
// On error decoding an individual image, that image is skipped.
fllama_mtmd_bitmap_result fllama_extract_bitmaps(
    mtmd_context * mtmd_ctx,
    const std::string & prompt);

#endif // FLLAMA_MTMD_H
