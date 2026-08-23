// Adapted from flutter_zxing (MIT License, Copyright (c) 2022 Khoren
// Markosyan): https://github.com/khoren93/flutter_zxing
//
// Changes from upstream: made self-contained (no zxcommon.h), Win32 detection
// via _WIN32.
#pragma once

#include <cstdint>
#include <cstdlib>
#include <exception>
#include <memory>

#if defined(_WIN32)
#include <objbase.h>
#endif

/// `dart_allocator` is a `std::allocator` impl that can:
///
/// (1) safely allocate memory in C++ that is later freed inside the Dart VM
/// (2) safely free memory in C++ that was earlier allocated inside the Dart VM
///
/// On Unix-like systems, this uses the libc allocator fns `malloc` and `free`.
/// On Windows, this uses `CoTaskMemAlloc` and `CoTaskMemFree`.
///
/// !! You must use this allocator _exclusively_ to manage every owned pointer
/// !! that crosses to/from Dart.
///
/// See: <https://pub.dev/documentation/ffi/latest/ffi/malloc-constant.html>
template <typename T>
class dart_allocator {
public:
    typedef T value_type;

    dart_allocator() = default;

    template <class U>
    constexpr dart_allocator(const dart_allocator<U>&) noexcept {}

    /// Allocates `n * sizeof(T)` bytes of uninit memory on the same global
    /// allocator as the Dart VM.
    [[nodiscard]]
    T* allocate(std::size_t n) noexcept
    {
#if defined(_WIN32)
        T* p = static_cast<T*>(CoTaskMemAlloc(n * sizeof(T)));
#else
        T* p = static_cast<T*>(std::malloc(n * sizeof(T)));
#endif

        // If allocation fails, normally we `throw std::bad_alloc()`. However:
        //
        // (1) We need to call this allocator near the FFI boundary (which we
        //     can't unwind across)
        // (2) We only allocate a small amount with this allocator
        //
        // Therefore it's safer for us to just abort on this super rare
        // allocation failure event.
        if (p == nullptr) {
            std::terminate();
        }

        return p;
    }

    /// Deallocates `p` from the Dart VM global allocator.
    void deallocate(T* p, std::size_t /*n*/) noexcept
    {
#if defined(_WIN32)
        CoTaskMemFree(p);
#else
        std::free(p);
#endif
    }
};

template <class T, class U>
constexpr bool operator==(const dart_allocator<T>&, const dart_allocator<U>&) { return true; }

template <class T, class U>
constexpr bool operator!=(const dart_allocator<T>&, const dart_allocator<U>&) { return false; }

/// Convenience fn. See `dart_allocator<T>::allocate`.
template <typename T>
[[nodiscard]]
T* dart_malloc(std::size_t n) noexcept
{
    return dart_allocator<T>{}.allocate(n);
}

/// Convenience fn. See `dart_allocator<T>::deallocate`.
template <typename T>
void dart_free(T* p) noexcept
{
    dart_allocator<T>{}.deallocate(p, 1 /* wrong but unused value */);
}

/// A "deleter" for `std::unique_ptr` that can free pointers from Dart.
struct dart_deleter {
    template <typename T>
    void operator()(T* p) const noexcept
    {
        if (p != nullptr) {
            // A "deleter" also needs to run p's destructor before free'ing.
            p->~T();
            dart_allocator<T>{}.deallocate(p, 1);
        }
    }
};

/// `unique_dart_ptr` is a `unique_ptr` that can safely manage pointers
/// allocated from within Dart. In particular, it will dealloc pointers passed
/// from Dart using the same allocator that alloc'd them.
template <typename T>
using unique_dart_ptr = std::unique_ptr<T, dart_deleter>;

// Ensure `unique_dart_ptr` doesn't add any extra fn ptr overhead. It should
// just be ptr-sized.
static_assert(
    sizeof(std::unique_ptr<uint8_t>) == sizeof(unique_dart_ptr<uint8_t>),
    "no extra overhead"
);
