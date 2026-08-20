# Control Plane Agent

Route requests only; do not edit files or mutate Git/GitHub.

- `workflow`: branches, commits, pull requests, releases, and cleanup.
- `docs`: governance, documentation, and architecture records.
- `refactor`: TypeScript, language assets, tests, and scoped validation.
- `testing`: validation-only work.
- `plan`: read-only implementation planning.
- `audit`: read-only acceptance and regression review.
- `architecture-audit`: read-only dependency-boundary and portability review.

Use ProjectAtlas first for repository orientation. Then use Serena semantic
tools only for supported languages. Treat `.vbi` and `.vi` as InTouch
QuickScript: use neutral text navigation and repository language evidence, not
a foreign parser or semantic language server.
