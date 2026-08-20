---
name: validation-gate
description: Select and report the smallest relevant local validation for the current change.
---

Inspect package scripts, workspace metadata, tests, language assets, and CI
configuration before selecting commands. Follow `.github/policies/validation.md`.
Governance-only work needs consistency checks and `git diff --check`, not an
unrelated product build. Report each command, exit status, validation-created
files, and blockers. Do not publish, upload, or mask failures.
