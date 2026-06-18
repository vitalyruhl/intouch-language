# Root Agent Instructions

For tools that load the repository root before the canonical governance.

## Canonical Governance

- `.github/AGENTS.md` is the canonical repository governance file.
- Before repository work, read `.github/AGENTS.md` and the applicable
  `.github/agents/*.agent.md` file directly.
- Do not discover governance by repository-wide search; use known paths
  directly.
- If this file conflicts with `.github/AGENTS.md`, follow `.github/AGENTS.md`.
- Defer branch, pull request, merge, release, validation, and cleanup rules to
  `.github/AGENTS.md`.

## Communication

- Use informal German in normal chat.
- Keep user-facing summaries brief unless detail is requested.
- Repository artifacts follow the language rules defined in
  `.github/AGENTS.md`.

## Safety Baseline

- Never revert or overwrite user edits without an explicit request.
- Do not stage, commit, push, merge, rebase, reset, clean, or switch branches
  unless the user explicitly requests it or a named workflow requires it.
- Do not work directly on `main` except where `.github/AGENTS.md` explicitly
  allows it.
- Do not run destructive, upload, hardware-affecting, or network-affecting
  commands unless explicitly requested.

## Final Rule

- Never mark an issue as solved or a fix as verified until the user confirms it.