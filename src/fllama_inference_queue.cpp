#include "fllama_inference_queue.h"
#include <atomic>
#include <exception>
#include <iostream>
#include <unordered_map>
#include <chrono>
#include <thread>

// Default timeout values (can be overridden before creating InferenceQueue)
int InferenceQueue::MODEL_INACTIVITY_TIMEOUT_SEC = 15;
int InferenceQueue::CLEANUP_INTERVAL_SEC = 30;

// If fllama_inference_request and fllama_inference_callback types are defined
// in an external header, include that here.
InferenceQueue::InferenceQueue() {
  // Initialize threads after all other member variables are set
  worker = std::thread(&InferenceQueue::process_inference, this);
  cleanup_thread = std::thread(&InferenceQueue::cleanup_inactive_models, this);
}

InferenceQueue::~InferenceQueue() {
  // Set the done flag atomically
  done.store(true, std::memory_order_release);
  
  // Clear cancel flags
  {
    std::lock_guard<std::mutex> lock(queue_lock);
    cancel_flags.clear();
  }
  
  // Notify all waiting threads
  cond_var.notify_all();
  cleanup_cond_var.notify_all();
  
  if (worker.joinable()) {
    worker.join();
  }
  
  if (cleanup_thread.joinable()) {
    cleanup_thread.join();
  }
  
  // Extract and free any remaining models
  std::vector<std::shared_ptr<ModelResources>> remaining_models;
  {
    std::unique_lock<std::shared_mutex> lock(models_lock);
    for (auto& pair : cached_models) {
      remaining_models.push_back(std::move(pair.second));
    }
    cached_models.clear();
  }
  
  // Free resources outside the lock
  for (auto& resources : remaining_models) {
    if (resources->ctx) llama_free(resources->ctx);
    if (resources->model) llama_model_free(resources->model);
  }
}

// New handle-based methods
ModelHandle InferenceQueue::get_model_handle(const std::string& model_path) {
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    auto& resources = it->second;
    
    // Check if model is being deleted
    ModelState expected = ModelState::IDLE;
    if (!resources->state.compare_exchange_strong(expected, ModelState::ACTIVE,
                                                 std::memory_order_acq_rel)) {
      if (expected == ModelState::BEING_DELETED) {
        return ModelHandle(); // Return invalid handle
      }
      // If already ACTIVE, that's OK
    }
    
    resources->last_used = std::chrono::steady_clock::now();
    int current = resources->active_users.fetch_add(1, std::memory_order_acq_rel) + 1;
    
    std::cout << "[InferenceQueue] Model " << model_path 
              << " in use by " << current << " processes" << std::endl;
    
    return ModelHandle(resources, this);
  }
  
  return ModelHandle(); // Return invalid handle
}

ModelHandle InferenceQueue::register_and_acquire_model(const std::string& model_path,
                                                       llama_model* model,
                                                       llama_context* ctx) {
  std::unique_lock<std::shared_mutex> lock(models_lock);
  
  // Check if already exists
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    std::cout << "[InferenceQueue] Model already registered: " << model_path << std::endl;
    lock.unlock();
    return get_model_handle(model_path);
  }
  
  // Create new resources
  auto resources = std::make_shared<ModelResources>(model, ctx, model_path);
  resources->active_users.store(1, std::memory_order_release); // Start with 1 user
  resources->state.store(ModelState::ACTIVE, std::memory_order_release);
  
  cached_models[model_path] = resources;
  
  std::cout << "[InferenceQueue] Registered and acquired model: " << model_path << std::endl;
  
  return ModelHandle(resources, this);
}

void InferenceQueue::release_model_handle(const std::string& model_path) {
  // Use shared lock since we're just updating atomic counters
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    auto& resources = it->second;
    int prev = resources->active_users.fetch_sub(1, std::memory_order_acq_rel);
    
    if (prev == 1) {
      // Last user - transition to IDLE
      ModelState expected = ModelState::ACTIVE;
      resources->state.compare_exchange_strong(expected, ModelState::IDLE,
                                             std::memory_order_acq_rel);
      std::cout << "[InferenceQueue] Model " << model_path 
                << " has no active users. State -> IDLE. Context can now be reused." << std::endl;
    } else if (prev > 1) {
      std::cout << "[InferenceQueue] Model " << model_path << " now in use by " 
                << (prev - 1) << " processes" << std::endl;
    } else {
      std::cerr << "[InferenceQueue] ERROR: Attempted to decrement user count for " 
                << model_path << " but count was already 0. This indicates a logic error!" << std::endl;
    }
    
    resources->last_used = std::chrono::steady_clock::now();
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
         cancel_flags[request_id] == true;
}

