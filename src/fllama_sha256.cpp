// fllama_sha256.cpp — see fllama_sha256.h.
#include "fllama_sha256.h"

#include <cstdio>
#include <cstring>
#include <vector>

#if defined(_WIN32)
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#endif

namespace {

const uint32_t kRoundConstants[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2};

inline uint32_t rotr(uint32_t x, int n) { return (x >> n) | (x << (32 - n)); }

} // namespace

FllamaSha256::FllamaSha256()
    : state_{0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
             0x9b05688c, 0x1f83d9ab, 0x5be0cd19} {}

void FllamaSha256::block(const uint8_t *p) {
  uint32_t w[64];
  for (int i = 0; i < 16; ++i) {
    w[i] = (uint32_t(p[4 * i]) << 24) | (uint32_t(p[4 * i + 1]) << 16) |
           (uint32_t(p[4 * i + 2]) << 8) | uint32_t(p[4 * i + 3]);
  }
  for (int i = 16; i < 64; ++i) {
    const uint32_t s0 =
        rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
    const uint32_t s1 =
        rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
    w[i] = w[i - 16] + s0 + w[i - 7] + s1;
  }
  uint32_t a = state_[0], b = state_[1], c = state_[2], d = state_[3];
  uint32_t e = state_[4], f = state_[5], g = state_[6], h = state_[7];
  for (int i = 0; i < 64; ++i) {
    const uint32_t s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
    const uint32_t ch = (e & f) ^ (~e & g);
    const uint32_t t1 = h + s1 + ch + kRoundConstants[i] + w[i];
    const uint32_t s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
    const uint32_t maj = (a & b) ^ (a & c) ^ (b & c);
    const uint32_t t2 = s0 + maj;
    h = g;
    g = f;
    f = e;
    e = d + t1;
    d = c;
    c = b;
    b = a;
    a = t1 + t2;
  }
  state_[0] += a;
  state_[1] += b;
  state_[2] += c;
  state_[3] += d;
  state_[4] += e;
  state_[5] += f;
  state_[6] += g;
  state_[7] += h;
}

void FllamaSha256::update(const void *data, size_t size) {
  const uint8_t *p = static_cast<const uint8_t *>(data);
  total_bytes_ += size;
  if (buffered_ > 0) {
    const size_t take = size < 64 - buffered_ ? size : 64 - buffered_;
    std::memcpy(buffer_ + buffered_, p, take);
    buffered_ += take;
    p += take;
    size -= take;
    if (buffered_ < 64) {
      return;
    }
    block(buffer_);
    buffered_ = 0;
  }
  while (size >= 64) {
    block(p);
    p += 64;
    size -= 64;
  }
  std::memcpy(buffer_, p, size);
  buffered_ = size;
}

std::string FllamaSha256::hex_digest() {
  const uint64_t bit_length = total_bytes_ * 8;
  const uint8_t one = 0x80;
  update(&one, 1);
  const uint8_t zero = 0;
  while (buffered_ != 56) {
    update(&zero, 1);
  }
  uint8_t length[8];
  for (int i = 0; i < 8; ++i) {
    length[i] = uint8_t(bit_length >> (56 - 8 * i));
  }
  update(length, 8);

  static const char kHex[] = "0123456789abcdef";
  std::string out;
  out.reserve(64);
  for (uint32_t word : state_) {
    for (int shift = 28; shift >= 0; shift -= 4) {
      out.push_back(kHex[(word >> shift) & 0xf]);
    }
  }
  return out;
}

std::string fllama_sha256_file(const std::string &utf8_path) {
#if defined(_WIN32)
  const int n = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS,
                                    utf8_path.c_str(), -1, nullptr, 0);
  if (n <= 0) {
    return {};
  }
  std::wstring wide(static_cast<size_t>(n), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, utf8_path.c_str(), -1, wide.data(), n);
  FILE *file = _wfopen(wide.c_str(), L"rb");
#else
  FILE *file = std::fopen(utf8_path.c_str(), "rb");
#endif
  if (file == nullptr) {
    return {};
  }
  FllamaSha256 sha;
  std::vector<uint8_t> chunk(1 << 20);
  size_t n_read;
  while ((n_read = std::fread(chunk.data(), 1, chunk.size(), file)) > 0) {
    sha.update(chunk.data(), n_read);
  }
  const bool failed = std::ferror(file) != 0;
  std::fclose(file);
  return failed ? std::string() : sha.hex_digest();
}
