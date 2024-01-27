import 'dart:convert';

String convertToJsonGrammar(String jsonSchema) {
  final schema = json.decode(jsonSchema) as Map<String, dynamic>;
  final Map<String, String> rules = {'space': _spaceRule};

  String formatLiteral(dynamic literal) {
    String jsonLiteral = json.encode(literal);
    String escaped = _escapeGrammarLiteral(jsonLiteral);
    return '"$escaped"';
  }

  String addRule(String name, String rule) {
    final String escName = name.replaceAll(_invalidRuleCharsRe, '-');
    String key = escName;
    if (!rules.containsKey(escName) || rules[escName] == rule) {
      key = escName;
    } else {
      int i = 1;
      while (rules.containsKey('$escName$i')) {
        i++;
      }
      key = '$escName$i';
    }
    rules[key] = rule;
    return key;
  }

  String visit(Map<String, dynamic> schema, [String name = 'root']) {
    final schemaType = schema['type'];
    String ruleName = name;

    if (schema.containsKey("oneOf") || schema.containsKey("anyOf")) {
      final List<dynamic> mixedSchemas = schema["oneOf"] ?? schema["anyOf"];
      final rule = mixedSchemas
          .asMap()
          .entries
          .map((e) => visit(e.value, "$name-${e.key}"))
          .join(" | ");
      return addRule(ruleName, rule);
    } else if (schema.containsKey('const')) {
      return addRule(ruleName, formatLiteral(schema['const']));
    } else if (schema.containsKey('enum')) {
      String rule = (schema['enum'] as List).map(formatLiteral).join(' | ');
      return addRule(ruleName, rule);
    } else if (schemaType == 'object' && schema.containsKey('properties')) {
      String rule = '"{" space';
      var props = schema['properties'] as Map<String, dynamic>;
      int i = 0;
      props.forEach((propName, propSchema) {
        String propRuleName = visit(propSchema, '$name-${propName}');
        if (i++ > 0) {
          rule += ' "," space';
        }
        rule += ' ${formatLiteral(propName)} ":" space ${propRuleName}';
      });
      rule += ' "}" space';
      return addRule(ruleName, rule);
    } else if (schemaType == 'array' && schema.containsKey('items')) {
      String itemRuleName = visit(schema['items'], '$name-item');
      String rule =
          ' "[" space (${itemRuleName} ("," space $itemRuleName)*)? "]" space';
      return addRule(ruleName, rule);
    } else {
      assert(_primitiveRules.containsKey(schemaType),
          'Unrecognized schema: $schema');
      return addRule(ruleName == 'root' ? 'root' : schemaType,
          _primitiveRules[schemaType]!);
    }
  }

  visit(schema);
  return rules.entries
      .map((entry) => '${entry.key} ::= ${entry.value}')
      .join('\n');
}

const String _spaceRule = '" "?';

const Map<String, String> _primitiveRules = {
  'boolean': '("true" | "false") space',
  'number':
      '("-"? ([0-9] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)? space',
  'integer': '("-"? ([0-9] | [1-9] [0-9]*)) space',
  'string': r''' "\"" (
        [^"\\] |
        "\\" (["\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F])
      )* "\"" space ''',
  'null': '"null" space',
};

final RegExp _invalidRuleCharsRe = RegExp(r'[^a-zA-Z0-9-]+');
final RegExp _grammarLiteralEscapeRe = RegExp(r'[\r\n"]');

String _escapeGrammarLiteral(String input) {
  return input.replaceAllMapped(_grammarLiteralEscapeRe, (match) {
    switch (match[0]) {
      case '\r':
        return '\\r';
      case '\n':
        return '\\n';
      case '"':
        return '\\"';
      default:
        return match[0]!;
    }
  });
}


