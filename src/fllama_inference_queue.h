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


struct ModelResources {
  llama_model* model;
  llama_context* ctx;
  std::chrono::time_point<std::chrono::steady_clock> last_used;
  std::atomic<int> active_users;
  
  ModelResources(llama_model* m, llama_context* c)
      : model(m), ctx(c),
        last_used(std::chrono::steady_clock::now()),
        active_users(0) {}

  // Keep track of the tokens that are currently loaded in the KV cache of
  // this context. The sequence is the full conversation so far (prompt + all
  // generated tokens).  If a new request arrives whose input tokens have this
  // vector as a strict prefix, we can reuse the context and simply append the
  // suffix tokens instead of starting from an empty context.
  std::vector<llama_token> token_state;
  // Guard for concurrent access to token_state
  std::mutex token_state_mutex;
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
  // Direct access to the ModelResources struct for advanced use cases such as
  // context / token-state reuse logic.  Returns nullptr if the model is not
  // cached.
  ModelResources* get_model_resources(const std::string& model_path);

  // Checks if context reuse is possible without incrementing active_users
  bool can_reuse_context(const std::string& model_path);
  void mark_model_used(const std::string& model_path);
  void increment_model_users(const std::string& model_path);
  void decrement_model_users(const std::string& model_path);
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

  std::unordered_map<int, bool> cancel_flags;
  std::unordered_map<std::string, std::unique_ptr<ModelResources>> cached_models;
  
  // Private methods
  void process_inference();
  void cleanup_inactive_models();
  void free_model_resources(const std::string& model_path);
};

#endif // FLLAMA_INFERENCE_QUEUE_H