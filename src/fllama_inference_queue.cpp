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
    std::lock_guard<std::mutex> lock(queue_lock);
    cancel_flags.clear();
  }
  {
    std::lock_guard<std::mutex> lock(inference_lock);
    done = true;
  }
  cond_var.notify_one();
  if (worker.joinable()) {
    worker.join();
  }
}

void InferenceQueue::enqueue(fllama_inference_request request,
                             fllama_inference_callback callback) {
  std::lock_guard<std::mutex> lock(queue_lock);
  TaskWrapper taskWrapper(
      [request, callback]() { fllama_inference_sync(request, callback); },
      request.request_id);
  tasks.emplace(std::move(taskWrapper));
  cond_var.notify_one();
}

void InferenceQueue::cancel(int request_id) {
  {
    std::lock_guard<std::mutex> lock(queue_lock);
    cancel_flags[request_id] = true;
  }
  cond_var.notify_one();
}

bool InferenceQueue::is_cancelled(int request_id) {
  std::lock_guard<std::mutex> lock(queue_lock);
  return cancel_flags.find(request_id) != cancel_flags.end() &&
         cancel_flags[request_id];
}

void InferenceQueue::process_inference() {
  while (true) {

    std::unique_ptr<TaskWrapper> taskWrapperPtr;
    int current_request_id;

    { // Scope for the queue lock
      std::unique_lock<std::mutex> queueLock(queue_lock);
      cond_var.wait(queueLock, [this] { return !tasks.empty() || done; });

      if (done && tasks.empty()) {
        break;
      }

      // Use std::make_unique for C++14 and above. For C++11, use new
      // TaskWrapper(...)
      taskWrapperPtr = std::unique_ptr<TaskWrapper>(
          new TaskWrapper(std::move(tasks.front())));

      current_request_id = taskWrapperPtr->request_id;

      tasks.pop(); // Remove the task from the queue here
    }              // Release the queue lock as soon as possible

    // Log the request_id to the console
    std::cout << "Processing request: " << current_request_id << std::endl;

    { // Scope to check cancellation flag
      std::lock_guard<std::mutex> inferenceLock(inference_lock);
      if (cancel_flags.find(current_request_id) != cancel_flags.end() &&
          cancel_flags[current_request_id]) {
        // If the task is cancelled, do not execute it. Clean up cancellation
        // flag after checking.
        cancel_flags.erase(current_request_id);
        continue;
      }
    } // Release the inference lock

    // Now safe to execute the task outside of any locks.
    // Since taskWrapperPtr is a std::unique_ptr<TaskWrapper>, access members
    // using ->
    if (taskWrapperPtr) {
      (*taskWrapperPtr)();
    }
  }
}