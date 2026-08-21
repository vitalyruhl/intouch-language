# InTouch Language Architecture

## Dependency direction

```text
QuickScript source
        |
        v
packages/core
  tokenizer -> document metadata extractor -> parser -> semantics
                                             -> quality diagnostics
                                             -> language features
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

Each `.vbi` or `.vi` document has one canonical metadata model and one local
scope. Metadata is extracted only from comment tokens, with explicit `@`
fields taking priority over structured legacy headers and filename fallbacks.
`DIM` declarations provide local variable symbols and case-insensitive uses.
A URI-aware incremental language-server index adds cross-file QuickFunction
definitions and call references without moving editor or transport types into
core.

Core diagnostics currently cover:

- missing `ENDIF` and `NEXT`;
- invalid block nesting and duplicate `ELSE`;
- duplicate local `DIM` declarations;
- unknown `DIM` datatypes;
- unresolved function calls.

Quality diagnostics are a separate post-semantic layer. They report technically
valid but less portable or maintainable names and never change parser validity,
symbols, navigation, or formatter output. Quality diagnostics use
`intouch-quality` as their LSP source, while syntax and semantic diagnostics
continue to use `intouch-language`.

The initial quality rules cover non-ASCII identifiers and literal InTouch
window names containing whitespace or non-ASCII characters. Identifier
candidates come from the semantic model, including local and external uses plus
QuickFunction and parameter declarations extracted from metadata comment
tokens. Window strings are inspected only as arguments of documented window
commands/functions.

The language service provides metadata-aware document symbols, local and
cross-file definition/reference results, completion, and hover. Completion includes QuickScript keywords and
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
server lifecycle plus cross-file workspace requests without a VS Code process.
The initial workspace scan reads `.vbi` and `.vi` once. Open/change and watched
file events replace only the affected URI entry; requests do not reread or
reparse every workspace file.

`src/extension.ts` contains no parser, formatter, or semantic logic. It starts
`dist/server.js` through `vscode-languageclient`, registers `vbi-format` as a
request to VS Code's standard format command, and lets the language client own
all providers. The TextMate grammar remains the syntax-highlighting surface;
snippets and the theme remain declarative VS Code assets.

## Deliberate limits before manual HIL

- Formatting is document-wide; selection/range formatting is not advertised.
- Local-variable navigation remains document-local.
- QuickFunction metadata supplies callable workspace symbols, cross-file
  definition/reference locations, signatures, hover, and completion without
  inventing executable declaration syntax.
- Window, Application, DataChange, Condition, and KeyScript documents are
  non-callable workspace symbols. Window events are limited to `OnShow`,
  `WhileRunning`, and `OnClose`.
- Signature metadata is canonical, but an LSP Signature Help provider remains
  planned.
- Duplicate Window-event diagnostics remain deferred until version/backup
  exports can be distinguished reliably.
- Project-wide variable symbol indexing and cross-file variable navigation are
  not implemented.
- `.vbi` and `.vi` remain excluded from Serena semantic indexing; the native
  language server provides their semantics.

The automated implementation is considered ready for manual HIL only after
compile, core tests, protocol tests, VS Code extension-host tests, lint,
prepublish bundling, VSIX packaging, and repository freshness checks pass.
