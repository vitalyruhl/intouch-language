# InTouch Core Foundation

## Current extension shape

The repository remains an npm-managed VS Code extension. `package.json`
registers language ID `intouch` for `.vbi` and `.vi`, a TextMate grammar,
snippets, a formatter command, and the theme. `src/extension.ts` remains the VS
Code activation boundary; its compiled output is `out/` and its published
bundle is `dist/extension.js`.

`packages/core` now provides editor-independent source positions, token types,
lexical language data, and a deterministic QuickScript tokenizer. It compiles
strictly to the ignored `out/core` directory, is tested through
`npm run test:core`, and is excluded from the VSIX until an extension runtime
consumer is introduced.

No parser, language server, LSP transport, semantic definition/reference
provider, or diagnostics provider exists yet.

The target dependency direction is:

```text
QuickScript source
        |
        v
packages/core tokenizer and structure model
        |----------------------|
        v                      v
QuickScript formatter     language server
        |
        v
VS Code formatter adapter
```

The formatter and language server are independent core consumers. The language
server is not an intermediary for formatting, and VS Code remains a client
adapter rather than a language-semantics layer.

## Migration inventory

| Current source | Current responsibility | Future target module | Dependencies | Risk |
| --- | --- | --- | --- | --- |
| `src/extension.ts` | Activates VS Code command and formatting provider | `packages/vscode-extension` | VS Code API, formatter adapter | Keep VS Code effects at this boundary. |
| `src/functions.ts` | Reads editor configuration, creates `TextEdit`s, invokes formatting | `packages/vscode-extension` plus thin adapter | VS Code API and formatter pipeline | Separate editor I/O from pure formatting without changing output. |
| `src/formatCore.ts` | Whitespace, keyword, string/comment preservation, and indentation pipeline | `packages/core/formatter` | `const.ts`, `nestingdef.ts`, formatter tests | Regex ordering and fixture compatibility are behavior-sensitive. |
| `src/const.ts` | Formatter keywords and operators | `packages/core/language-data` | Formatter pipeline | Grammar has overlapping but not identical vocabulary. |
| `src/nestingdef.ts` | Nesting/exclusion definitions | `packages/core/syntax` | Formatter pipeline | Existing blocks must be characterized by tests before extraction. |
| `syntaxes/intouch.tmLanguage.json` | TextMate lexical highlighting, functions, data types, and scopes | Retain in `packages/vscode-extension` initially; later generate/shared language data only after validation | VS Code TextMate grammar | Highlighting patterns are not a parser specification. |
| `language-configuration.json`, `snippets/vbi.json` | Editor rules and authoring snippets | `packages/vscode-extension` | VS Code contribution model | Keep declarative assets out of core. |
| `src/test/suite/*.test.ts` and `testfiles/` | Extension-host tests and formatter golden fixtures | Core formatter test suite plus extension integration tests | Mocha, VS Code test host | Fixtures should stay byte-for-byte stable unless behavior intentionally changes. |
| `packages/core/src/source.ts` | Zero-based UTF-16 positions and half-open offset/position ranges | Established core source model | TypeScript only | Keep position semantics aligned with the later LSP boundary. |
| `packages/core/src/token.ts` | Editor-independent token contract | Established core token model | Core source model | Preserve source lexemes and locations; diagnostics do not belong in tokens. |
| `packages/core/src/tokenizer.ts` | QuickScript lexical scanning | Established core tokenizer | Core language data and token model | Stay resilient to incomplete input without guessing parser semantics. |

## Language knowledge and duplication

The core now owns the typed lexical sets needed by the tokenizer: control
keywords, data types, operators, and punctuation. Matching is case-insensitive
while tokens preserve the original source text. The tokenizer is the canonical
lexical interpretation that the future parser, formatter, diagnostics, and
language server must consume; those components must not add parallel lexers.

The formatter constants and TextMate grammar remain compatibility sources for
their existing consumers. The grammar's large InTouch and Hermes function
inventories intentionally remain there; the tokenizer represents function
names as identifiers followed by punctuation rather than copying a partial
function list into core. Block and indentation data also remain in the
formatter until a structure parser can replace that responsibility safely.

These remaining overlaps are deliberate migration boundaries, not a third
canonical language model.

## Source and token semantics

- Offsets, lines, and characters are zero-based UTF-16 units.
- Source spans and position ranges are half-open: start is inclusive and end is
  exclusive.
