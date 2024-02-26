import 'dart:convert';

import 'package:fllama/fllama.dart';
import 'package:fllama/misc/gbnf.dart';

class Tool {
  final String name;
  final String jsonSchema;
  final String description;

  Tool({required this.name, required this.jsonSchema, this.description = ''});

  /// Pass to either [OpenAiRequest] or [FllamaInferenceRequest].
  ///
  /// Adjusts probabilities of tokens such that only valid JSON matching the
  /// [jsonSchema] can be generated.
  String get grammar {
    return convertToJsonGrammar(jsonSchema);
  }

  String get typescriptDefinition {
    return formatFunctionDefinition({
      'name': name,
      'parameters': jsonDecode(jsonSchema),
      if (description.isNotEmpty) 'description': description,
    });
  }
}

/// Converts a JSON schema to a Typescript function definition.
///
/// Use to prompt the model, e.g. `Here is a Typescript function definition:`,
/// followed by the return value, followed by `Please provide a JSON object
/// to call the function with:`.
///
/// The [fllamaAsyncChatCompletion] function uses this to prompt the model for
/// JSON objects, given [Tool] objects on [OpenAiRequest.tools].
String formatFunctionDefinition(Map<String, dynamic> function) {
  // This matches OpenAI's formatting of functions, down to the token.
  //
  // It's undocumented, but can be pieced together by talking the model into
  // emitting its input when given functions. Unit tests in a private repo are
  // used to verify this.
  //
  // In the context of llama, an exact match down the token is not needed.
  // However, it is convenient to have the same formatting as OpenAI.
  final lines = <String>[];
  final description = function['description'];
  if (description != null && description is String && description.isNotEmpty) {
    lines.add('// $description ');
  }

  final parametersProperties = function['parameters']?['properties'];
  if (parametersProperties != null &&
      parametersProperties is Map<String, dynamic>) {
    lines.add('type ${function['name']} = (_: {');
    lines.add(_formatObjectProperties(function['parameters']!, 0));
    lines.add('}) => any;');
  } else {
    lines.add('type ${function['name']} = () => any;');
  }
  lines.add('');
  return lines.join('\n');
}

T? _extract<T>(Map<String, dynamic> source, String key) {
  final value = source[key];
  if (value is T) {
    return value;
  } else {
    return null;
  }
}

String _formatObjectProperties(Map<String, dynamic> parameters, int indent) {
  final lines = <String>[];
  final required = _extract<List>(parameters, 'required');
  final properties =
      _extract<Map<String, dynamic>>(parameters, 'properties') ?? {};
  for (final entry in properties.entries) {
    final name = entry.key;
    final param = entry.value;
    if (param is! Map<String, dynamic>) {
      throw Exception('Expected Map<String, dynamic> but got:\n\n$param');
    }
    final description = param['description'];
    if (description != null && indent < 2) {
      lines.add('// $description');
    }
    final isRequired = required != null && required.contains(name);
    final hasDefault = param.containsKey('default');
    lines.add(
        '$name${isRequired ? '' : '?'}: ${_formatType(param, indent)},${hasDefault ? ' // default: ${param['default']}' : ''}');
  }
  final indentString = ' ' * indent;
  final indented = lines.map((e) => '$indentString$e').join('\n');
  return indented;
}

String _formatType(Map<String, dynamic> param, int indent) {
  final type = param['type'];
  final isEnum = param.containsKey('enum');
  if (type == 'string') {
    if (isEnum) {
      final enumValues = param['enum'] as List;
      return enumValues.map((e) => '"$e"').join(' | ');
    } else {
      return 'string';
    }
  } else if (type == 'number') {
    if (isEnum) {
      final enumValues = param['enum'] as List<num>;
      return enumValues.join(' | ');
    } else {
      return 'number';
    }
  } else if (type == 'integer') {
    if (isEnum) {
      final enumValues = param['enum'] as List<int>;
      return enumValues.join(' | ');
    } else {
      return 'integer';
    }
  } else if (type == 'array') {
    final hasItems = param.containsKey('items');
    if (hasItems) {
      final items = param['items'] as Map<String, dynamic>;
      return '${_formatType(items, indent)}[]';
    } else {
      return 'any[]';
    }
  } else if (type == 'boolean') {
    return 'boolean';
  } else if (type == null) {
    return 'null';
  } else if (type == 'object') {
    return '{\n${_formatObjectProperties(param, indent + 2)}\n';
  } else {
    throw Exception('Unsupported type: $type');
  }
}
