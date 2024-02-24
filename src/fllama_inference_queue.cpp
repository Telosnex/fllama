#include "fllama_inference_queue.h"
#include <iostream>
#include <exception>

// If fllama_inference_request and fllama_inference_callback types are defined in
// an external header, include that here.
InferenceQueue::InferenceQueue()
    : done(false), worker(&InferenceQueue::process_inference, this) {
}

InferenceQueue::~InferenceQueue() {
    {
        std::lock_guard<std::mutex> lock(mutex);
        done = true;
    }
    cond_var.notify_one();
    if (worker.joinable()) {
        worker.join();
    }
}

void InferenceQueue::enqueue(fllama_inference_request request, fllama_inference_callback callback) {
    {
        std::lock_guard<std::mutex> lock(mutex);
        tasks.emplace([request, callback]() { fllama_inference_sync(request, callback); });
    }
    cond_var.notify_one();
}

void InferenceQueue::process_inference() {
    while (true) {
        std::function<void()> task;
        {
            std::unique_lock<std::mutex> lock(mutex);
            cond_var.wait(lock, [this] { return !tasks.empty() || done; });
            if (done && tasks.empty())
                break;
            task = std::move(tasks.front());
            tasks.pop();
        }
        try {
            task();
        } catch (const std::exception& e) {
            std::cout << "[fllama] Exception: " << e.what() << std::endl;
        }
    }
}