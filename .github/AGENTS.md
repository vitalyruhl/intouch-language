# AGENTS.md

Repository guidance for contributors and coding agents.

This repository is `intouch-language`, a TypeScript VS Code extension for
InTouch SCADA / VBI syntax highlighting, formatting, snippets, and theme
support.

## Mandatory Governance Load Preflight

Before any agent command, workflow shortcut, branch action, validation, file
edit, commit, push, pull request, merge, release-branch update, or cleanup,
the agent MUST read:

- `.github/AGENTS.md`
- `.github/agents/<selected-agent>.agent.md`

For workflow shortcuts, `<selected-agent>` is
`.github/agents/workflow.agent.md`.

Do not discover governance by repository-wide search. If a governance path is
known, read it directly.

Governance search with rg/fd MUST include hidden paths:

- `rg --hidden -n "workflow\.begin|workflow\.audit|workflow\.toMain|workflow\.cleanBranches" .`
- `fd --hidden "AGENTS|agent\.md|workflow\.agent\.md" .`

Plain `rg ... .` or `fd ... .` is insufficient for governance discovery.

Failure to read the required governance files is a hard blocker and MUST be
reported before any further action.

## Communication

- Use informal German ("du") in normal chat.
- Keep explanations short unless detail is explicitly requested.
- After completing work, summarize briefly.
- Only normal chat may default to German. Repository artifacts must remain in
  English unless the user explicitly requests another language for that
  artifact.

## Repository Text Language

- Governance under `.github/`, repository documentation, generated project
  text, issue text, pull request text, agent review comments, code comments,
  error messages, log messages, and agent commit messages MUST be English
  unless a repository document defines another language for that artifact
  class.
- Do not translate repository artifacts to German because the user chat is
  German.
- Another artifact language requires an explicit user request for that
  artifact.

## User Text Normalization

- User prompts may contain informal German, mixed German/English wording, and
  obvious spelling mistakes.
- Normalize free text to clean English for branch names, issue/PR titles, task
  labels, and governance wording.
- Do not silently normalize exact paths, commands, symbols, identifiers,
  explicit names, issue/PR numbers, tags, versions, or quoted literals.
- If the user says to use a name exactly, preserve it.
- Check quoted path casing against repository state.
- If intent is unclear or normalization changes scope, stop and ask.

## GitHub Text Language

- GitHub Issue titles/bodies and Pull Request titles/descriptions created by
  agents must be written in English.
- GitHub comments created by agents should be written in English unless the user
  explicitly requests otherwise.
- Do not create German GitHub issue or PR text by default.
- These rules apply to GitHub and repository artifacts, not normal chat.

## Repository Scope

- Primary project metadata is expected in `package.json`, `tsconfig*.json`,
  VS Code extension contribution metadata, and repository governance.
- Main application source is expected under `src/`.
- Extension activation, command registration, formatter, and language-support
  code is expected under `src/`.
- TextMate grammar, snippets, language configuration, themes, and VS Code
  contribution assets are expected under `syntaxes/`, `snippets/`,
  `language-configuration.json`, `themes/`, and `package.json`.
- Core formatting and language transformation logic is expected under
  `src/formats.ts`, `src/formatCore.ts`, `src/functions.ts`,
  `src/nestingdef.ts`, and related `src/` modules.
- Examples, sample VBI files, screenshots, or language reference material may
  live under `LanguageDefinition/`, `src/test/suite/testfiles/`, `examples/`,
  or documentation folders when present.
- Supporting documentation lives under `docs/` and `README.md`.
- Tests live under `src/test/`, `test/`, or package test folders when present.
- Support scripts and repository tooling live under `scripts/`, `tools/`, or
  package scripts when present.
- Serena project state may live under `.serena/`.
- Do not assume Python application release flows, embedded-device workflows, or
  a standalone backend web service unless the repository explicitly introduces
  them.

## Architecture Guardrails

