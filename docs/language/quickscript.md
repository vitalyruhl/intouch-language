# InTouch QuickScript Scope

## Language identity

`.vbi` and `.vi` contain proprietary InTouch QuickScript. They are not Visual
Basic, VBA, VBScript, Pascal, PowerShell, or a compatible subset of any of
those languages. Tooling must not use a foreign parser or language server as a
semantic approximation.

## Current repository evidence

The current language knowledge is distributed deliberately across the extension:

- `syntaxes/intouch.tmLanguage.json`: lexical highlighting patterns, built-in
  functions, data types, dot fields, and language scopes.
- `src/const.ts`: formatter keywords and operators.
- `src/nestingdef.ts` and `src/formatCore.ts`: block and indentation behavior.
- `language-configuration.json` and `snippets/vbi.json`: editor behavior and
  authoring templates.
- `src/test/suite/testfiles/`: formatter fixtures that capture supported
  formatting behavior.

The runtime vendor documentation remains authoritative when it conflicts with
repository evidence. Any semantic uncertainty is an escalation point; do not
guess from a similar language.

## Tooling boundary

Serena excludes QuickScript until a native InTouch language server exists.
ProjectAtlas can index these files as neutral text for repository navigation
and lexical search only. Neither tool currently supplies QuickScript symbols,
definitions, references, or diagnostics.

## Target architecture

The approved target is:

```text
packages/
  core/
  language-server/
  vscode-extension/
```

`packages/core` now establishes the editor-independent source and tokenizer
boundary. The language server must also remain independent of the VS Code API.
`packages/language-server` and `packages/vscode-extension` are still planned;
no language-server implementation or transport exists yet.
