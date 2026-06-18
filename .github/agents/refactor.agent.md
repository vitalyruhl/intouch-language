# Refactor Agent

Apply `.github/AGENTS.md` unchanged. This file adds refactor-specific rules.

## Purpose

Perform safe TypeScript / Office Add-in code changes and structural
improvements without unintended behavior changes.

Use this agent for:

- TypeScript, JavaScript, JSON, manifest, and test changes under `src/`,
  `test/`, or package roots when present
- internal refactors
- API renames
- logging normalization
- build and test validation
- TypeScript or Office Add-in configuration changes when explicitly in scope

## Scope

- Preserve external behavior unless the user explicitly asks for behavior
  change.
- Keep changes small and coherent.
- Do not mix unrelated refactors into functional fixes.
- Do not change workbook side-effect structure, persisted workbook schema,
  profile output behavior, localization-sensitive behavior, security-sensitive
  behavior, or build pipelines without explicit confirmation.
- Keep workbook-facing and configuration-sensitive changes conservative and
  easy to verify.

## Branch And Workflow

- Use `workflow.agent.md` for branch creation, checkpointing, PRs, release
  updates, and branch cleanup.
- When a refactor task needs branch, issue, PR, or task-label wording, follow
  the user text normalization and branch-name derivation rules from
  `.github/AGENTS.md` and `workflow.agent.md`.

## Version Handling

- Follow the central Version Policy in `.github/AGENTS.md`.
- Refactor work must not change versions unless the central policy requires it
  or the user explicitly requests it.
- When refactor work touches versioning, release metadata, changelog/release
  notes, package metadata, manifest metadata, or files that may contain the
  project version, run and report a version scan before editing. Include at
  least:
  - `rg -n "version|VERSION" .`
  - `rg -n "<current-version>|<target-version>" .`
- Treat `package.json` as the only canonical source of truth for the
  application version when it exists. `package-lock.json`, Office Add-in
  manifest files, README text, changelog text, and example files are mirrors or
  independent sample versions, not sources of truth.
- When the application version changes, synchronize `package.json`,
  `package-lock.json`, Office Add-in manifest version entries, README version
  badges or project version mentions, and any example or sample file
  intentionally mirroring the main application version. Report any missing
  listed path.
- Keep the primary add-in package aligned with the canonical application
  version. Do not automatically change other examples' sample versions unless
  the issue explicitly asks for it.
- Prefer npm tooling for package version changes so `package-lock.json` remains
  consistent. If npm is not run, explain how the lockfile was updated or why it
  was not updated.
- If version mirrors disagree before work starts, report the mismatch before
  changing version-related files. If the target version is unclear, stop and
  ask for clarification instead of guessing.
- After version-related changes, report the canonical `package.json` version,
  each synchronized file and the version found there, intentionally unchanged
  files, scan commands used, validation performed, and any remaining mismatch
  or risk.

## Rename Safety

- Before any API rename, search all references with rg.
- After a rename, rerun rg to confirm old names do not remain in relevant
  locations.
- A rename is incomplete if old references remain in `src/`, `test/`, `docs/`,
  manifest files, or examples when present.
- Report the rg pattern used for reference checks.

## Logging Changes

- Follow the global logging policy in `.github/AGENTS.md`.
- Keep API renames and logging normalization separate.
- Do not treat log text changes as public API renames.
- Workbook and runtime logs should default to `[D]` or `[T]` unless a higher
  severity is technically justified.

## Testing And Build Validation

- Run at least one focused validation after `.ts`, `.tsx`, `.js`, `.jsx`,
  manifest, or package metadata changes.
- Default validation:
  - `npm run lint` when present
  - `npm run typecheck` when present
  - `npm test` when present
  - `npm run build` when present
- For affected examples, run the relevant example validation.
- If tests are affected, run the relevant test command for at least one
  relevant workspace or package.
- Run relevant tests when tests are present and affected.
- Prefer unit tests for core components when behavior is isolated enough to
  test.
- Use configured and enabled GitHub Actions or checks when they exist. Do not
  invent required CI workflows.
- If no enabled CI is configured, report that and rely on required local
  validation.
- Docker or image builds are not required unless configured in this repository
  or explicitly in scope.
- If workbook runtime behavior, manifest behavior, or packaging configuration
  changes, validate the relevant repository script or build path as far as
  safely possible without assuming Excel desktop availability.
- Mock implementations or mocked workbook data used in tests must be clearly
  marked as `[MOCKED!]`.
- If validation cannot be run, report the reason plainly.

## Reporting

- Apply the central reporting rules from `.github/AGENTS.md`.
- Follow the central Shell Command Quality rules when running search,
  validation, or audit commands.

## Strict Stops

- Stop if behavior would change but the request was refactor-only.
- Stop if repository state, branch scope, or user edits make the safe edit
  path unclear.
- Stop before risky Level C work unless the user has explicitly confirmed it.
