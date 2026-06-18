# Control Plane Agent

Purpose:
Route each task to the correct repository agent. This file contains
coordination rules only.

Rules:

- Read `.github/AGENTS.md` first.
- Read the available agent files under `.github/agents/`.
- Choose the agent matching the current step:
  - `workflow.agent.md` for branch, issue, pull request, merge, release,
    checkpoint, and cleanup workflows.
  - `docs.agent.md` for roadmap, project brief, architecture, migration,
    governance, README, and other documentation work.
  - `refactor.agent.md` for TypeScript / VS Code extension code changes,
    refactors, tests, and validation.
- Multi-stage tasks may move between agents sequentially as scope changes.
- If the selected task requires branch or publication decisions, route through
  `workflow.agent.md` before file-changing work starts.
- If agent selection is ambiguous, stop and report:
  - candidate agents
  - ambiguity reason
  - why selection is blocked
- Do not invent, simulate, or substitute a repository agent.
- Do not place project-specific code rules in this control-plane file.