- Do not port legacy VBI/VBA-like procedures 1:1 without assigning them to the
  correct VS Code extension layer.
- VS Code command registration and activation code must not own core formatter
  or language transformation logic.
- Extension orchestration coordinates activation, command registration,
  formatter registration, diagnostics when present, configuration access, and
  error handling.
- Formatter and language-support modules contain the domain logic for
  normalization, nesting, spacing, keyword handling, grammar support, snippets,
  and validation.
- VS Code API access must be encapsulated at extension boundaries. Do not
  scatter direct editor or workspace side effects through pure formatting
  logic.
- Helper functions are allowed only for pure, side-effect-free language or
  formatter logic unless they intentionally sit at an extension boundary.
- Grammar, snippets, themes, and formatter output translate validated language
  knowledge into VS Code-specific contribution formats.
- Keep user-facing text suitable for VS Code localization. Do not hard-code
  German UI strings deep in formatter or language-support modules.

## Agent Routing

- `.github/AGENTS.md` is the canonical source for repository-wide rules.
- `.github/agents/control-plane.agent.md` only routes work.
- Use `.github/agents/refactor.agent.md` for TypeScript / VS Code extension code
  changes, refactors, tests, and validation.
- Use `.github/agents/workflow.agent.md` for branches, issues, PRs, releases,
  checkpoints, and explicit session-close workflows.
- Use `.github/agents/docs.agent.md` for documentation work.
- Agent files may add scope-specific rules, but must not contradict this file.
  If they do, follow this file and report the drift.

## Tracking Policy

- GitHub Issues and Pull Requests may be used when useful.
- GitHub Project usage is optional and repository-specific.
- Current GitHub Project: none configured in repository governance.
- When tracked workflow or project coordination is relevant, agents may use the
  configured GitHub Project if one is introduced later.
- Do not invent mandatory project-board updates for work that does not use
  tracking.
- If the configured GitHub Project changes later, update this file and keep
  workflow guidance consistent with the new value.

## Safety Principles

- Never revert or overwrite user edits without asking.
- Analyze before modifying files.
- Do not make functional project-code changes unless explicitly requested or
  strictly required to correct governance references.
- Do not invent project rules. Preserve existing project-specific rules unless
  they are clearly obsolete or consciously replaced by newer governance.
- Do not mark an issue as solved or fixed until the user confirms it works.
- Before rename/delete operations, search references first and update them.
- Before workspace-modifying terminal commands, ensure goal and scope are
  clear.
- If requirements are ambiguous or a change impacts multiple subsystems/files,
  ask 1-3 precise questions or propose 2-3 options before editing.
- Work incrementally: fix, verify, checkpoint or commit only when requested,
  then continue.
- Work on one side branch at a time.
- Before multi-file refactors or other risky changes, ensure the baseline is
  understood and either clean, committed, or intentionally dirty by user
  request.

## Autonomy Levels

- Level A, safe: read-only actions such as search, read, and analysis may be
  done immediately.
- Level B, normal: small, clearly scoped changes may be implemented
  immediately.
- Level C, risky: changes involving VS Code command side effects, formatter
  output behavior, grammar scope structure, extension packaging metadata,
  release metadata, localization architecture, security-sensitive behavior,
  build pipelines, or large refactors require explicit confirmation.

## Repository Workflow Rules

- Route branch, release, PR, merge, checkpoint, and cleanup operations through
  `.github/agents/workflow.agent.md`.
- Integrate into `main` through pull requests by default.
- `main` is the published or released branch.
- `release/*` branches are runnable snapshot branches and must stay buildable
  and runnable.
- `release/*` branches are versioned by release, for example `release/v1.0.0`.
- Do not assume `release/*` branches exist. Missing release branches do not
  block normal PR-based `main` integration unless release sync is explicitly in
  scope. If release sync is explicitly requested and no suitable release branch
  exists, report that and skip the release update unless the user explicitly
  asks to create or update one.
