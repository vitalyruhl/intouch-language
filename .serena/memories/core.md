# Core

- Project: VS Code extension `intouch-language` for InTouch / Wonderware / AVEVA VBI language support.
- Main extension entry: `src/extension.ts`; compiled output under `out/`; bundled extension output under `dist/extension.js`.
- Language assets: `syntaxes/intouch.tmLanguage.json`, `language-configuration.json`, `snippets/vbi.json`, `themes/dark.json`.
- Formatter/domain code: `src/formats.ts`, `src/formatCore.ts`, `src/functions.ts`, `src/nestingdef.ts`, `src/const.ts`.
- Tests: `src/test/suite/*.test.ts` with fixtures in `src/test/suite/testfiles/`.
- Project/package metadata and VS Code contribution manifest live in `package.json`; version source of truth is `package.json`.
- Repository governance entrypoint: `AGENTS.md` delegates to `.github/AGENTS.md` plus `.github/agents/*.agent.md`.
- Related memories: `mem:tech_stack`, `mem:suggested_commands`, `mem:conventions`, `mem:task_completion`, `mem:language-intelligence`.
