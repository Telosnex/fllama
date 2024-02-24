#include "fllama_chat_template.h"
#include "fllama_eos.h"
#include "fllama_tokenize.h"
extern "C" {
    const char *fllama_get_eos_token_export(const char *fname) {
        return fllama_get_eos_token(fname);
    }
    
    void fllama_tokenize_export(struct fllama_tokenize_request request, fllama_tokenize_callback callback) {
        fllama_tokenize(request, callback);
    }

    const char *fllama_get_chat_template_export(const char *fname) {
        return fllama_get_chat_template(fname);
    }
}

int main() {
    // This might remain empty if you're primarily calling functions from JavaScript.
    // Or perform any initialization needed.
}