import 'dart:convert';

import 'package:fllama/misc/gbnf.dart';
import 'package:test/test.dart';

void main() {
  test('json schema A', () async {
    final jsonString = jsonEncode({
      'title': 'four_follow_up_queries',
      'type': 'object',
      'required': [],
      'properties': {
        'follow_up_query_0': {
          'type': 'string',
          'description': 'The first follow up query.',
        },
        'follow_up_query_1': {
          'type': 'string',
          'description': 'The second follow up query.',
        },
        'follow_up_query_2': {
          'type': 'string',
          'description': 'The third follow up query.',
        },
        'follow_up_query_3': {
          'type': 'string',
          'description': 'The fourth follow up query.',
        },
      },
    });
    final grammar = convertToJsonGrammar(jsonString);
    // To prevent wasting time figuring out to format the output of
    // `print(grammar)`, do print(json.encode({'grammar': grammar})), take it
    // over to https://jsonformatter.org/, then bring it back here.
    final expectedAsObject = {
      "grammar":
          "space ::= \" \"?\nstring ::=  \"\\\"\" (\n        [^\"\\\\] |\n        \"\\\\\" ([\"\\\\/bfnrt] | \"u\" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F])\n      )* \"\\\"\" space \nroot ::= \"{\" space \"\\\"follow_up_query_0\\\"\" \":\" space string \",\" space \"\\\"follow_up_query_1\\\"\" \":\" space string \",\" space \"\\\"follow_up_query_2\\\"\" \":\" space string \",\" space \"\\\"follow_up_query_3\\\"\" \":\" space string \"}\" space"
    };
    expect(grammar, isNotEmpty);
    expect(grammar, equals(expectedAsObject['grammar']));
  });
}
