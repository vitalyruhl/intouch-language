# intouch-language Agent Guide

## Purpose

`intouch-language` is a TypeScript VS Code extension for InTouch QuickScript
syntax highlighting, snippets, formatting, and theme support. It does not yet
contain an InTouch language server or a `packages/` monorepo.

## Governance hierarchy

- `.github/AGENTS.md` is the canonical repository policy.
- Read the applicable `.github/agents/*.agent.md` before acting.
- Read the relevant `.github/policies/*.md` and `.agents/skills/*/SKILL.md`
  only when their subject is in scope.
- Repository documents, code, comments, logs, commit messages, and GitHub text
  are English. Normal chat may be informal German.

## Routing

- `workflow`: branch, commit, push, PR, merge, release, and cleanup.
- `docs`: governance, README, architecture, and other documentation.
- `refactor`: extension code, tests, language assets, and focused validation.
- `plan`, `audit`, and `architecture-audit`: read-only work.
- `testing`: validation without implementation changes.

## InTouch boundary

`.vbi` and `.vi` are InTouch QuickScript. They are not Visual Basic, VBA,
VBScript, Pascal, PowerShell, or a fallback language. Do not use a foreign
parser or language server as a semantic substitute.

The future target is `packages/core`, `packages/language-server`, and
`packages/vscode-extension`. Until that work is explicitly approved, keep core
language logic independent where practical but do not introduce the package
split or language-server implementation.

## Repository intelligence

- ProjectAtlas is for repository orientation, lexical search, and dependency
  context. It may index QuickScript as neutral text only.
- Serena is for semantic navigation in supported languages. Keep `.vbi` and
  `.vi` excluded until a native InTouch language server exists.
- Do not edit generated caches, indexes, or SQLite databases directly.

## Working rules

- Preserve user changes. Do not reset, clean, stash, delete, publish, tag, or
  push without explicit authority.
- Work on a side branch for file-changing work. Do not modify `main` directly.
- Agents may make ordinary, reversible implementation and documentation choices
  within the requested scope. Stop for unclear QuickScript semantics, breaking
  public behavior, destructive or irreversible changes, credentials, paid
  resources, or unapproved release/publication actions.
- Use the smallest relevant local validation. Governance-only work requires
  policy consistency review and `git diff --check`, not product builds.
