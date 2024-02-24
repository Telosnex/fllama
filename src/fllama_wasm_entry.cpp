#include "fllama_eos.h" // Include the header where your function is declared

extern "C" {
    const char *fllama_get_eos_token_export(const char *fname) {
        return fllama_get_eos_token(fname); // Call your library function
    }
}

int main() {
    // This might remain empty if you're primarily calling functions from JavaScript.
    // Or perform any initialization needed.
}