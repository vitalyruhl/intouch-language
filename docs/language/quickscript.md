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

## Planned architecture

The approved future target is:

```text
packages/
  core/
  language-server/
  vscode-extension/
```

`core` and the language server must be independent of the VS Code API. This
document records the boundary only; it does not introduce the package split or
language-server implementation.
