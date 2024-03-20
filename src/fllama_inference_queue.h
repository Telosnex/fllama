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
#include "fllama.h"

struct TaskWrapper {
  std::function<void()> task; // Actual task to execute
  std::string request_id;     // Unique ID for the request

  TaskWrapper(std::function<void()> task, std::string request_id)
      : task(std::move(task)), request_id(std::move(request_id)) {}

  void operator()() const { task(); }
};

class InferenceQueue {
public:
  InferenceQueue();
  ~InferenceQueue();

  // Enqueue a new inference request
  void enqueue(fllama_inference_request request,
               fllama_inference_callback callback);
  void cancel(const std::string &request_id);

private:
  std::thread worker;               // Worker thread to process tasks
  std::mutex mutex;                 // Mutex for thread safety
  std::condition_variable cond_var; // Condition variable for task signaling
  std::queue<TaskWrapper> tasks;    // Queue of tasks
  bool done; // Flag to control the lifecycle of the worker thread

  std::unordered_map<std::string, std::atomic<bool>> cancel_flags;

  // Private method to be run by the worker thread
  void process_inference();
};

#endif // FLLAMA_INFERENCE_QUEUE_H