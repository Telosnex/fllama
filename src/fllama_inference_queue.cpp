#include "fllama_inference_queue.h"
#include "fllama_backends.h"
#include "server-context.h"

#include "llama.cpp/common/common.h"

#include <chrono>
#include <iostream>

int ServerManager::MODEL_INACTIVITY_TIMEOUT_SEC = 120;
int ServerManager::CLEANUP_INTERVAL_SEC = 30;

// ---------------------------------------------------------------------------
// ServerResources
// ---------------------------------------------------------------------------
ServerResources::~ServerResources() {
  shutting_down.store(true);
  if (srv_ctx) srv_ctx->terminate();
  if (loop_thread.joinable()) loop_thread.join();
}

// ---------------------------------------------------------------------------
// ServerManager
// ---------------------------------------------------------------------------
ServerManager::ServerManager() {
  cleanup_thread = std::thread(&ServerManager::cleanup_loop, this);
}

ServerManager::~ServerManager() {
  done.store(true, std::memory_order_release);
  cleanup_cond.notify_all();
  if (cleanup_thread.joinable()) cleanup_thread.join();

  // Join any remaining request threads.
  {
    std::lock_guard<std::mutex> lk(threads_lock);
    for (auto &[id, t] : request_threads)
      if (t.joinable()) t.join();
    request_threads.clear();
    for (auto &t : finished_threads)
      if (t.joinable()) t.join();
    finished_threads.clear();
  }

  // Destroy servers (destructors terminate + join loop threads).
  {
    std::unique_lock<std::shared_mutex> lk(servers_lock);
    servers.clear();
  }
}

// ---------------------------------------------------------------------------
static bool params_match(const ServerResources &r,
                         const common_params &params) {
  return r.n_ctx        == params.n_ctx &&
         r.n_gpu_layers == params.n_gpu_layers &&
         r.mmproj_path  == params.mmproj.path &&
         r.draft_path   == params.speculative.draft.mparams.path &&
         r.draft_n_max  == params.speculative.draft.n_max &&
         r.draft_p_min  == params.speculative.draft.p_min &&
         r.devices      == params.devices;
}

// A context that a new request may use.
static bool reusable(const ServerResources &r, const common_params &params) {
  return !r.shutting_down.load() && !r.retiring.load() &&
         params_match(r, params);
}

ServerResources *
ServerManager::get_or_create(const std::string &model_path,
                             const common_params &params,
                             fllama_log_callback logger,
                             const std::function<bool()> &should_stop) {
  // Every load and every insert into [servers] holds model_load_mutex. So a
  // request that holds it and finds no context can load one: no other
  // request can insert one meanwhile.
  while (true) {
    // 1. Use a matching context, wait for a busy one, or remove an idle one.
    std::unique_ptr<ServerResources> old;
    {
      std::unique_lock<std::shared_mutex> lk(servers_lock);
      auto it = servers.find(model_path);
      if (it != servers.end()) {
        if (reusable(*it->second, params)) {
          auto *r = it->second.get();
          r->last_used = std::chrono::steady_clock::now();
          r->active_users.fetch_add(1);
          return r;
        }
        if (it->second->active_users.load() > 0) {
          // Other params, such as a new context size, or an unhealthy
          // context (Metal can leave a backend poisoned after a command
          // buffer OOM; llama.cpp needs a new backend to recover). Wait for
          // its requests to finish. A retiring context gets no new request,
          // so requests that come meanwhile cannot keep it busy.
          if (!it->second->shutting_down.load()) {
            it->second->retiring.store(true);
          }
          std::cout << "[ServerManager] Waiting for running requests before "
                       "reloading: " << model_path << "\n";
          while (true) {
            if (should_stop && should_stop()) return nullptr;
            if (done.load()) return nullptr;
            auto cur = servers.find(model_path);
            if (cur == servers.end() ||
                cur->second->active_users.load() == 0) {
              break;
            }
            // Timed, so should_stop() is checked while a request runs.
            servers_idle.wait_for(lk, std::chrono::milliseconds(100));
          }
          continue; // The context may be gone, idle, or a match.
        }
        std::cout << "[ServerManager] "
                  << (it->second->shutting_down.load()
                          ? "Discarding unhealthy context: "
                          : "Params changed, recreating: ")
                  << model_path << "\n";
        // Move out, so the destructor runs outside the lock.
        old = std::move(it->second);
        servers.erase(it);
      }
    }
    old.reset(); // terminate + join

    // 2. Load. ggml Metal initialisation uses global state that is not safe
    // for concurrent model loads (the crash that overwrites the return
    // address with ASCII " using d" from a Metal log).
    std::unique_lock<std::mutex> load_lk(model_load_mutex);
    // llama.cpp reads the ggml backend list during the load. A GPU pack load
    // must not change it then (ADR 004, I9). Held until the server is
    // listed, so evict_all_idle() sees it.
    auto registry_lk = fllama_backends_registry_read_lock();
    {
      std::shared_lock<std::shared_mutex> lk(servers_lock);
      if (servers.count(model_path)) {
        // Another request loaded this model while this one waited. Use it,
        // or wait for it, from the top.
        continue;
      }
    }

    auto res = std::make_unique<ServerResources>();
    res->model_path = model_path;
    res->srv_ctx = std::make_unique<server_context>();

    auto load_params = params;
    if (!res->srv_ctx->load_model(load_params)) {
      std::cerr << "[ServerManager] load_model failed: " << model_path
                << "\n";
      return nullptr;
    }

    res->meta = std::make_unique<server_context_meta>(res->srv_ctx->get_meta());
    auto *ctx_ptr = res->srv_ctx.get();
    res->loop_thread = std::thread([ctx_ptr] { ctx_ptr->start_loop(); });
    res->n_ctx        = params.n_ctx;
    res->n_gpu_layers = params.n_gpu_layers;
    res->mmproj_path  = params.mmproj.path;
    res->draft_path   = params.speculative.draft.mparams.path;
    res->draft_n_max  = params.speculative.draft.n_max;
    res->draft_p_min  = params.speculative.draft.p_min;
    res->devices      = params.devices;
    res->last_used    = std::chrono::steady_clock::now();
    res->active_users.store(1);

    std::unique_lock<std::shared_mutex> lk(servers_lock);
    auto *r = res.get();
    servers.emplace(model_path, std::move(res));
    std::cout << "[ServerManager] Created server_context: " << model_path
              << "\n";
    return r;
  }
}

