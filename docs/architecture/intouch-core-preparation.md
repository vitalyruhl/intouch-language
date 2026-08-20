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
while tokens preserve the original source text.

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
- Double-quoted strings, brace comments, apostrophe line comments, established
  identifier forms, and decimal numbers are based on repository grammar,
  formatter, and fixture evidence.
- Unclosed strings/comments and unknown characters remain tokenizable; parser
  diagnostics are intentionally deferred.

## Formatter coupling

`src/formatCore.ts` still owns keyword uppercasing, operator/whitespace
normalization, comment/string preservation, and nesting indentation. The new
tokenizer models some of the same lexical boundaries, but the production
formatter does not consume it yet. Replacing the formatter's ordered mutation
pipeline now would combine lexical extraction with a behavior-sensitive
rewrite.

A later formatter migration can reuse core tokens after it has targeted
equivalence tests for text reconstruction and formatting edits. Existing
characterization tests and golden fixtures remain the compatibility gate.

## Diagnostics and semantic navigation

The README lists diagnostics such as unmatched `IF`/`ENDIF` and `FOR`/`NEXT` as
planned. No diagnostics implementation was found. A future tokenizer and
structure parser should first support formatter-safe token boundaries, block
matching, declarations, and scopes; only then should diagnostics, document
symbols, definitions, and references be implemented.

## Recommended next autonomous block

1. Add a QuickScript structure parser over core tokens for `DIM`,
   `IF`/`ELSE`/`ENDIF`, `FOR`/`NEXT`, and `CALL`.
2. Model local scopes without introducing editor or transport dependencies.
3. Add the first parser-based diagnostics only after recovery behavior is
   tested for incomplete source.
4. Continue to defer language-server transport, definitions, references,
   completion, and hover until the parser contract is stable.
