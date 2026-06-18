# Suggested Commands

- Inspect state: `git status --short --branch`, `git branch -vv -a`, `git remote -v`.
- File search on Windows/PowerShell: prefer `rg --files --hidden -g '!node_modules/**' -g '!.git/**'` and `rg --hidden -n '<pattern>' .` for governance/policy searches.
- Compile: `npm run compile`.
- Lint: `npm run lint`.
- Test: `npm test`; on Linux CI with display requirements use `xvfb-run -a npm test`.
- Bundle extension: `npm run bundle`.
- Full prepublish build path: `npm run vscode:prepublish`.
- Package extension: `npm run makePackage`.
- Regenerate formatter fixtures: `npm run update:fixtures` only when fixture changes are intended.