void ServerManager::release(const std::string &model_path) {
  std::unique_ptr<ServerResources> to_free;
  {
    std::unique_lock<std::shared_mutex> lk(servers_lock);
    auto it = servers.find(model_path);
    if (it == servers.end()) {
      return;
    }

    const int previous_users = it->second->active_users.fetch_sub(1);
    if (previous_users <= 0) {
      it->second->active_users.store(0);
      return;
    }
    if (previous_users == 1) servers_idle.notify_all();

    it->second->last_used = std::chrono::steady_clock::now();
    if (previous_users == 1 && it->second->shutting_down.load()) {
      std::cout << "[ServerManager] Destroying unhealthy context: "
                << model_path << "\n";
      to_free = std::move(it->second);
      servers.erase(it);
    }
  }
  // Destructor runs outside the lock.
}

void ServerManager::mark_unhealthy(const std::string &model_path) {
  std::unique_ptr<ServerResources> to_free;
  {
    std::unique_lock<std::shared_mutex> lk(servers_lock);
    auto it = servers.find(model_path);
    if (it == servers.end()) {
      return;
    }

    it->second->shutting_down.store(true);
    it->second->last_used = std::chrono::steady_clock::now();
    if (it->second->active_users.load() == 0) {
      std::cout << "[ServerManager] Destroying unhealthy idle context: "
                << model_path << "\n";
      to_free = std::move(it->second);
      servers.erase(it);
    }
  }
  // Destructor runs outside the lock.
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------
bool ServerManager::evict_all_idle() {
  std::vector<std::unique_ptr<ServerResources>> old;
  {
    std::unique_lock<std::shared_mutex> lk(servers_lock);
    for (const auto &entry : servers) {
      if (entry.second->active_users.load() > 0) {
        return false;
      }
    }
    for (auto &entry : servers) {
      old.push_back(std::move(entry.second));
    }
    servers.clear();
  }
  if (!old.empty()) {
    std::cout << "[ServerManager] Unloaded " << old.size()
              << " idle model(s) to change backends\n";
  }
  old.clear(); // terminate + join, outside the lock
  return true;
}

void ServerManager::cancel(int rid) {
  std::lock_guard<std::mutex> lk(cancel_lock);
  cancelled.insert(rid);
}

bool ServerManager::is_cancelled(int rid) {
  std::lock_guard<std::mutex> lk(cancel_lock);
  return cancelled.count(rid);
}

void ServerManager::clear_cancel(int rid) {
  std::lock_guard<std::mutex> lk(cancel_lock);
  cancelled.erase(rid);
}

// ---------------------------------------------------------------------------
// Request thread tracking
// ---------------------------------------------------------------------------
void ServerManager::start_request_thread(int rid,
                                         std::function<void()> body) {
  std::lock_guard<std::mutex> lk(threads_lock);
  // Join any previously finished threads first.
  for (auto &ft : finished_threads)
    if (ft.joinable()) ft.join();
  finished_threads.clear();
  // The thread's unregister_request_thread() waits for threads_lock, so it
  // runs after the emplace.
  request_threads.emplace(rid, std::thread(std::move(body)));
}

void ServerManager::unregister_request_thread(int rid) {
  std::lock_guard<std::mutex> lk(threads_lock);
  auto it = request_threads.find(rid);
  if (it != request_threads.end()) {
    // Can't join here (we're ON that thread). Move to finished list.
    finished_threads.push_back(std::move(it->second));
    request_threads.erase(it);
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
void ServerManager::cleanup_loop() {
  while (!done.load(std::memory_order_acquire)) {
    std::vector<std::unique_ptr<ServerResources>> to_free;
    {
      std::unique_lock<std::shared_mutex> lk(servers_lock);
      cleanup_cond.wait_for(lk,
                            std::chrono::seconds(CLEANUP_INTERVAL_SEC),
                            [this] { return done.load(); });
      if (done.load()) break;

      auto now = std::chrono::steady_clock::now();
      std::vector<std::string> expired;
      for (auto &[path, r] : servers) {
        auto sec = std::chrono::duration_cast<std::chrono::seconds>(
                       now - r->last_used).count();
        if ((r->shutting_down.load() ||
             sec >= MODEL_INACTIVITY_TIMEOUT_SEC) &&
            r->active_users.load() == 0) {
          expired.push_back(path);
        }
      }
      for (auto &p : expired) {
        std::cout << "[ServerManager] Evicting: " << p << "\n";
        to_free.push_back(std::move(servers[p]));
        servers.erase(p);
      }
    }
    // Destructors run outside the lock.
  }
}
