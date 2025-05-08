
class LLMException implements Exception {
  final String message;
  final int statusCode;

  LLMException(this.message, this.statusCode);

  @override
  String toString() {
    return 'LLMException: $message (Status code: $statusCode)';
  }
}
