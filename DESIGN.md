Current implementation based on llama.cpp/examples/simple/simple.cpp combined
with handling sampling manually via top_p and temp functions.

The other route you'll see is setting up a sampling context, but it doesn't
work well without a lot of hand-holding - ex. manually specifying the exact
samplers you want to use. If you just use it straight-up, one of the other 6
techniques outside top-P and temperature overrides temperature, somehow.

It's incompatible with what seems to be the "new batch API", which it seems
simple.cpp used. But who knows, that'd require some semblance of
documentation.

macOS and iOS based on intuition that:
- it will be difficult to get llama.cpp building as a CMakeLists library.
- a .podspec is a pseudo-CMakeLists file.
- creating a seperate llama.cpp .podspec is not ideal as llama.cpp
support
  is necessarily opinionated - ex. whether or not to pursue Metal
  support.

Thus, integrating by copying the llama.cpp source to
{ios/macos}/Classes/llama.cpp was the best option. After repeatedly
building and fixing errors requiring relative imports, you then have a
llama.cpp library that can be used in the iOS and macOS.

Due to the copying, the build is entirely contained within the codebase.
Updating versions required updating the submodule _and_ copying the files
to the iOS and macOS directories, and then fixing relative imports. This
takes about 20 minutes, tops.
3 files:
- llama.cpp/common/common.h
- llama.cpp/common/grammar-parser.h
- llama.cpp/common/sampling.h