- `feature/*` branches are work-in-progress branches and may be unfinished or
  temporarily broken.
- Do not change `main` directly.
- Docs-only TODO updates under `docs/TODO.md` or `docs/todo_*.md` may be
  committed directly to `main` only when the user explicitly requests that
  workflow.
- If the active branch is `main` or `master` and file-changing work is
  requested, stop before editing and route through
  `.github/agents/workflow.agent.md` to create or select a proper side branch.
- The only direct-edit exception on `main` or `master` is an explicitly
  requested docs-only TODO update under `docs/TODO.md` or `docs/todo_*.md`.
- Direct pushes to `main` are forbidden unless the user explicitly requests an
  exception.
- Fast-forward integration to `main` is allowed only when the user explicitly
  requests fast-forward or `ff`.
- Workflow shortcuts may be chained only in sequence. `workflow.audit` is
  strictly read-only and MUST finish by reporting blockers before any follow-up
  shortcut runs.
- If `workflow.audit` is followed by `workflow.toMain` or
  `workflow.cleanBranches`, continue only when the user explicitly requested the
  follow-up shortcut and no blockers remain.
- If blockers remain after audit, stop before merge, cleanup, release updates,
  or other destructive actions.
- Before preparing or merging into `main`, perform a documentation impact
  check: decide whether changed files or behavior require documentation
  updates.
- If documentation is affected, route the work through
  `.github/agents/docs.agent.md` before integration.
- If `docs/CHANGELOG.md` exists and the change is user-visible,
  release-relevant, dependency-related, build-related, or version-related,
  update it or explicitly justify why no changelog update is needed.
- If documentation is not affected, report that documentation sync is not
  required and why.
- Do not invent documentation updates for purely internal or governance-only
  changes unless governance documentation itself changed.
- Governance-only changes do not require changelog entries unless this
  repository intentionally starts tracking governance changes in the changelog.
- Documentation-only changes do not require a version bump.
- Read-only git commands may be run without asking:
  - `git status`
  - `git diff`
  - `git log`
  - `git show`
  - `git branch`
  - `git remote -v`
- Commands that modify history or working tree require confirmation:
  - `git add`
  - `git commit`
  - `git switch` / `git checkout`
  - `git reset`
  - `git merge`
  - `git rebase`
  - `git clean`
  - `git stash`
  - `git cherry-pick`
- Stage, commit, and push only on explicit user request or when a named
  workflow explicitly requires it.
- If staging is requested, prefer `git add -A`.
- Do not prepend `Set-Location` to git commands. Use the configured working
  directory. For non-git commands that must change directory, use
  `Push-Location` / `Pop-Location`.
- Prefer gh for PRs, CI checks, issues, and project operations when available.
- For `workflow.toMain`, commit, push, pull request creation, pull request
  merge, and branch cleanup are allowed only when explicitly requested by the
  shortcut and only after repository state, validation needs, and
  documentation impact were checked.
- Before merging to `main`, run or report relevant validation, perform the
  documentation impact check, and report GitHub blockers such as required
  reviews, failing checks, conflicts, or branch protection.
- Owner/admin bypass may be used only when the user explicitly requested it for
  the current action. Required status checks must not be bypassed unless the
  user explicitly confirms that exception and the reason is reported.
- For `workflow.cleanBranches`, delete only branches verified as integrated. Do
  not delete active, unmerged, or ambiguous branches, and report skipped
  branches with the reason.

## Pull Request Review Policy

- Maintainer-owned PRs do not require external review by repository governance
  and may be merged when required validation passed and GitHub branch
  protection allows the merge.
- External contributor PRs require review before merge. Do not merge
  unreviewed external contributions.
- Branch protection or ruleset bypass may only be used when the user explicitly
  requests owner/admin bypass for the current action.
- Do not use owner/admin bypass automatically.
- If GitHub branch protection blocks a merge because review is required, report
  the blocker and do not bypass branch protection.
