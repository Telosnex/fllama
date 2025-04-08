// InferenceQueue.h
#ifndef FLLAMA_INFERENCE_QUEUE_H
#define FLLAMA_INFERENCE_QUEUE_H

#include <atomic>
#include <condition_variable>
#include <exception>
#include <functional>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <unordered_map>
#include <chrono>
#include <memory>
#include "fllama.h"
#include "llama.h"

#if defined(__GNUC__) && __GNUC__ < 5 && !defined(__clang__)
namespace std {
  template <>
  struct atomic<bool> {
    bool _M_i;
    atomic() noexcept = default;
    constexpr atomic(bool __i) noexcept : _M_i(__i) {}
    bool operator=(bool __i) volatile noexcept {
      _M_i = __i;
      return __i
    }
    operator bool() const volatile noexcept { return _M_i; }
  };
}
#endif 

struct ModelResources {
  llama_model* model;
  llama_context* ctx;
  std::chrono::time_point<std::chrono::steady_clock> last_used;
  
  ModelResources(llama_model* m, llama_context* c)
      : model(m), ctx(c),
        last_used(std::chrono::steady_clock::now()) {}
};

struct TaskWrapper {
  std::function<void()> task; // Actual task to execute
  int request_id;             // Unique ID for the request

  TaskWrapper(std::function<void()> task, int request_id)
      : task(std::move(task)), request_id(request_id) {}

  void operator()() const { task(); }
};

class InferenceQueue {
public:
  // Time in seconds after which an inactive model should be freed
  static const int MODEL_INACTIVITY_TIMEOUT_SEC = 15;
  
  InferenceQueue();
  ~InferenceQueue();

  // Enqueue a new inference request
  void enqueue(fllama_inference_request request,
               fllama_inference_callback callback);
  void cancel(int request_id);
  bool is_cancelled(int request_id);
  
  // Model caching methods
  void register_model(const std::string& model_path, llama_model* model, 
                      llama_context* ctx);
  std::tuple<llama_model*, llama_context*> get_cached_model(const std::string& model_path);
  void mark_model_used(const std::string& model_path);
  void check_inactive_models();

private:
  std::thread worker;               // Worker thread to process tasks
  std::thread cleanup_thread;       // Thread for checking inactive models
  std::mutex queue_lock;            // Mutex for managing the task queue
  std::mutex inference_lock;        // Mutex for managing inference operations
  std::mutex models_lock;           // Mutex for the models cache
  std::condition_variable cond_var; // Condition variable for task signaling
  std::condition_variable cleanup_cond_var; // Condition variable for cleanup signaling
  std::queue<TaskWrapper> tasks;    // Queue of tasks
  bool done; // Flag to control the lifecycle of the worker thread

  std::unordered_map<int, std::atomic<bool>> cancel_flags;
  std::unordered_map<std::string, std::unique_ptr<ModelResources>> cached_models;
  
  // Private methods
  void process_inference();
  void cleanup_inactive_models();
  void free_model_resources(const std::string& model_path);
};

#endif // FLLAMA_INFERENCE_QUEUE_H