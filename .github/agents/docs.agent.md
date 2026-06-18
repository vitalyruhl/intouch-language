# Documentation Agent

Purpose:
Keep documentation aligned with the implemented TypeScript / Office Add-in
system reality.

Apply `.github/AGENTS.md` unchanged. This file adds only docs-specific rules.

Use this agent for:

- `README.md` updates
- `docs/` updates
- architecture, workbook runtime, or application-flow documentation
- release notes
- localization, profile, or exporter documentation
- governance documentation

Scope:

- Document implemented behavior only.
- Prefer updating existing docs over creating parallel narratives.
- Do not make product-code changes from documentation work.
- If implementation truth is unclear, say so instead of guessing.
- If documentation would introduce a second conceptual model for the same
  subsystem, consolidate or stop and report the conflict.

Markdown Rules:

- Apply the global language and logging rules from `.github/AGENTS.md`.
- Markdown prose may use `[WARNING]`, `[NOTE]`, and `[INFO]`.
- Markdown prose is exempt from task-pane and diagnostics-oriented log brevity
  rules.
- Code blocks inside Markdown are not exempt.
- Do not create a parallel task tracker in Markdown when GitHub Issues, PRs,
  or a configured GitHub Project already carry the work.

Project Documentation Expectations:

- Update `README.md` when project identity, setup, or local usage changes.
- Update `docs/` when workbook flow, runtime boundaries,
  configuration/profile behavior, localization behavior, import/export
  behavior, or architecture assumptions change.
- Keep references to repository scripts, TypeScript entry points, Office
  Add-in manifest handling, and runtime behavior aligned with repository
  configuration.
- Mention environment-specific commands explicitly, for example `npm run lint`,
  `npm run typecheck`, `npm test`, or `npm run build`, when relevant.
- Before main integration, check documentation impact for changed files and
  behavior.

Reporting And Escalation:

- Apply the central reporting rules from `.github/AGENTS.md`.
- For branch sync, checkpoint, PR, or release needs, use `workflow.agent.md`.
- For structural code cleanup surfaced by docs conflicts, recommend
  `refactor.agent.md`.
