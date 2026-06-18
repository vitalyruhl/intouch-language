# Workflow Agent

Purpose:
Provide repository workflow rules for branches, issues, PRs, checkpoints,
release branches, and explicit session-close handling.

Apply `.github/AGENTS.md` unchanged. This file adds workflow-specific rules.

## Branch Model

- `main` is the published/released branch.
- `release/*` branches are runnable snapshot branches and must stay buildable
  and runnable.
- `release/*` branches are versioned by release, for example `release/v1.0.0`
  or `release/v1.1.0`.
- Do not assume `release/*` branches exist. If no suitable release branch
  exists, report that and skip release-branch updates unless the user
  explicitly asks to create or update one.
- Missing release branches do not block normal pull-request based `main`
  integration unless release sync is explicitly in scope.
- `feature/*` branches are work-in-progress branches and may be unfinished or
  temporarily broken.
- Work on one side branch at a time.
- Do not change `main` directly.
- Integrate into `main` through pull requests by default.
- Docs-only TODO updates under `docs/TODO.md` or `docs/todo_*.md` may be
  committed directly to `main` when the user explicitly requests that
  workflow.
- If file-changing work is requested while the active branch is `main` or
  `master`, stop before editing and create or select a proper side branch.
- The only direct-edit exception on `main` or `master` is an explicitly
  requested docs-only TODO update under `docs/TODO.md` or `docs/todo_*.md`.
- Direct pushes to `main` are forbidden unless the user explicitly requests an
  exception.
- Fast-forward integration to `main` is allowed only when the user explicitly
  requests fast-forward or `ff`.

## Git Command Rules

- Apply the central git-command rules from `.github/AGENTS.md`.
- Stage, commit, and push only on explicit user request or when a named
  workflow explicitly requires it.
- If staging is requested, prefer `git add -A`.
- Do not prepend `Set-Location` to git commands. Use the configured working
  directory. For non-git commands that must change directory, use
  `Push-Location` / `Pop-Location`.

## Branch Safety

- Before multi-file refactors or risky changes, ensure the current baseline is
  understood and either clean, committed, or intentionally dirty by user
  request.
- Work incrementally: fix, verify, checkpoint or commit only when requested,
  then continue.
- Verify the active branch matches the task.
- If the active branch is `main` or `master`, warn and stop before
  file-changing work unless the direct-edit docs-only TODO exception applies.
- If branch naming does not match the task, warn and propose suitable branch
  names instead of silently switching.
- Never revert user edits unless explicitly asked.

## Branch Name And Title Derivation

- Derive branch names, issue titles, pull request titles, and task labels from
  the task intent, not by blindly copying informal free text.
- Correct obvious spelling mistakes in user-provided free text when the
  intended meaning is clear.
- Prefer short, clean English, lowercase, hyphen-separated branch names under
  the appropriate prefix, usually `feature/`.
- Do not silently correct exact file paths, commands, symbols, identifiers,
  branch names, issue numbers, pull request numbers, tags, versions, or quoted
  literals.
- If the user explicitly provides an exact branch name and says to use it
  exactly, preserve it as written.
- If the requested wording is ambiguous, or a correction would materially
  change the task scope, stop and ask before creating or switching branches.
- Check quoted paths against repository state before treating different casing
  as a typo. For example, `.github/agents.md` and `.github/AGENTS.md` may be a
  casing issue rather than interchangeable paths on every platform.
- `use workflow.begin [gevernance-sharpenes]` may derive
  `feature/governance-sharpening`.
- `use workflow.begin [update formatter nesting]` may derive
  `feature/update-formatter-nesting`.

## GitHub Workflow

- Prefer gh for PRs, CI checks, and issues when available.
- Keep PRs scoped to one coherent change.
- Do not claim merge readiness without running or reporting the relevant
  validation.
- Apply the central Pull Request Review Policy and GitHub language rules from
  `.github/AGENTS.md`.
- Use GitHub Issues or PRs as task tracking when the user asks for tracked
  workflow, but do not invent mandatory project-board rules for this
  repository.
- GitHub Project usage is optional and controlled by `.github/AGENTS.md`
  `Tracking Policy`.
- Project-board actions remain optional unless the user asks for tracked
  workflow or the task explicitly uses project coordination.
- Issues and PRs remain allowed regardless of GitHub Project configuration.

## TypeScript / VS Code Extension Workflow

- Use configured and enabled GitHub Actions or checks when they exist.
- Do not invent required CI workflows.
- If no enabled CI is configured, report that and rely on required local
  validation.
- Default validation:
  - `npm run lint` when present
  - `npm run typecheck` when present, otherwise `npm run compile` when present
  - `npm test` when present
  - `npm run build` when present, otherwise `npm run bundle` or
    `npm run vscode:prepublish` when relevant
- For affected examples, run the relevant example validation.
- Extension metadata, grammar, snippet, theme, packaging, or build validation,
  when explicitly relevant:
  - run the relevant repository build or packaging script
- Publish, deployment, Marketplace, VS Code host, or network-dependent
  validation commands require explicit user request because they affect local
  tooling, an interactive VS Code runtime, or external services.
