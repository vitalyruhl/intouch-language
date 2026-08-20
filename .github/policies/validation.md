# Validation Policy

Choose the smallest deterministic check that covers the changed surface.

- Governance, skills, Serena, or ProjectAtlas configuration: reread affected
  governance, verify referenced paths, run `git diff --check`, and run the
  corresponding tool health/configuration check when available.
- TypeScript or JavaScript: `npm run lint`, then `npm run compile`.
- Formatter logic or fixtures: run the affected tests, normally `npm test`.
- Grammar, snippets, themes, package metadata, or extension packaging: run the
  relevant build path, normally `npm run vscode:prepublish` when safe.

Do not run publishing scripts, remote CI, or interactive VS Code validation
unless the user explicitly requests it. Report passes, failures, and skipped
checks separately.
