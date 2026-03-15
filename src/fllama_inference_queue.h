// fllama_inference_queue.h — manages server_context instances and cancellation
#ifndef FLLAMA_INFERENCE_QUEUE_H
#define FLLAMA_INFERENCE_QUEUE_H

#include <atomic>
#include <chrono>
#include <condition_variable>
#include <memory>
#include <mutex>
#include <shared_mutex>
#include <string>
#include <thread>
#include <unordered_map>
#include <unordered_set>

#include "fllama.h"

// Forward declarations.
struct server_context;
struct common_params;

// ---------------------------------------------------------------------------
// ServerResources — holds a server_context and its dedicated loop thread.
// ---------------------------------------------------------------------------
struct ServerResources {
  std::unique_ptr<server_context> srv_ctx;
  std::thread loop_thread;
  std::string model_path;
  std::chrono::steady_clock::time_point last_used;
  std::atomic<int> active_users{0};
  std::atomic<bool> shutting_down{false};

  // Params that require a fresh server_context if changed.
  int n_ctx         = 0;
  int n_gpu_layers  = -1;
  std::string mmproj_path;

  ServerResources() = default;
  ~ServerResources(); // terminates loop, joins thread

  ServerResources(const ServerResources &) = delete;
  ServerResources &operator=(const ServerResources &) = delete;
};

// ---------------------------------------------------------------------------
// ServerManager — owns cached server_contexts, tracks cancellation.
//   No worker thread — callers run their own reader threads.
// ---------------------------------------------------------------------------
class ServerManager {
public:
  static constexpr int DEFAULT_N_PARALLEL = 4;
  static int MODEL_INACTIVITY_TIMEOUT_SEC;
  static int CLEANUP_INTERVAL_SEC;

  ServerManager();
  ~ServerManager();

  // Get or create a server_context for a model.  Increments active_users.
  // Returns nullptr on failure.  Thread-safe.
  ServerResources *get_or_create(const std::string &model_path,
                                 const common_params &params,
                                 fllama_log_callback logger);

  // Decrement active_users (call when your request finishes).
  void release(const std::string &model_path);

  // Cancellation.
  void cancel(int request_id);
  bool is_cancelled(int request_id);
  void clear_cancel(int request_id);

  // Track a live request thread so we can join on shutdown.
  void register_request_thread(int request_id, std::thread &&t);
  void unregister_request_thread(int request_id);

private:
  void cleanup_loop();

  mutable std::shared_mutex servers_lock;
  std::unordered_map<std::string, std::unique_ptr<ServerResources>> servers;

  std::mutex cancel_lock;
  std::unordered_set<int> cancelled;

  std::mutex threads_lock;
  std::unordered_map<int, std::thread> request_threads;
  // Threads that finished but need joining.
  std::vector<std::thread> finished_threads;

  std::thread cleanup_thread;
  std::condition_variable_any cleanup_cond;
  std::atomic<bool> done{false};
};

#endif // FLLAMA_INFERENCE_QUEUE_H