- If no `.ts`, `.tsx`, `.js`, `.jsx`, grammar, snippet, theme, package, or
  extension metadata files changed, skip application validation unless
  requested.
- Run relevant tests when tests are present and affected.
- Docker or image builds are not required unless configured in this repository
  or explicitly in scope.

## Documentation Impact Workflow

- Before `workflow.toMain` prepares or merges changes into `main`, perform a
  documentation impact check.
- Check whether changed files or behavior require updates to `README.md`,
  `docs/`, release notes, or governance documentation.
- If documentation is affected, route through `docs.agent.md` before merging.
- If `docs/CHANGELOG.md` exists and the change is user-visible,
  release-relevant, dependency-related, build-related, or version-related,
  update it or explicitly justify why no changelog update is needed.
- If documentation is not affected, report that documentation sync is not
  required and why.
- Do not invent documentation updates for purely internal changes.
- Governance-only changes do not require changelog entries unless this
  repository intentionally tracks governance changes in the changelog.
- Documentation-only changes do not require a version bump.

## Version Bump Workflow

- Apply the central Version Policy from `.github/AGENTS.md`.
- Before changing versions, search for version declarations and report the
  candidate files found.
- If multiple version declarations exist, report them before changing versions.
- Treat the application package version from `package.json` as the main
  project version.
- Treat VS Code extension package metadata and the package lockfile as
  repository build artifacts, not as independent applications.
- When extension contribution metadata, package metadata, or build metadata
  change, align the package mirrors with the application version.
- Bump an example or sample version only when that example itself is
  intentionally changed or released.
- If the version source of truth is unclear, stop and report candidate files
  instead of guessing.

## Release Branch Workflow

- `release/*` branches should represent runnable snapshots.
- Do not assume a release branch exists.
- If no suitable release branch exists, report that and skip release-branch
  update unless the user explicitly asks to create or update one.
- Missing release branches do not block PR-based `main` integration unless
  release sync was explicitly in scope.
- Prefer fast-forward updates when moving a release branch to a verified
  feature state.
- If fast-forward is not possible, ask explicitly before force-pushing. Prefer
  `--force-with-lease` if force-push is approved.
- Do not invent Python or `pyproject.toml` release steps for this repository
  unless the repository later adds such files and policy.
- Project version bumps are governed by `Version Bump Workflow`.

## Workflow Shortcuts

These names describe expected intent if the user invokes them:

- `workflow.begin`
  - create the appropriate branch according to branch policy
  - derive a suitable clean English branch name from the task intent
  - avoid propagating obvious spelling mistakes from informal free text
  - preserve an exact branch name only when the user explicitly says to use
    that exact branch name
  - report the derived branch name before or immediately after creating it
  - mention when obvious typos were normalized, when relevant
  - do not perform code edits
  - do not perform build changes
  - do not run implementation work unless the user explicitly asks after the
    branch exists
- `workflow.checkpoint`: create a commit and push the current coherent state.
- `workflow.docs`: perform a narrow documentation-only synchronization.
- `workflow.audit`: read-only workflow or repository-state audit.
  - no file changes, branch changes, commits, or merges
  - if followed by `workflow.toMain` or `workflow.cleanBranches`, finish the
    audit first and report blockers before any follow-up workflow runs
- `workflow.ship`: build and verify artifacts without implicit merge.
- `workflow.ready`: prepare work for review or integration, run or report
  relevant validation, do not merge to `main`, do not update `release/*`, and
  do not push unless explicitly requested or covered by a named workflow.
- `workflow.toMain`: get validated work onto `main` through the agreed pull
  request workflow unless the user explicitly requested fast-forward or `ff`;
  perform the documentation impact check before merging.
  - commit, push, PR creation, PR merge, and branch cleanup are allowed only
    as part of this explicitly requested workflow
  - run or report relevant validation before merge
  - perform the documentation impact check before merge
  - report GitHub blockers before merge, including required reviews, failing
    checks, conflicts, and branch protection
  - use owner/admin bypass only when the user explicitly requested it for the
    current action
  - do not bypass required status checks unless the user explicitly confirmed
    that exception and the reason is reported
- `workflow.cleanBranches`: delete only branches verified as integrated.
  - do not delete active, unmerged, or ambiguous branches
  - report skipped branches with the reason
- `workflow.end`: inspect repository state and report current branch, changed
  files, validation state, and blockers without claiming merge or fix success.
  Do not commit, push, merge, or update release branches unless explicitly
  requested.

Shortcut behavior must remain conservative:

- Inspect repository state first.
- Avoid destructive operations.
- Report blockers plainly.
- Do not create parallel branch lines for the same work.
- Chained shortcuts run sequentially. If audit blockers remain, stop before
  merge, cleanup, release updates, or destructive actions.
- Follow-up workflows after `workflow.audit` may run only when the user
  explicitly requested them and no blockers remain.
- Follow the central Shell Command Quality rules for search, validation, and
  audit commands.

## Mandatory Reporting

- Apply the central reporting rules from `.github/AGENTS.md`.
- Additionally report release branch updates if any.
