# InTouch Language Architecture

## Dependency direction

```text
QuickScript source
        |
        v
packages/core
  tokenizer -> parser -> symbols/diagnostics/language features
        |          |
        |          +-> structural formatter
        |                  |
        v                  v
packages/language-server (LSP transport and protocol conversion)
        |
        v
src/extension.ts (thin VS Code language client)
```

`packages/core` is editor-independent. The formatter directly consumes core
tokens and parser structure; it does not depend on LSP types or transport.
`packages/language-server` converts core results into LSP responses. The VS
Code extension starts that server, synchronizes `intouch` documents and `VBI`
settings, and retains the existing grammar, snippets, theme, and formatter
command contributions.

## Canonical language layers

The tokenizer is the only lexical interpretation used by the parser,
formatter, and semantic services. Tokens retain their original lexemes and
zero-based UTF-16, half-open offset and position ranges. Strings, brace
comments, apostrophe comments, incomplete input, dashed identifiers, and
QuickScript operators therefore pass through one shared scanner.

The recoverable parser is the only structural interpretation. It represents
`DIM`, `CALL`, `IF`/`ELSE`/`ENDIF`, `FOR`/`NEXT`, and the repository-evidenced
`WHILE`/`NEXT` form. Blocks expose opener, body, middle, closer, parent, child,
and full ranges. Invalid nesting and missing closers produce diagnostics
without preventing later lines from being parsed or formatted.

The formatter exposes `formatQuickScript(source, options)` and returns a
`FormatResult`. Its first stage formats lexical tokens while emitting string
and comment lexemes unchanged. Its second stage uses parser line structure for
indentation and configured comment block markers. Formatting is deterministic,
document-wide, and idempotent. Historical regex and character-scanning
formatter implementations have been removed.

## Semantic model and language features

Each `.vbi` or `.vi` document is currently one local scope. `DIM` declarations
provide local variable symbols and case-insensitive uses. Navigation resolves
only those declarations; unknown identifiers, member accesses, and external
call targets are not guessed.

Core diagnostics currently cover:

- missing `ENDIF` and `NEXT`;
- invalid block nesting and duplicate `ELSE`;
- duplicate local `DIM` declarations;
- unknown `DIM` datatypes.

The language service provides document symbols, local definition and reference
results, completion, and hover. Completion includes QuickScript keywords and
datatypes, document locals and call targets, and known InTouch/Hermes function
names. The function catalog is generated from
`syntaxes/intouch.tmLanguage.json`; it is not maintained as a parallel manual
list. Hover descriptions use only document facts or labels already present in
that source grammar.

## Language server and VS Code boundary

The language server supports initialize/shutdown, incremental text document
synchronization, document formatting, document symbols, definition,
references, completion, hover, and publish diagnostics. Feature conversion is
unit-tested independently, and a child-process protocol test exercises the
server lifecycle and representative requests without a VS Code process.

`src/extension.ts` contains no parser, formatter, or semantic logic. It starts
`dist/server.js` through `vscode-languageclient`, registers `vbi-format` as a
request to VS Code's standard format command, and lets the language client own
all providers. The TextMate grammar remains the syntax-highlighting surface;
snippets and the theme remain declarative VS Code assets.

## Deliberate limits before manual HIL

- Formatting is document-wide; selection/range formatting is not advertised.
- Definition and references are document-local and require a proven `DIM`
  declaration.
- QuickScript function declarations are not invented because repository
  evidence models each file as a script/function body rather than declaring a
  function in source syntax.
- Project-wide symbol indexing and cross-file call-target resolution are not
  implemented.
- `.vbi` and `.vi` remain excluded from Serena semantic indexing; the native
  language server provides their semantics.

The automated implementation is considered ready for manual HIL only after
compile, core tests, protocol tests, VS Code extension-host tests, lint,
prepublish bundling, VSIX packaging, and repository freshness checks pass. The
manual procedure is documented in [Manual QuickScript HIL](../testing/manual-hil.md).
