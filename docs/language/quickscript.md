# InTouch QuickScript Scope

## Language identity

`.vbi` and `.vi` contain proprietary InTouch QuickScript. They are not Visual
Basic, VBA, VBScript, Pascal, PowerShell, or a compatible subset of any of
those languages. Tooling must not use a foreign parser or language server as a
semantic approximation.

## Current repository evidence

Language knowledge is divided by responsibility:

- `syntaxes/intouch.tmLanguage.json` provides lexical highlighting patterns,
  native InTouch functions, dot fields, and presentation scopes.
- `packages/core/src/languageData.ts` provides canonical lexical keywords,
  datatypes, operators, and punctuation.
- `packages/core/src/tokenizer.ts` and `parser.ts` provide canonical lexical
  and structural interpretation.
- `packages/core/src/generatedFunctionCatalog.ts` is generated from the
  TextMate grammar for completion, hover, and known-function diagnostics; it
  contains public native InTouch knowledge only and is not edited manually.
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

Serena uses the thin QuickScript adapter to connect to the native language
server. ProjectAtlas may index `.vbi` and `.vi` structurally for repository
navigation and lexical search. The extension's native language server supplies
QuickScript symbols, local and QuickFunction cross-file
definitions/references, completion, hover, formatting, and diagnostics.

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

Brace-comment closure takes lexical priority over formatter metadata. A marker
such as `{> following code shall be nested}` that contains `}` on its physical
line is one closed comment token, so its nesting directive can affect the real
QuickScript lines that follow. A marker such as `{>` without `}` on that line
opens a multiline brace comment through the next `}`. Its complete span,
including a later `{<}` closing line, is comment trivia and cannot contribute
parser or semantic diagnostics. The formatter indents that metadata comment as
one block while preserving relative indentation inside it.

Known callable resolution combines the generated public native InTouch catalog
with QuickFunction declarations discovered in the current document and
workspace. Workspace declarations remain a separate, richer source and take
precedence for definition and hover. Project-specific function catalogs must be
supplied externally or locally by a workspace and are not bundled by default;
isolated files may therefore report project calls as unresolved.

Document/script classification comes from the canonical comment-based metadata
model described in [QuickScript Document Metadata](document-metadata.md).
Explicit `@` metadata and structured classic headers take priority over
filename conventions. QuickFunction names therefore do not require `QF_`.
Window scripts (`OnShow`, `WhileRunning`, `OnClose`) and canonical InTouch
KeyScripts/shortcuts are non-callable document symbols.

## Diagnostic layers

Diagnostics retain three separate responsibilities:

- syntax diagnostics report invalid QuickScript structure or expressions;
- semantic diagnostics report invalid language facts such as unknown datatypes
  or unresolved call targets;
- quality diagnostics report technically valid names that are less portable or
  maintainable.

The initial quality codes are:

- `quickscript.naming.nonAsciiIdentifier` for non-ASCII characters in semantic
  identifiers, including QuickFunction and parameter metadata;
- `quickscript.naming.windowWhitespace` for whitespace in a literal window name;
- `quickscript.naming.windowNonAscii` for non-ASCII characters in a literal
  window name.

Window rules apply only when the literal is the window argument of a documented
InTouch window operation. Ordinary strings and all comments remain isolated.
The rules do not rename symbols or affect formatting, hover, completion,
definition, or references.

Each rule defaults to `warning` and accepts `off`, `hint`, `information`,
`warning`, or `error` through these existing `VBI` settings:

- `VBI.diagnostics.naming.nonAsciiIdentifiers`;
- `VBI.diagnostics.naming.windowWhitespace`;
- `VBI.diagnostics.naming.windowNonAscii`.
