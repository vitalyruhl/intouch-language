# Task Completion

- After `.ts`, `.tsx`, `.js`, extension manifest/package metadata, grammar, snippet, theme, or test changes, run the narrowest relevant available npm validation.
- Default validation order from repo governance: `npm run lint` when present, `npm run compile` / typecheck equivalent when present, `npm test` when relevant, `npm run bundle` or `npm run vscode:prepublish` for packaging/build-surface changes.
- Governance-only changes require governance consistency review: reread affected governance files and check agent routing, branch/workflow rules, tool policy, validation rules, version rules, and reporting rules for contradictions.
- Before final reporting after file changes, inspect `git status --short --branch` and focused diffs/stat.
- Serena memories can be checked from the repo root with `serena memories check`.