- CRLF, LF, and CR are recognized as line boundaries.
- Tokens retain their original lexeme, offset span, and position range.
- The tokenizer emits identifiers, keywords, data types, numbers, strings,
  operators, punctuation, comments, whitespace, newlines, unknown input, and a
  zero-width EOF token.
- Concatenating every non-EOF lexeme reconstructs the original source exactly;
  fixture invariants enforce this for both `.vbi` and `.vi` input.
- Double-quoted strings, brace comments, apostrophe line comments, established
  identifier forms, and decimal numbers are based on repository grammar,
  formatter, and fixture evidence.
- Block metadata such as `{>`, `{<`, `{#`, `{region`, and `{endregion` remains
  losslessly available in comment lexemes for later formatting decisions.
- Unclosed strings/comments and unknown characters remain tokenizable; parser
  diagnostics are intentionally deferred.

## Formatter coupling

`src/formatCore.ts` is a legacy implementation, not the future formatting
contract. Its ordered mutations currently mix lexical protection, structural
heuristics, and output decisions. The production formatter does not consume
core tokens yet because replacing all three responsibilities in the tokenizer
milestone would be a behavior-sensitive rewrite.

| Current component | Current responsibility | Responsibility type | Future target |
| --- | --- | --- | --- |
| `preFormat` orchestration | Applies ordered keyword, operator, punctuation, and whitespace mutations | Mixed lexical and output | Token-aware QuickScript formatter engine consuming core tokens |
| String and comment protection in `preFormat` | Prevents regex formatting inside quoted or commented text | Lexical | Core `String` and `Comment` tokens with original ranges |
| Keyword and operator recognition in `preFormat` | Finds case-insensitive words and longest operators | Lexical | Core token kinds and language data |
| Whitespace normalization | Adjusts spaces, tabs, semicolons, and trailing whitespace | Output | Formatter rules over lossless whitespace/newline tokens |
| `formatNestings` | Infers indentation from lines, keywords, and configured comment markers | Structural and output | Structure-parser blocks plus formatter indentation rules |
| Block keyword recognition | Detects `IF`/`ELSE`/`ENDIF`, `FOR`/`NEXT`, `WHILE`, and comment blocks | Structural | Shared core structure model derived from tokens |
| Output generation | Rebuilds a formatted source string for the VS Code edit | Output | Editor-independent `formatQuickScript(source, options)` result |
| `src/functions.ts` formatting entry | Reads VS Code settings and creates `TextEdit` values | Editor adapter | Thin VS Code adapter over the shared formatter engine |

Migration is planned in two controlled stages:

1. Lexical formatter integration: use core string, comment, keyword, operator,
   punctuation, whitespace, newline, and source-range information so
   `preFormat` no longer performs a second lexical analysis.
2. Structural formatter integration: after the structure parser is stable,
   drive nesting and indentation from shared `DIM`, `IF`/`ELSE`/`ENDIF`,
   `FOR`/`NEXT`, `WHILE`, `CALL`, block, and scope information.

Existing characterization tests and golden fixtures protect already-correct
behavior; they do not declare every historical formatter result optimal. Later
improvements may replace poor legacy output when their intended behavior is
covered by focused tests.

## Diagnostics and semantic navigation

The README lists diagnostics such as unmatched `IF`/`ENDIF` and `FOR`/`NEXT` as
planned. No diagnostics implementation was found. A future tokenizer and
structure parser should first support formatter-safe token boundaries, block
matching, declarations, and scopes; only then should diagnostics, document
symbols, definitions, and references be implemented.

## Recommended next autonomous block

The next block is **Core Integration + Structure Parser + Formatter Refactor**,
split into safe internal phases when needed:

1. Prepare tokenizer integration in the formatter and remove duplicated
   lexical protection from `preFormat` behind focused equivalence tests.
2. Add a formatting-capable QuickScript structure parser over core tokens for
   `DIM`, `IF`/`ELSE`/`ENDIF`, `FOR`/`NEXT`, `WHILE`, and `CALL`.
3. Establish shared block, statement, nesting, and local-scope information.
4. Move formatter nesting and indentation incrementally onto that structure.
5. Add focused expectations for known weak formatter cases instead of
   preserving them as accidental contracts.
6. Only then extend symbols and parser-based diagnostics; continue to defer
   LSP transport, definitions, references, completion, and hover until the
   shared parser and formatter contracts are stable.
