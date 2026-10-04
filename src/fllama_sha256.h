// fllama_sha256.h — SHA-256 (FIPS 180-4) for GPU pack checks
// (docs/ADR_004_DESKTOP_GPU_BACKENDS.md, D13).
#ifndef FLLAMA_SHA256_H
#define FLLAMA_SHA256_H

#include <cstddef>
#include <cstdint>
#include <string>

class FllamaSha256 {
public:
  FllamaSha256();
  void update(const void *data, size_t size);
  // Lowercase hex digest. Call once; the object is spent afterwards.
  std::string hex_digest();

private:
  void block(const uint8_t *p);

  uint32_t state_[8];
  uint8_t buffer_[64];
  size_t buffered_ = 0;
  uint64_t total_bytes_ = 0;
};

// Lowercase hex SHA-256 of the file at [path] (UTF-8 on all platforms).
// Returns "" if the file cannot be read.
std::string fllama_sha256_file(const std::string &utf8_path);

#endif // FLLAMA_SHA256_H
