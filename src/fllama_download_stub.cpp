// fllama_download_stub.cpp — replaces llama.cpp's remote downloads.
//
// llama-common's download.o needs cpp-httplib and OpenSSL, and fllama never
// downloads. The linker takes a symbol from here first, so download.o is not
// linked while every download function that fllama uses is here. Today that
// is only common_remote_get_content, from server-common.cpp (an image_url
// with an http URL). A new use in llama.cpp is a link error: download.o then
// needs httplib.

#include "download.h"

#include <type_traits>

// HTTP status 0: llama.cpp then rejects the URL.
std::pair<long, std::vector<char>>
common_remote_get_content(const std::string &, const common_remote_params &) {
  return {0, {}};
}

// A stub with another signature than download.h's is an overload, and it
// replaces nothing. The overloaded name then cannot be resolved here.
static_assert(std::is_same_v<decltype(&common_remote_get_content),
                             std::pair<long, std::vector<char>> (*)(
                                 const std::string &,
                                 const common_remote_params &)>);
