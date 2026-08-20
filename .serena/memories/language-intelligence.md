# Language Intelligence

- `.vbi` and `.vi` are proprietary InTouch QuickScript, not Visual Basic, VBA,
  VBScript, Pascal, or PowerShell. Do not route them to a foreign language
  server.
- Serena excludes QuickScript from semantic navigation until this repository
  provides a native InTouch language server. Use targeted text search and
  repository language evidence in the meantime.
- ProjectAtlas may index QuickScript as neutral text for file orientation and
  lexical search, never as a source of semantic symbols or references.
- Current language evidence: `syntaxes/intouch.tmLanguage.json`,
  `src/const.ts`, `src/nestingdef.ts`, `src/formatCore.ts`,
  `src/test/suite/testfiles/`, and `docs/language/quickscript.md`.
- The agreed future split is `packages/core`, `packages/language-server`, and
  `packages/vscode-extension`; `core` and the language server must not depend
  on the VS Code API.
