// InferenceQueue.h
#ifndef FLLAMA_INFERENCE_QUEUE_H
#define FLLAMA_INFERENCE_QUEUE_H

#include <condition_variable>
#include <functional>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <exception>
#include "fllama.h"

class InferenceQueue {
public:
    InferenceQueue();
    ~InferenceQueue();

    // Enqueue a new inference request
    void enqueue(fllama_inference_request request, 
                 fllama_inference_callback callback);

private:
    std::thread worker; // Worker thread to process tasks
    std::mutex mutex; // Mutex for thread safety
    std::condition_variable cond_var; // Condition variable for task signaling
    std::queue<std::function<void()>> tasks; // Queue of tasks
    bool done; // Flag to control the lifecycle of the worker thread

    // Private method to be run by the worker thread
    void process_inference();
};

#endif // FLLAMA_INFERENCE_QUEUE_H