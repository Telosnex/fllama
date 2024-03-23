// InferenceQueue.h
#ifndef FLLAMA_INFERENCE_QUEUE_H
#define FLLAMA_INFERENCE_QUEUE_H

#include <condition_variable>
#include <exception>
#include <functional>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <unordered_map>
#include "fllama.h"

struct TaskWrapper {
  std::function<void()> task; // Actual task to execute
  int request_id;             // Unique ID for the request

  TaskWrapper(std::function<void()> task, int request_id)
      : task(std::move(task)), request_id(request_id) {}

  void operator()() const { task(); }
};

class InferenceQueue {
public:
  InferenceQueue();
  ~InferenceQueue();

  // Enqueue a new inference request
  void enqueue(fllama_inference_request request,
               fllama_inference_callback callback);
  void cancel(int request_id);
  bool is_cancelled(int request_id);

private:
  std::thread worker;               // Worker thread to process tasks
  std::mutex queue_lock;            // Mutex for managing the task queue
  std::mutex inference_lock;        // Mutex for managing inference operations
  std::condition_variable cond_var; // Condition variable for task signaling
  std::queue<TaskWrapper> tasks;    // Queue of tasks
  bool done; // Flag to control the lifecycle of the worker thread

  std::unordered_map<int, std::atomic<bool>> cancel_flags;

  // Private method to be run by the worker thread
  void process_inference();
};

#endif // FLLAMA_INFERENCE_QUEUE_H