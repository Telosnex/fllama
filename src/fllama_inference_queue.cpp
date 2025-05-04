#include "fllama_inference_queue.h"
#include <atomic>
#include <exception>
#include <iostream>
#include <unordered_map>
#include <chrono>
#include <thread>

// If fllama_inference_request and fllama_inference_callback types are defined
// in an external header, include that here.
InferenceQueue::InferenceQueue()
    : done(false), 
      worker(&InferenceQueue::process_inference, this),
      cleanup_thread(&InferenceQueue::cleanup_inactive_models, this) {}

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
  cleanup_cond_var.notify_one();
  
  if (worker.joinable()) {
    worker.join();
  }
  
  if (cleanup_thread.joinable()) {
    cleanup_thread.join();
  }
  
  // Free any remaining models
  std::lock_guard<std::mutex> lock(models_lock);
  for (auto& pair : cached_models) {
    auto& resources = pair.second;
    if (resources->ctx) llama_free(resources->ctx);
    if (resources->model) llama_model_free(resources->model);
  }
  cached_models.clear();
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

void InferenceQueue::register_model(const std::string& model_path, llama_model* model, 
                               llama_context* ctx) {
  std::lock_guard<std::mutex> lock(models_lock);
  
  // Check if model already exists
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    // Model exists, update its last_used timestamp
    it->second->last_used = std::chrono::steady_clock::now();
    return;
  }
  
  // Create a new model resource entry - note: we don't store the sampler anymore
  cached_models[model_path] = 
      std::unique_ptr<ModelResources>(new ModelResources(model, ctx));
  
  // Initialize active_users to 0 - the caller should use get_cached_model() afterward
  // which will properly increment the counter
  cached_models[model_path]->active_users.store(0, std::memory_order_relaxed);
  
  std::cout << "[InferenceQueue] Registered model: " << model_path << " (waiting for first use)" << std::endl;
}

std::tuple<llama_model*, llama_context*> 
InferenceQueue::get_cached_model(const std::string& model_path) {
  std::lock_guard<std::mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    // Update the last_used timestamp
    it->second->last_used = std::chrono::steady_clock::now();
    // Increment the active users counter using atomic operations
    int current = it->second->active_users.fetch_add(1, std::memory_order_relaxed) + 1;
    std::cout << "[InferenceQueue] Model " << model_path << " in use by " 
              << current << " processes" << std::endl;
    // Return model and context
    return std::make_tuple(it->second->model, it->second->ctx);
  }
  
  // Model not found in cache
  return std::make_tuple(nullptr, nullptr);
}

ModelResources* InferenceQueue::get_model_resources(const std::string& model_path) {
  std::lock_guard<std::mutex> lock(models_lock);
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    return it->second.get();
  }
  return nullptr;
}

bool InferenceQueue::can_reuse_context(const std::string& model_path) {
  std::lock_guard<std::mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    // We can reuse context if no active users
    return it->second->active_users.load(std::memory_order_relaxed) == 0;
  }
  
  // Can't reuse context for a model that's not cached
  return false;
}

void InferenceQueue::mark_model_used(const std::string& model_path) {
  std::lock_guard<std::mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    it->second->last_used = std::chrono::steady_clock::now();
  }
}

void InferenceQueue::increment_model_users(const std::string& model_path) {
  std::lock_guard<std::mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    int current = it->second->active_users.fetch_add(1, std::memory_order_relaxed) + 1;
    std::cout << "[InferenceQueue] Model " << model_path << " in use by " 
              << current << " processes" << std::endl;
  }
}

void InferenceQueue::decrement_model_users(const std::string& model_path) {
  std::lock_guard<std::mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    int prev = it->second->active_users.load(std::memory_order_relaxed);
    if (prev > 0) {
      int current = it->second->active_users.fetch_sub(1, std::memory_order_relaxed) - 1;
      std::cout << "[InferenceQueue] Model " << model_path << " now in use by " 
                << current << " processes" << std::endl;
      
      if (current == 0) {
        std::cout << "[InferenceQueue] Model " << model_path 
                  << " has no active users. Context can now be reused." << std::endl;
      }
    } else {
      std::cout << "[InferenceQueue] Warning: Attempted to decrement user count for " 
                << model_path << " but count is already 0" << std::endl;
    }
    // Update last_used timestamp when a user is done with the model
    it->second->last_used = std::chrono::steady_clock::now();
  } else {
    std::cout << "[InferenceQueue] Warning: Attempted to decrement user count for non-existent model: "
              << model_path << std::endl;
  }
}

void InferenceQueue::check_inactive_models() {
  cleanup_cond_var.notify_one();
}

void InferenceQueue::free_model_resources(const std::string& model_path) {
  // This method should be called with models_lock already acquired
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    auto& resources = it->second;
    
    // Only free if no active users
    int users = resources->active_users.load(std::memory_order_relaxed);
    if (users > 0) {
      std::cout << "[InferenceQueue] Cannot free model " << model_path 
                << " - still has " << users << " active users" << std::endl;
      return;
    }
    
    std::cout << "[InferenceQueue] Freeing model resources for: " << model_path << std::endl;
    
    if (resources->ctx) llama_free(resources->ctx);
    if (resources->model) llama_model_free(resources->model);
    
    cached_models.erase(it);
  }
}

void InferenceQueue::cleanup_inactive_models() {
  while (!done) {
    // Wait for a cleanup notification or timeout
    {
      std::unique_lock<std::mutex> lock(models_lock);
      
      // Wait for notification or timeout (5 seconds)
      auto status = cleanup_cond_var.wait_for(lock, std::chrono::seconds(5),
                                             [this]{ return done; });
      
      // Check each model's inactivity time
      auto now = std::chrono::steady_clock::now();
      std::vector<std::string> models_to_free;
      
      for (const auto& pair : cached_models) {
        const std::string& path = pair.first;
        const auto& resources = pair.second;
        
        auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(
            now - resources->last_used).count();
        
        // Only consider freeing models that have been inactive AND have no active users
        int users = resources->active_users.load(std::memory_order_relaxed);
        if (elapsed >= MODEL_INACTIVITY_TIMEOUT_SEC && users == 0) {
          models_to_free.push_back(path);
        } else if (elapsed >= MODEL_INACTIVITY_TIMEOUT_SEC) {
          std::cout << "[InferenceQueue] Model " << path 
                    << " inactive for " << elapsed << "s but has " 
                    << users << " active users" << std::endl;
        }
      }
      
      // Free resources for inactive models
      for (const auto& path : models_to_free) {
        free_model_resources(path);
      }
    }
  }
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
      try {
        (*taskWrapperPtr)();
      } catch (const std::exception &e) {
        // Log exception but continue processing queue
        std::cerr << "[InferenceQueue] Exception in task execution: " 
                  << e.what() << std::endl;
      } catch (...) {
        std::cerr << "[InferenceQueue] Unknown exception in task execution" << std::endl;
      }
    }
    
    // Trigger cleanup check after each task completes
    cleanup_cond_var.notify_one();
  }
}