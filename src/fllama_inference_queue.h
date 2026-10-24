// fllama_inference_queue.h — manages server_context instances and cancellation
#ifndef FLLAMA_INFERENCE_QUEUE_H
#define FLLAMA_INFERENCE_QUEUE_H

#include <atomic>
#include <functional>
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
#include <vector>

// Forward declarations.
struct ggml_backend_device;
struct server_context;
struct server_context_meta;
struct common_params;

// ---------------------------------------------------------------------------
// ServerResources — holds a server_context and its dedicated loop thread.
// ---------------------------------------------------------------------------
struct ServerResources {
  std::unique_ptr<server_context> srv_ctx;
  // Read before the loop thread starts; constant after. llama-server's HTTP
  // threads share one such copy in the same way.
  std::unique_ptr<server_context_meta> meta;
  std::thread loop_thread;
  std::string model_path;
  std::chrono::steady_clock::time_point last_used;
  std::atomic<int> active_users{0};
  std::atomic<bool> shutting_down{false};
  // A request wants other load-time params. No new request gets this context;
  // it is replaced once its requests finish.
  std::atomic<bool> retiring{false};
  // Requests that wait for this context to retire. Guarded by
  // ServerManager::servers_lock. When the last one is cancelled, the context
  // stops retiring.
  int retire_waiters = 0;

  // Params that require a fresh server_context if changed.
  int n_ctx         = 0;
  int n_gpu_layers  = -1;
  int n_threads       = 0;
  int n_threads_batch = 0;
  std::string mmproj_path;
  std::string draft_path; // MTP/speculative drafter model path ("" if none)
  int draft_n_max = 0;    // MTP/speculative max draft tokens; load-time param
  float draft_p_min = -1; // MTP/speculative min draft confidence; load-time param
  std::vector<ggml_backend_device *> devices; // GPU selection; empty is Auto

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
  // If the model is loaded with other load-time params (such as n_ctx), or
  // its context is unhealthy, and a request uses it, waits for that request
  // to finish, then reloads: the request gets the params it asked for. Loads
  // a model at most once per call. Returns nullptr on failure, or if
  // should_stop() returns true while waiting.  Thread-safe.
  ServerResources *get_or_create(const std::string &model_path,
                                 const common_params &params,
                                 fllama_log_callback logger,
                                 const std::function<bool()> &should_stop = {});

  // Decrement active_users (call when your request finishes).
  void release(const std::string &model_path);

  // Mark a context as unsafe to reuse.  The active request still owns it until
  // release(); once active_users reaches zero the context is destroyed so the
  // next request recreates the backend from scratch.
  void mark_unhealthy(const std::string &model_path);

  // Unloads every cached model if no request uses one. Returns false and
  // unloads nothing if a request runs (ADR 004, I9). Thread-safe.
  bool evict_all_idle();

  // Cancellation.
  void cancel(int request_id);
  bool is_cancelled(int request_id);
  void clear_cancel(int request_id);

  // Starts [body] on a new request thread, tracked so that shutdown joins
  // it. The thread is listed before [body] runs, so its
  // unregister_request_thread() always finds it.
  void start_request_thread(std::function<void()> body);
  // Call on a request thread, before it ends.
  void unregister_request_thread();

private:
  void cleanup_loop();

  mutable std::shared_mutex servers_lock;
  // Notified when a context loses its last user or is removed.
  std::condition_variable_any servers_idle;
  std::unordered_map<std::string, std::unique_ptr<ServerResources>> servers;

  std::mutex cancel_lock;
  std::unordered_set<int> cancelled;

  // Serialises all load_model() calls — ggml Metal init has global state
  // that is not safe for concurrent model loads.
  std::mutex model_load_mutex;

  std::mutex threads_lock;
  // By thread ID: two requests can have the same request ID, for example
  // after a Dart hot restart.
  std::unordered_map<std::thread::id, std::thread> request_threads;
  // Threads that finished but need joining.
  std::vector<std::thread> finished_threads;

  std::thread cleanup_thread;
  std::condition_variable_any cleanup_cond;
  std::atomic<bool> done{false};
};

#endif // FLLAMA_INFERENCE_QUEUE_H
