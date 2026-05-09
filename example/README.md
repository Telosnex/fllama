# fllama_example

Demonstrates how to use the fllama plugin.

## Getting Started

Run the web example with cross-origin isolation enabled so wllama can use
SharedArrayBuffer/pthreads:

```sh
flutter run -d chrome --cross-origin-isolation
```

For a release-style local run:

```sh
flutter build web
node web/server.js
```

Then open http://localhost:8080. The Node server adds the required
`Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp` headers.

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