- If a maintainer-owned PR is blocked only by a review requirement and required
  validation passed, report that owner/admin bypass may be possible when
  configured.
- If review is not intended for maintainer-owned PRs, recommend adjusting
  branch protection instead of bypassing it.
- Do not bypass external contributor PR review unless the user explicitly
  confirms a repository-owner exception after reviewing the PR.
- Required status checks must not be bypassed unless the user explicitly
  confirms an owner/admin exception and the reason is reported.

## Version Policy

- Require an appropriate project version bump for dependency updates,
  TypeScript / VS Code extension configuration changes, package metadata
  changes, application code changes, grammar/snippet/theme changes, or example
  changes that affect build outputs unless the user explicitly says not to
  bump.
- Governance-only and documentation-only changes do not require a version bump.
  Report that the version bump was skipped by policy.
- Use patch version bumps for dependency updates, bug fixes, internal
  compatible changes, and build or configuration maintenance with no public API
  break.
- Use minor version bumps for new public features, new examples, new public
  APIs, and compatible behavior additions.
- Use major version bumps for breaking public API changes, incompatible
  formatter output changes, incompatible language grammar or scope changes,
  incompatible configuration schema changes, or behavior changes requiring user
  migration.
- `package.json` is the canonical source of truth for the extension version.
  Do not silently use VS Code Marketplace metadata, generated package files,
  `package-lock.json`, README text, changelog text, or any example file as a
  source of truth.
- All other project version occurrences are mirrors and must be synchronized
  from `package.json` when the application version changes.
- Before changing versions, release metadata, changelog/release notes, package
  metadata, VS Code extension contribution metadata, or any file that may
  contain the project version, scan the repository and report candidate version
  files. The scan must include at least:
  - `package.json`
  - `package-lock.json` when present
  - `package.json` VS Code extension contribution and package metadata
  - `docs/CHANGELOG.md` or the resolved changelog path when different
  - README version badges or version mentions, when present
  - any additional files found by ripgrep containing the current or target
    version string
- Suggested version scan commands:
  - `rg -n "version|VERSION" .`
  - `rg -n "<current-version>|<target-version>" .`
- The following known mirrors must carry the same application version whenever
  the project version changes:
  - `package.json`
  - `package-lock.json` when present
  - VS Code extension package and Marketplace metadata references
  - README version badges or project version mentions, when present
  - example version references when an example package or extension metadata
    mirror the main application version
- If a required mirror path does not exist, report it instead of silently
  ignoring it.
- The primary VS Code extension package is part of the application baseline and
  must mirror the canonical project version.
- Other examples, language reference files, or sample VBI assets may have
  independent sample versions. Do not automatically change them unless the
  issue explicitly asks for that example or reference version to change.
  Preserve example-specific version policies and mention them in the report
  when relevant.
- Treat VS Code extension package metadata and the package lockfile as
  repository build artifacts, not independent applications. Keep them aligned
  with the canonical version policy.
- `package-lock.json` is generated but still must be updated consistently when
  `package.json` changes. Prefer npm tooling so the lockfile remains
  consistent. If npm is not run, explain how `package-lock.json` was updated or
  why it was not updated.
- Version changes that affect the published application package must include a
  changelog update unless the governing issue explicitly says otherwise. Before
  editing changelog/docs, follow the docs-agent rules. If the changelog
  location is ambiguous, inspect the repository and report the resolved path.
- If version files disagree before work starts, report the mismatch before
  changing version-related files. If the intended target version is ambiguous,
  stop and ask for clarification.
- After any version-related change, report:
  - canonical version from `package.json`
  - all synchronized files and the version found in each
  - files intentionally not changed and why
  - commands used for version scanning
  - build/test validation performed
  - any remaining mismatch or risk

## Session-Close Workflow

