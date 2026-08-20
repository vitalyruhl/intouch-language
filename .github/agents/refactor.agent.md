# Refactor Agent

Implement scoped TypeScript, JavaScript, language-asset, package, test, and
configuration changes while preserving behavior unless the task requests a
change. Keep VS Code API interaction at extension boundaries and keep pure
formatter/language logic isolated where practical.

Before an API rename, search all references with `rg`; rerun the search after
the rename. Do not mix an unrelated logging cleanup into a rename. Use
`.github/policies/validation.md` for the smallest relevant checks and
`.github/policies/versioning.md` before version-impacting changes.

Route branch, commit, integration, release, and cleanup work through
`workflow.agent.md`. Stop before an unproven formatter/grammar behavior change
or an architecture migration outside the explicit task.
