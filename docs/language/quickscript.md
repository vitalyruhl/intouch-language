# InTouch QuickScript Scope

## Language identity

`.vbi` and `.vi` contain proprietary InTouch QuickScript. They are not Visual
Basic, VBA, VBScript, Pascal, PowerShell, or a compatible subset of any of
those languages. Tooling must not use a foreign parser or language server as a
semantic approximation.

## Current repository evidence

Language knowledge is divided by responsibility:

- `syntaxes/intouch.tmLanguage.json` provides lexical highlighting patterns,
  built-in functions, Hermes helpers, dot fields, and presentation scopes.
- `packages/core/src/languageData.ts` provides canonical lexical keywords,
  datatypes, operators, and punctuation.
- `packages/core/src/tokenizer.ts` and `parser.ts` provide canonical lexical
  and structural interpretation.
- `packages/core/src/generatedFunctionCatalog.ts` is generated from the
  TextMate grammar for completion and hover; it is not edited manually.
- `language-configuration.json` and `snippets/vbi.json` provide editor behavior
  and authoring templates.
- core tests and `src/test/suite/testfiles/` capture parser and formatter
  behavior, including incomplete input and real-world formatting cases.

Runtime vendor documentation remains authoritative when it conflicts with
repository evidence. Semantic uncertainty is an escalation point; do not guess
from a similar language.

The implemented statement, expression, terminator, and recovery contract is
defined in [QuickScript Grammar](quickscript-grammar.md). This scope document
describes ownership and architecture; it does not define a second grammar.

## Tooling boundary

Serena excludes QuickScript because it does not natively support this language.
ProjectAtlas may index `.vbi` and `.vi` as neutral text for repository
navigation and lexical search. The extension's native language server supplies
QuickScript symbols, document-local definitions/references, completion, hover,
formatting, and diagnostics.

## Implemented architecture

```text
packages/core -> packages/language-server -> src/extension.ts
```

`packages/core` owns the editor-independent tokenizer, recoverable parser,
formatter, and semantic model. `packages/language-server` exposes those
features through LSP without depending on the VS Code API. `src/extension.ts`
is a thin VS Code language client.

The tokenizer is the only lexical interpretation. The parser is the only block
and statement interpretation. Formatter and semantics reuse those models rather
than implementing independent string, comment, keyword, operator, whitespace,
or nesting recognition.

The formatter directly consumes core tokens and parser structure. The language
server exposes the same engine through LSP formatting, and the VS Code client
uses that standard request. TextMate grammar, snippets, and themes remain
secondary presentation assets rather than semantic parsers.

## Multiline brace-comment formatting

A normal multiline `{ ... }` comment is reindented as one text block. The
formatter calculates the opening line's original and structural target indent,
then applies that same delta to every physical line through the closing brace.
Relative indentation and comment text are otherwise preserved.

The configured `{>` / `{<}`, `{#`, `{region`, and `{endregion}` forms remain
formatter directives with their existing nesting behavior. They are not
reclassified as normal multiline comments.