- Default session-close behavior:
  - commit the current work branch (`feature/*`) with `git add -A` and a
    meaningful English commit message
  - push the work branch to `origin`
  - run the narrowest relevant validation from the repository root when `.ts`,
    `.tsx`, `.js`, `.jsx`, grammar, snippet, theme, package, or extension
    metadata files changed
  - if that validation succeeds, or was skipped because no relevant application
    files changed, update the active `release/*` branch to match the work branch
  - if no suitable release branch exists or no release branch is in scope,
    report that and skip the release update unless the user explicitly asks to
    create or update one
  - prefer fast-forward updates for the release branch
  - if fast-forward is not possible, ask explicitly before using
    `--force-with-lease`
  - push the updated release branch

## Code Rules

- Code comments must be in English.
- Identifiers and function names must be in English.
- Error and log messages must be in English.
- Emojis are forbidden in code, comments, logs, and generated outputs.
- Favor small, coherent changes over broad speculative refactors.
- Keep formatter-facing, grammar-facing, VS Code API-facing, and
  configuration-sensitive changes conservative.

## Documentation Exception

- Markdown prose is exempt from task-pane or console logging brevity rules.
- Markdown prose may use readable long-form tags such as `[WARNING]`, `[NOTE]`,
  and `[INFO]`.
- Code blocks inside Markdown are not exempt. Code examples and text log
  examples must still follow the global logging policy from this file.
- Documentation must still be written in English unless the user explicitly
  requests a different language for a specific document.

## Logging Policy

All source code, tests, scripts, and code blocks inside Markdown must follow
this policy.

- Log messages must use short ASCII-only severity tags:
  - `[E]` error
  - `[W]` warning
  - `[I]` info
  - `[D]` debug
  - `[T]` trace
- Long tags such as `[ERROR]`, `[WARNING]`, `[INFO]`, `[DEBUG]`, and
  `[SUCCESS]` are forbidden in code/log output.
- Verbose is not a severity level. Verbose controls whether logs are emitted;
  severity tags describe impact.
- Severity reassignment is allowed when technically justified.
- Log message updates are not public API renames.
- Keep log text semantically clear and as short as reasonably possible to
  reduce noise in task panes, console output, and diagnostics.
- Prefer common abbreviations such as `cfg`, `init`, `ok`, `fail`, `ctx`,
  `req`, `resp`, `wb`, `ws`, and `rng` where clarity remains intact.
- Do not repeat information already encoded by severity tags, module prefixes,
  or surrounding context.
- Formatter-, language-, extension-runtime-, and VS Code API-level logs are
  usually `[D]` or `[T]`. Use `[W]` for notable recoverable conditions and
  `[E]` for critical failures.

## Rename And Logging Interaction

- API renames and logging normalization are separate concerns.
- Do not mix logging normalization into API rename phases.
- Before any API rename, perform a full reference search with rg.
- After renaming, rerun rg to ensure old names do not remain in relevant
  project files such as `src/`, `src/test/`, `test/`, `docs/`, extension
  metadata, grammar, snippet, theme, and example/reference files when present.

## Tool Policy

- Prefer available VS Code or agent-workspace tools first when they fit the
  task.
- Prefer locally installed CLI tools next.
- Do not use unnecessarily heavy tools when simple search or inspection is
  enough.
- Known local tools on the user's Windows/PowerShell environment may include:
  - git
  - gh
  - rg
  - fd
  - jq
  - dasel
  - jc
  - 7z
  - pwsh
  - winget
  - choco
  - coreutils
  - node / npm / npx
  - pnpm / yarn when present
  - python
  - uv
- Preferred tools:
  - rg for text search, audits, and reference checks.
  - fd for file discovery, audits, and reference checks.
  - git for version-control inspection and explicit version-control actions.
  - npm, npx, pnpm, or yarn for package scripts, installs, version updates,
    and application validation flows when that package manager is already used
    by the repository.
  - gh for GitHub PRs, CI checks, issues, and project operations when
    available.
  - jq for JSON.
  - dasel for YAML, TOML, JSON, or XML inspection when it is the safest fit.