void InferenceQueue::register_model(const std::string& model_path, llama_model* model, 
                               llama_context* ctx) {
  std::unique_lock<std::shared_mutex> lock(models_lock);
  
  // Check if model already exists
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    // Model exists, update its last_used timestamp
    it->second->last_used = std::chrono::steady_clock::now();
    return;
  }
  
  // Create a new model resource entry
  auto resources = std::make_shared<ModelResources>(model, ctx, model_path);
  
  // Initialize active_users to 0 - the caller should use get_cached_model() afterward
  // which will properly increment the counter
  resources->active_users.store(0, std::memory_order_release);
  resources->state.store(ModelState::IDLE, std::memory_order_release);
  
  cached_models[model_path] = resources;
  
  std::cout << "[InferenceQueue] Registered model: " << model_path << " (waiting for first use)" << std::endl;
}

std::tuple<llama_model*, llama_context*> 
InferenceQueue::get_cached_model(const std::string& model_path) {
  // WARNING: This method has a race condition - the model could be freed
  // after we return the pointers. Use get_model_handle() instead.
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    auto& resources = it->second;
    
    // Check if model is being deleted
    ModelState state = resources->state.load(std::memory_order_acquire);
    if (state == ModelState::BEING_DELETED) {
      return std::make_tuple(nullptr, nullptr);
    }
    
    // Update the last_used timestamp
    resources->last_used = std::chrono::steady_clock::now();
    // Increment the active users counter using atomic operations
    int current = resources->active_users.fetch_add(1, std::memory_order_acq_rel) + 1;
    std::cout << "[InferenceQueue] Model " << model_path << " in use by " 
              << current << " processes" << std::endl;
    // Return model and context - RACE CONDITION: could be freed after we return!
    return std::make_tuple(resources->model, resources->ctx);
  }
  
  // Model not found in cache
  return std::make_tuple(nullptr, nullptr);
}

ModelResources* InferenceQueue::get_model_resources(const std::string& model_path) {
  // WARNING: This method returns a raw pointer that could become invalid.
  // Use get_model_handle() instead.
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    return it->second.get();
  }
  return nullptr;
}

bool InferenceQueue::can_reuse_context(const std::string& model_path) {
  // WARNING: This has a TOCTOU race - use get_model_handle()->can_reuse_context() instead
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    // We can reuse context if no active users
    return it->second->active_users.load(std::memory_order_acquire) == 0;
  }
  
  // Can't reuse context for a model that's not cached
  return false;
}

void InferenceQueue::mark_model_used(const std::string& model_path) {
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    it->second->last_used = std::chrono::steady_clock::now();
  }
}

void InferenceQueue::increment_model_users(const std::string& model_path) {
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    // Check state before incrementing
    ModelState state = it->second->state.load(std::memory_order_acquire);
    if (state == ModelState::BEING_DELETED) {
      std::cout << "[InferenceQueue] Warning: Cannot increment users for model being deleted: " 
                << model_path << std::endl;
      return;
    }
    
    int current = it->second->active_users.fetch_add(1, std::memory_order_acq_rel) + 1;
    std::cout << "[InferenceQueue] Model " << model_path << " in use by " 
              << current << " processes" << std::endl;
  }
}

void InferenceQueue::decrement_model_users(const std::string& model_path) {
  std::shared_lock<std::shared_mutex> lock(models_lock);
  
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    int prev = it->second->active_users.load(std::memory_order_acquire);
    if (prev > 0) {
      int current = it->second->active_users.fetch_sub(1, std::memory_order_acq_rel) - 1;
      std::cout << "[InferenceQueue] Model " << model_path << " now in use by " 
                << current << " processes" << std::endl;
      
      if (current == 0) {
        std::cout << "[InferenceQueue] Model " << model_path 
                  << " has no active users. Context can now be reused." << std::endl;
        // Update state to IDLE
        ModelState expected = ModelState::ACTIVE;
        it->second->state.compare_exchange_strong(expected, ModelState::IDLE,
                                                 std::memory_order_acq_rel);
      }
    } else {
      // This is a logic error that should be treated seriously
      std::cerr << "[InferenceQueue] ERROR: Attempted to decrement user count for " 
                << model_path << " but count is already 0. This indicates a logic error!" << std::endl;
      // Always handle this error consistently - log error but don't throw
      // This prevents different behavior between debug and release builds
      return; // Prevent further damage
    }
    // Update last_used timestamp when a user is done with the model
    it->second->last_used = std::chrono::steady_clock::now();
  } else {
    std::cerr << "[InferenceQueue] ERROR: Attempted to decrement user count for non-existent model: "
              << model_path << std::endl;
    // This indicates a serious logic error in the calling code
    // Log error but don't throw to maintain consistent behavior
  }
}

void InferenceQueue::check_inactive_models() {
  cleanup_cond_var.notify_one();
}

