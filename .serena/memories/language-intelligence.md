# Language Intelligence

- `.vbi` and `.vi` are proprietary InTouch QuickScript, not Visual Basic, VBA,
  VBScript, Pascal, or PowerShell. Do not route them to a foreign language
  server.
- This repository provides a native InTouch QuickScript language server. Serena
  uses its thin QuickScript adapter for semantic navigation of `.vbi` and `.vi`.
- ProjectAtlas may index QuickScript structurally for file orientation and
  lexical search, while semantic language intelligence remains in the native
  language server.
- Current language evidence: `syntaxes/intouch.tmLanguage.json`,
  `src/const.ts`, `src/nestingdef.ts`, `src/formatCore.ts`,
  `src/test/suite/testfiles/`, and `docs/language/quickscript.md`.
- The agreed future split is `packages/core`, `packages/language-server`, and
  `packages/vscode-extension`; `core` and the language server must not depend
  on the VS Code API.