- Governance, policy, workflow, and agent searches MUST include hidden paths.
  Use `rg --hidden` and `fd --hidden`. Plain `rg ... .` or `fd ... .` is not
  sufficient for governance discovery.
- If governance files are known by path, read them directly instead of using
  repository-wide search.
- If rg or fd is missing, report that and give a simple install hint instead
  of silently using a weaker search path for audits or reference checks.
- When reporting search results, include the rg pattern and whether hidden
  paths were included when governance, policy, workflow, or agent files were
  in scope.
- Do not assume every listed tool is installed on every machine. If a required
  tool is missing, report the failed command clearly.
- Do not install or upgrade tools unless the user explicitly asks.
- On Windows, do not assume sed or awk are available. Prefer PowerShell-native
  commands unless availability was confirmed.
- Shell command quality:
  - Prefer simple robust commands over complex shell-escaped one-liners.
  - On Windows/PowerShell, prefer single quotes for regex/search patterns.
  - Avoid PowerShell backticks in search patterns unless required.
  - If quoting fails, retry once with safer quoting; do not repeat equivalent
    broken commands.
  - If quoting remains unclear, simplify, split the search, or read known
    files directly.
  - Do not treat failed commands as evidence about repository content.
  - Distinguish command failure, no matches, missing files, and missing tools
    in reports.
- Use dasel for YAML, TOML, JSON, or XML inspection and edits when it is the
  safest fit.
- Use jq for JSON.
- Use gh for GitHub operations when authenticated and available.
- Use 7z for archive inspection or extraction when needed.
- Use uv only when Python tooling is actually part of the task. Do not infer
  Python project workflows from the presence of uv.
- Do not mix jq and dasel syntax.
- Do not use deprecated dasel flags.
- Prefer structured tools over brittle text parsing when that reduces risk.
- Do not assume repository, branch, PR, project, or governance state. Verify
  repository state with git and gh, and verify governance state by explicitly
  reading the relevant governance files.

## Validation Baseline

- Use configured and enabled GitHub Actions or checks when they exist.
- Do not invent required CI workflows.
- If no enabled CI is configured, report that and rely on required local
  validation.
- Always run at least one focused TypeScript / VS Code extension validation
  after `.ts`, `.tsx`, `.js`, `.jsx`, grammar, snippet, theme, package, or
  extension metadata changes.
- Default validation check order:
  - `npm run lint` when present
  - `npm run typecheck` when present, otherwise `npm run compile` when present
  - `npm test` when present
  - `npm run build` when present, otherwise `npm run bundle` or
    `npm run vscode:prepublish` when relevant
- For affected examples, run the relevant example validation.
- If only Markdown or governance files changed, skip application validation
  unless the user asks for it.
- Governance-only changes require a governance consistency check, not
  application validation. A governance consistency check means reading the
  affected governance files and verifying that agent routing, shortcut rules,
  branch rules, tool policy, validation rules, version rules, and reporting
  rules do not contradict each other.
- If tests are affected, run the relevant test command for at least one
  relevant workspace or package when available.
- Run relevant tests when tests are present and affected.
- Docker or image builds are not required unless configured in this repository
  or explicitly in scope.
- If a required validation cannot run, report that plainly.

## Mandatory Reporting

After file-changing work, report:

- branch used
- governance files read, when governance, workflow, branch, PR, merge,
  release, validation, version, or cleanup rules were in scope
- files changed
- concise summary of what changed
- validation run
- skipped validation with reason
- remaining risks or blockers

Inspect relevant diffs before reporting file-changing work. Do not paste full
diffs unless the user explicitly asks. Prefer `git diff --stat`, changed file
lists, and focused summaries. Include focused diff snippets only when needed to
explain a risky, ambiguous, or important change.

## Final Rule

- Never mark an issue as solved or fixed until the user explicitly confirms it
  works.
