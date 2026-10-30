# ADR 002: Web Image Support Uses Existing Image-Tag Messages

## Status

Accepted.

## Date

2026-05-20

## Context

Native fllama already supports multimodal image input by passing image data as data-URI `<img>` tags inside `Message.text`, with `OpenAiRequest.mmprojPath` set. Telosnex also emits images in this format.

Upstream wllama v3 expects structured multimodal content parts instead:

```js
{ type: 'image', data: ArrayBuffer }
{ type: 'text', text: '...' }
```

Adding a new Dart multimodal API now would risk churn while Telosnex and native already have a working convention.

## Decision

Keep the existing public Dart message shape for now:

```dart
Message(Role.user, '<img src="data:image/jpeg;base64,...">\n\nWhat is this?')
```

On web, `fllama_web_init.js` parses matching data-URI image tags from string message content and converts them to wllama v3 content parts before calling `createChatCompletion`.

Native continues to receive the original string form.

## Consequences

- Web and native accept the same fllama/Telosnex message format.
- Multiple image tags in one message are supported by the web bridge.
- No public Dart API migration is required yet.
- Audio content parts are intentionally out of scope for now.
- A typed Dart multimodal API can still be added later and mapped to the same native/web backends.