std::shared_ptr<ModelResources> InferenceQueue::extract_model_if_inactive(const std::string& model_path) {
  // This method should be called with models_lock already acquired (write lock)
  auto it = cached_models.find(model_path);
  if (it != cached_models.end()) {
    auto& resources = it->second;
    
    // Check users first with acquire ordering
    int users = resources->active_users.load(std::memory_order_acquire);
    if (users > 0) {
      std::cout << "[InferenceQueue] Cannot free model " << model_path 
                << " - has " << users << " active users" << std::endl;
      return nullptr;
    }
    
    // Now try to change state
    ModelState expected_state = ModelState::IDLE;
    if (!resources->state.compare_exchange_strong(expected_state, ModelState::BEING_DELETED,
                                                 std::memory_order_acq_rel)) {
      // Model is either ACTIVE or already BEING_DELETED
      if (expected_state == ModelState::ACTIVE) {
        std::cout << "[InferenceQueue] Cannot free model " << model_path 
                  << " - state is ACTIVE" << std::endl;
      }
      return nullptr;
    }
    
    // Double-check users after state change
    users = resources->active_users.load(std::memory_order_acquire);
    if (users > 0) {
      // Race condition: someone grabbed it between state check and user check
      // Revert state
      resources->state.store(ModelState::IDLE, std::memory_order_release);
      std::cout << "[InferenceQueue] Model " << model_path 
                << " became active during cleanup check (" << users << " users)" << std::endl;
      return nullptr;
    }
    
    std::cout << "[InferenceQueue] Extracting model for cleanup: " << model_path << std::endl;
    
    // Extract the model from the map
    auto extracted = std::move(it->second);
    cached_models.erase(it);
    return extracted;
  }
  return nullptr;
}

void InferenceQueue::cleanup_inactive_models() {
  while (!done.load(std::memory_order_acquire)) {
    // Container for models to free outside the lock
    std::vector<std::shared_ptr<ModelResources>> models_to_free;
    
    // Wait for a cleanup notification or timeout
    {
      std::unique_lock<std::shared_mutex> lock(models_lock);
      
      // Wait for notification or timeout (configurable interval)
      cleanup_cond_var.wait_for(lock, std::chrono::seconds(CLEANUP_INTERVAL_SEC),
                               [this]{ return done.load(std::memory_order_acquire); });
      
      if (done.load(std::memory_order_acquire)) break;
      
      // Check each model's inactivity time
      auto now = std::chrono::steady_clock::now();
      std::vector<std::string> paths_to_check;
      
      for (const auto& pair : cached_models) {
        const std::string& path = pair.first;
        const auto& resources = pair.second;
        
        auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(
            now - resources->last_used).count();
        
        // Only consider freeing models that have been inactive AND are IDLE
        ModelState state = resources->state.load(std::memory_order_acquire);
        int users = resources->active_users.load(std::memory_order_acquire);
        
        if (elapsed >= MODEL_INACTIVITY_TIMEOUT_SEC && state == ModelState::IDLE && users == 0) {
          paths_to_check.push_back(path);
        } else if (elapsed >= MODEL_INACTIVITY_TIMEOUT_SEC) {
          std::cout << "[InferenceQueue] Model " << path 
                    << " inactive for " << elapsed << "s but has " 
                    << users << " active users, state: "
                    << (state == ModelState::ACTIVE ? "ACTIVE" : 
                        state == ModelState::IDLE ? "IDLE" : "BEING_DELETED")
                    << std::endl;
        }
      }
      
      // Extract models that can be freed
      for (const auto& path : paths_to_check) {
        auto extracted = extract_model_if_inactive(path);
        if (extracted) {
          models_to_free.push_back(std::move(extracted));
        }
      }
    } // Release lock before freeing resources
    
    // Free the extracted models outside the lock to prevent deadlock
    for (auto& resources : models_to_free) {
      std::cout << "[InferenceQueue] Freeing model resources for: " << resources->path << std::endl;
      if (resources->ctx) llama_free(resources->ctx);
      if (resources->model) llama_model_free(resources->model);
      // shared_ptr will handle deletion of ModelResources
    }
  }
}

void InferenceQueue::process_inference() {
  while (true) {

    std::unique_ptr<TaskWrapper> taskWrapperPtr;
    int current_request_id;

    { // Scope for the queue lock
      std::unique_lock<std::mutex> queueLock(queue_lock);
      cond_var.wait(queueLock, [this] { return !tasks.empty() || done.load(std::memory_order_acquire); });

      if (done.load(std::memory_order_acquire) && tasks.empty()) {
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
      std::lock_guard<std::mutex> cancelLock(queue_lock);
      auto it = cancel_flags.find(current_request_id);
      if (it != cancel_flags.end() && it->second) {
        // If the task is cancelled, do not execute it. Clean up cancellation
        // flag after checking.
        cancel_flags.erase(it);
        continue;
      }
    } // Release the lock

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
    
    // Clean up any cancel flag for this request
    {
      std::lock_guard<std::mutex> cancelLock(queue_lock);
      cancel_flags.erase(current_request_id);
    }
    
    // Note: We don't notify cleanup after every task anymore - it runs on its own schedule
    // This reduces unnecessary wakeups and improves performance
  }
}