# Canonical Repository Governance

## Preflight and scope

Before repository work, read this file and the applicable role under
`.github/agents/`. Read an applicable policy or skill only when its subject is
in scope. Use `rg --hidden` for governance discovery.

This repository is one npm-managed TypeScript VS Code extension. Scope
validation and documentation to the changed extension surface; do not invent a
monorepo, release process, or CI gate that does not exist.

## Roles

- `control-plane` routes work only.
- `workflow` owns branches and Git/GitHub workflow.
- `docs` owns documentation and governance changes.
- `refactor` owns product changes and their validation.
- `testing` owns validation-only work.
- `plan`, `audit`, and `architecture-audit` are read-only.

## Policies and skills

- Apply `.github/policies/branching.md` for branch and Git decisions.
- Apply `.github/policies/documentation.md` for documentation decisions.
- Apply `.github/policies/validation.md` for local checks.
- Apply `.github/policies/versioning.md` before version-impacting work.
- Load a matching `.agents/skills/*/SKILL.md` for explicit gates and index
  freshness work.

## Safety and autonomy

Agents may inspect the repository, search references, run local deterministic
checks, implement requested reversible changes, update related tests and
documentation, and repair obvious local follow-up errors. Preserve unrelated
user changes.

Stop and request direction for unclear QuickScript semantics, a breaking public
API or formatter/grammar behavior change without an established basis, data
loss, an irreversible migration, a fundamental architecture change outside the
agreed target, credentials or paid services, and release, publish, tag, push,
or merge operations not explicitly requested.

## QuickScript and architecture

`.vbi` and `.vi` are proprietary InTouch QuickScript. Never semantically parse
them with Visual Basic, VBA, VBScript, Pascal, PowerShell, or another foreign
language. The grammar, formatter, keyword/data-type/function definitions,
nesting rules, fixtures, and language documentation in this repository are the
current language evidence.

The future shape is `packages/core`, `packages/language-server`, and
`packages/vscode-extension`. `core` and the language server must not depend on
the VS Code API. Do not begin that migration unless it is explicitly in scope.

## Serena and ProjectAtlas

Use ProjectAtlas for repository orientation, lexical search, and architecture
navigation. It can treat QuickScript as neutral text, not as semantic symbols.
Use Serena for semantic navigation only in its genuinely supported languages;
`.vbi` and `.vi` must remain excluded until a native InTouch language server is
available. Never edit their caches or SQLite indexes directly.

## Reporting

After file-changing work, report the branch, files changed, relevant governance
files read, validation performed or skipped, remaining risks, and working-tree
status. Do not call a defect fixed or an issue solved until the user confirms
the result works.
