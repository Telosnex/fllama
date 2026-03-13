// fllama_download_stub.cpp — stub out remote download functions.
//
// libcommon.a's download.o uses httplib → OpenSSL.  fllama never downloads
// models remotely.  These stubs override the symbols so the linker doesn't
// pull in download.o (and its httplib/OpenSSL dependency chain).
//
// We deliberately do NOT #include "download.h" because that pulls in
// "http.h" which pulls in <cpp-httplib/httplib.h>.

#include <string>
#include <utility>
#include <vector>

struct common_params_model;

using common_header      = std::pair<std::string, std::string>;
using common_header_list = std::vector<common_header>;

struct common_remote_params {
    common_header_list headers;
    long timeout  = 0;
    long max_size = 0;
};

struct common_cached_model_info {
    std::string manifest_path;
    std::string user;
    std::string model;
    std::string tag;
    size_t      size = 0;
    std::string to_string() const { return ""; }
};

struct common_hf_file_res {
    std::string repo;
    std::string ggufFile;
    std::string mmprojFile;
};

std::pair<long, std::vector<char>>
common_remote_get_content(const std::string &, const common_remote_params &) {
    return {0, {}};
}

std::pair<std::string, std::string>
common_download_split_repo_tag(const std::string &) {
    return {"", "latest"};
}

common_hf_file_res
common_get_hf_file(const std::string &, const std::string &, bool,
                   const common_header_list &) {
    return {};
}

bool common_download_model(const common_params_model &, const std::string &,
                           bool, const common_header_list &) {
    return false;
}

std::vector<common_cached_model_info> common_list_cached_models() {
    return {};
}

int common_download_file_single(const std::string &, const std::string &,
                                const std::string &, bool,
                                const common_header_list &) {
    return -1;
}

std::string common_docker_resolve_model(const std::string &) {
    return "";
}
