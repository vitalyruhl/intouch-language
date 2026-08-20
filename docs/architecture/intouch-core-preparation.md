# InTouch Core Preparation Audit

## Current extension shape

The repository is a single npm-managed VS Code extension. `package.json`
registers language ID `intouch` for `.vbi` and `.vi`, a TextMate grammar,
snippets, a formatter command, and the theme. `src/extension.ts` is the VS Code
activation boundary; compiled output is `out/` and the bundle is
`dist/extension.js`.

No `packages/`, tokenizer, parser, language server, LSP transport, semantic
definition/reference provider, or diagnostics provider exists yet.

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

## Language knowledge and duplication

Language vocabulary currently appears in the grammar and formatter constants;
block behavior appears in the formatter and language configuration. This is
useful evidence but not yet one canonical typed model. The first core milestone
should inventory these sets, write characterization tests for their intentional
overlap/divergence, and then extract a VS Code-independent language-data and
formatter surface.

## Diagnostics and semantic navigation

The README lists diagnostics such as unmatched `IF`/`ENDIF` and `FOR`/`NEXT` as
planned. No diagnostics implementation was found. A future tokenizer and
structure parser should first support formatter-safe token boundaries, block
matching, declarations, and scopes; only then should diagnostics, document
symbols, definitions, and references be implemented.

## Recommended next autonomous block

1. Create a read-only language-data inventory from grammar, formatter constants,
   nesting definitions, and fixtures.
2. Add characterization tests that protect existing formatter output and record
   intentional vocabulary differences.
3. Define a small VS Code-independent `intouch-core` API and extract only pure
   language data and formatting helpers behind it.
4. Do not create LSP transport or Serena QuickScript integration in that block.
