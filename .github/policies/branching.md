# Branching and Git Policy

- Use a single task-specific side branch for file-changing work; `main` and
  `master` are protected from direct changes.
- `feature/<topic>` is the default branch shape. Use a short, stable English
  kebab-case topic. Governance and tooling work may use `governance/<topic>`.
- Inspect branch and working-tree state before Git mutations. Preserve unclear
  or unrelated changes; never use destructive Git commands to make a task fit.
- `workflow.begin` creates or selects the correct branch without implementation.
  `workflow.checkpoint` creates a requested commit and pushes only when asked.
- Never push, merge, tag, release, or publish without explicit authorization.
- Use a pull request for integration to `main` unless the user explicitly asks
  for a fast-forward workflow.
