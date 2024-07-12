class ToolFunction {
  final String name;
  final String description;
  final String parametersAsString;
  const ToolFunction({
    required this.description,
    required this.name,
    required this.parametersAsString,
  });
}

const exampleQaExtractFunction = ToolFunction(name: 'problems', description: '''
Problems, such as short answer problems or multiple choice questions, extracted from general text. Question, paired with any answer choices provided explicitly in the text.
''', parametersAsString: '''
{
 "type": "object",
 "properties": {
  "problems": {
   "type": "array",
   "items": {
    "type": "object",
    "properties": {
     "question": {
      "type": "string"
     },
     "choices": {
      "type": "string"
     }
    },
    "required": ["question", "choices"]
   }
  }
 },
 "required": ["problems"]
}''');

const exampleFlashcardFunction = ToolFunction(
  name: 'flashcards',
  description: '''
Flashcards are tools for studying that have one side that is a sort of 'query' 'question' or even just a vocabulary word. On the other side is the fact that needs to be remembered, be that a definition, answer, notes, etc. They are often used for studying, but more generally, to learn to recall information.

Use this function to provide flashcards extracted from the previous text. Phrase and frame all answers in terms of flashcards, if you can't do it, skip it.''',
  parametersAsString: '''
{
 "type": "object",
 "properties": {
  "flashcards": {
   "type": "array",
   "items": {
    "type": "object",
    "properties": {
     "query": {
      "type": "string"
     },
     "recall": {
      "type": "string"
     }
    },
    "required": ["recall", "query"]
   }
  }
 },
 "required": ["flashcards"]
}''',
);

const exampleSearchQueriesFunction = ToolFunction(
    name: 'search_queries',
    description: '''
Search queries are the queries that you would use to search for the previous text. They are often used for studying, but more generally, to learn to recall information.''',
    parametersAsString: '''
{
 "type": "object",
 "properties": {
  "search_query_0": {
   "type": "string",
   "description": "The 1st search query"
  },
  "search_query_1": {
   "type": "string",
   "description": "The 2nd search query"
  },
  "search_query_2": {
   "type": "string",
   "description": "The 3rd search query"
  }
 },
"required": ["search_query_0", "search_query_1", "search_query_2"] 
}''');

const exampleOneSearchQueryFunction = ToolFunction(
    name: 'search_query',
    description: '''
Search queries are the queries that you would use to search for the previous text. They are often used for studying, but more generally, to learn to recall information.''',
    parametersAsString: '''
{
 "type": "object",
 "properties": {
  "search_query": {
   "type": "string",
   "description": "A search query"
  }
 },
 "required": ["search_query"] 
}''');

const exampleSentimentListFunction = ToolFunction(
  name: 'sentiment_analysis',
  description:
      'Collection of objects, intent is to rate sentiment. Sentiment is a subjective rating of the mood of the individual message from 0 to 10. It is an integer. 0 is unhappiest, 10 is happiest. 5 is adds no information. Include explanation for rating and message / text chunk analyzed for sentiment.',
  parametersAsString: exampleSentimentListSchema,
);

const exampleSentimentListSchema = '''
{
 "type": "object",
 "properties": {
  "objects": {
   "type": "array",
   "items": {
    "type": "object",
    "properties": {
     "text": {
      "type": "string"
     },
     "reasoning": {
      "type": "string"
     },
     "sentiment": {
      "type": "integer"
     }
    },
    "required": [
     "sentiment",
     "reasoning",
     "text"
    ]
   }
  }
 },
 "required": ["objects"]
}''';
