#include "fllama_inference_queue.h"
#include <atomic>
#include <exception>
#include <iostream>
#include <unordered_map>

// If fllama_inference_request and fllama_inference_callback types are defined
// in an external header, include that here.
InferenceQueue::InferenceQueue()
    : done(false), worker(&InferenceQueue::process_inference, this) {}

InferenceQueue::~InferenceQueue() {
  {
    std::lock_guard<std::mutex> lock(mutex);
    cancel_flags.clear();
  }
  {
    std::lock_guard<std::mutex> lock(mutex);
    done = true;
  }
  cond_var.notify_one();
  if (worker.joinable()) {
    worker.join();
  }
}

void InferenceQueue::enqueue(fllama_inference_request request,
                             fllama_inference_callback callback) {
  std::lock_guard<std::mutex> lock(mutex);
  // Convert id from char* to std::string
  std::string requestId = request.request_id ? std::string(request.request_id) : "";

  TaskWrapper taskWrapper(
      [request, callback]() { fllama_inference_sync(request, callback); },
      requestId);
  tasks.emplace(std::move(taskWrapper));
  cond_var.notify_one();
}

void InferenceQueue::cancel(const std::string &request_id) {
  {
    std::lock_guard<std::mutex> lock(mutex);
    cancel_flags[request_id] = true;
  }
  cond_var.notify_one();
}

void InferenceQueue::process_inference() {
    while (true) {
        {
            std::unique_lock<std::mutex> lock(mutex);
            cond_var.wait(lock, [this] { return !tasks.empty() || done; });
            // Now the loop only continues if there's work to do or if we're done.
            if (done && tasks.empty()) {
                break;
            }

            auto& taskWrapper = tasks.front();
            // This grabs the request_id from the current task being processed.
            std::string current_request_id = taskWrapper.request_id;
            // Log the request_id to the console.
            std::cout << "Processing request: " << current_request_id << std::endl;
            // Check if the current task has been cancelled.
            if (cancel_flags.find(current_request_id) != cancel_flags.end() && cancel_flags[current_request_id]) {
                // If the task is cancelled, simply remove it from the queue and continue to the next iteration.
                tasks.pop();
                cancel_flags.erase(current_request_id); // Clean up cancellation flag after processing.
                continue;
            }

            // If you get here, it means the task is not cancelled and should be executed.
            // Now execute the wrapped task while still within the locked scope but outside of the condition variable wait.
            // Note: We directly use the task stored within the TaskWrapper here.
            taskWrapper.task();
            
            // Once the task has been executed, it can be removed from the queue.
            tasks.pop();
            // The logic here assumes that once a task is executed, it’s no longer necessary to check its cancellation flag.
            // However, if tasks could potentially be re-queued or looked up via their ID for other reasons, you might adjust this logic.
        }
        // After processing each task, it might be beneficial to include a short delay or a mechanism to yield the processor.
        // This can help in managing CPU usage, especially in a busy loop if new tasks are infrequently added.
        // std::this_thread::yield(); // For example, to yield execution to other threads.
    }
}