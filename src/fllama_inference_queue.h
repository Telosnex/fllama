// InferenceQueue.h
#ifndef FLLAMA_INFERENCE_QUEUE_H
#define FLLAMA_INFERENCE_QUEUE_H

#include <atomic>
#include <condition_variable>
#include <exception>
#include <functional>
#include <iostream>
#include <mutex>
#include <shared_mutex>
#include <queue>
#include <thread>
#include <unordered_map>
#include <chrono>
#include <memory>
#include "fllama.h"
#include "llama.h"


// Forward declaration for ModelHandle
class InferenceQueue;

// Model lifecycle state
enum class ModelState {
  ACTIVE,        // Model is in use
  IDLE,          // Model is cached but not in use
  BEING_DELETED  // Model is being deleted
};

struct ModelResources {
  llama_model* model;
  llama_context* ctx;
  std::string path;  // Store the model path for reference
  std::chrono::time_point<std::chrono::steady_clock> last_used;
  std::atomic<int> active_users;
  std::atomic<ModelState> state;
  std::atomic<bool> context_locked{false};  // For exclusive context access
  
  ModelResources(llama_model* m, llama_context* c, const std::string& p)
      : model(m), ctx(c), path(p),
        last_used(std::chrono::steady_clock::now()),
        active_users(0),
        state(ModelState::IDLE) {}

  // Keep track of the tokens that are currently loaded in the KV cache of
  // this context. The sequence is the full conversation so far (prompt + all
  // generated tokens).  If a new request arrives whose input tokens have this
  // vector as a strict prefix, we can reuse the context and simply append the
  // suffix tokens instead of starting from an empty context.
  std::vector<llama_token> token_state;
  // Guard for concurrent access to token_state
  std::mutex token_state_mutex;
  
  // Try to acquire exclusive context access
  bool try_lock_context() {
    bool expected = false;
    return context_locked.compare_exchange_strong(expected, true, 
                                                 std::memory_order_acq_rel);
  }
  
  // Release exclusive context access
  void unlock_context() {
    context_locked.store(false, std::memory_order_release);
  }
};

// RAII handle for model access
class ModelHandle {
private:
  std::shared_ptr<ModelResources> resources;
  InferenceQueue* queue;
  bool released = false;
  
public:
  ModelHandle() = default;
  ModelHandle(std::shared_ptr<ModelResources> res, InferenceQueue* q)
      : resources(res), queue(q) {}
  
  // Move constructor and assignment
  ModelHandle(ModelHandle&& other) noexcept
      : resources(std::move(other.resources)), queue(other.queue), released(other.released) {
    other.released = true;
  }
  
  ModelHandle& operator=(ModelHandle&& other) noexcept {
    if (this != &other) {
      release();
      resources = std::move(other.resources);
      queue = other.queue;
      released = other.released;
      other.released = true;
    }
    return *this;
  }
  
  // Delete copy operations
  ModelHandle(const ModelHandle&) = delete;
  ModelHandle& operator=(const ModelHandle&) = delete;
  
  ~ModelHandle() {
    release();
  }
  
  void release();
  
  bool valid() const { return resources && !released; }
  llama_model* model() const { return valid() ? resources->model : nullptr; }
  llama_context* ctx() const { return valid() ? resources->ctx : nullptr; }
  ModelResources* operator->() const { return resources.get(); }
  ModelResources& operator*() const { return *resources; }
  
  // Check if context can be reused and lock it atomically
  bool try_lock_context_for_reuse() {
    if (!valid()) return false;
    
    // Try to lock first
    if (!resources->try_lock_context()) {
      return false;
    }
    
    // Then verify we're still the only user
    if (resources->active_users.load(std::memory_order_acquire) != 1) {
      resources->unlock_context();
      return false;
    }
    
    return true;
  }
  
  // Unlock the context after use
  void unlock_context() {
    if (valid()) {
      resources->unlock_context();
    }
  }
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
  // Configurable timeouts (can be set before starting)
  static int MODEL_INACTIVITY_TIMEOUT_SEC;
  static int CLEANUP_INTERVAL_SEC;
  
  // Static methods to configure timeouts
  static void set_model_timeout(int seconds) { MODEL_INACTIVITY_TIMEOUT_SEC = seconds; }
  static void set_cleanup_interval(int seconds) { CLEANUP_INTERVAL_SEC = seconds; }
  
  InferenceQueue();
  ~InferenceQueue();

  // Enqueue a new inference request
  void enqueue(fllama_inference_request request,
               fllama_inference_callback callback);
  void cancel(int request_id);
  bool is_cancelled(int request_id);
  
  // New model caching methods using handles
  ModelHandle get_model_handle(const std::string& model_path);
  ModelHandle register_and_acquire_model(const std::string& model_path, 
                                         llama_model* model, 
                                         llama_context* ctx);
  
  // Legacy methods (to be deprecated)
  // WARNING: These methods have race conditions and should not be used
  // Use get_model_handle() and register_and_acquire_model() instead
  [[deprecated("Use get_model_handle() instead - this method has race conditions")]]
  std::tuple<llama_model*, llama_context*> get_cached_model(const std::string& model_path);
  
  [[deprecated("Use get_model_handle() instead - this method has race conditions")]]
  ModelResources* get_model_resources(const std::string& model_path);
  
  [[deprecated("Use get_model_handle()->try_lock_context_for_reuse() instead")]]
  bool can_reuse_context(const std::string& model_path);
  
  // Internal methods - should not be called directly
  void register_model(const std::string& model_path, llama_model* model, 
                      llama_context* ctx);
  void mark_model_used(const std::string& model_path);
  void increment_model_users(const std::string& model_path);
  void decrement_model_users(const std::string& model_path);
  void check_inactive_models();
  
  // For ModelHandle to call on release
  void release_model_handle(const std::string& model_path);

private:
  std::thread worker;               // Worker thread to process tasks
  std::thread cleanup_thread;       // Thread for checking inactive models
  std::mutex queue_lock;            // Mutex for managing the task queue
  std::mutex inference_lock;        // Mutex for managing inference operations
  mutable std::shared_mutex models_lock;  // Read-write lock for the models cache
  std::condition_variable cond_var; // Condition variable for task signaling
  std::condition_variable_any cleanup_cond_var; // Condition variable for cleanup signaling
  std::queue<TaskWrapper> tasks;    // Queue of tasks
  std::atomic<bool> done{false};    // Flag to control the lifecycle of the worker thread

  std::unordered_map<int, bool> cancel_flags;
  std::unordered_map<std::string, std::shared_ptr<ModelResources>> cached_models;
  
  // Private methods
  void process_inference();
  void cleanup_inactive_models();
  std::shared_ptr<ModelResources> extract_model_if_inactive(const std::string& model_path);
};

// Implementation of ModelHandle::release
inline void ModelHandle::release() {
  if (resources && queue && !released) {
    queue->release_model_handle(resources->path);
    released = true;
  }
}

#endif // FLLAMA_INFERENCE_QUEUE_H