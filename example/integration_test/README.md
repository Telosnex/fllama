# FLLAMA Integration Tests

Integration tests for the FLLAMA Flutter plugin that test local LLM inference capabilities.

## Overview

These tests verify that FLLAMA can:
- Load and run GGUF models
- Handle chat conversations
- Support tool/function calling
- Generate responses with appropriate formatting

## Running the Tests

### Prerequisites

1. Install Flutter dependencies:
```bash
flutter pub get
```

2. The tests will automatically download required models to `.model_cache/` directory.
   Models are cached between runs to avoid re-downloading.

### Run Tests

```bash
# Run all integration tests
flutter test integration_test/

# Run specific test file
flutter test integration_test/local_llm_integration_test.dart

# With custom model cache directory
MODEL_CACHE_DIR=/path/to/cache flutter test integration_test/
```

## Test Models

The tests use the following models by default:
- **Phi-4 mini** (2.5GB) - Microsoft's efficient instruction model
- **Gemma 2 2B** (1.7GB) - Google's small but capable model  
- **SmolLM 3** (1.9GB) - Small language model
- **Llama 3.2 1B** (1.3GB) - Meta's compact instruction model

Models are automatically downloaded from HuggingFace on first run.

## Platform Support

Tests are currently supported on:
- ✅ macOS
- ✅ Linux (limited - only runs basic tests due to CI performance)
- ❌ Windows (disabled due to CI limitations)
- ❌ iOS/Android (disabled - requires proper app context)
- ❌ Web (uses different inference engine)

## Test Structure

```
integration_test/
├── local_llm_integration_test.dart  # Main test file
└── test/
    ├── initialize.dart              # Test initialization helpers
    ├── test_helpers.dart            # Common test utilities
    └── test_model_manager.dart      # Model download/cache management
```

## Customization

### Using Different Models

Edit `integration_test/test/test_model_manager.dart` to add new models:

```dart
TestModel.myModel: ModelMetadata(
  sizeBytes: 1024 * 1024 * 1000, // Size in bytes
  repoId: 'username/repo',        // HuggingFace repo
  filename: 'model.gguf',          // GGUF filename
),
```
