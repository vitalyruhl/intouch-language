# Tech Stack

- TypeScript VS Code extension; extension manifest and contributions are in `package.json`.
- VS Code engine target currently `^1.104.0`.
- Build path: TypeScript compile to `out/`, theme generation via `src/index.js`, esbuild bundle to `dist/extension.js`.
- Test stack: Mocha plus `@vscode/test-electron`; Linux CI uses `xvfb-run -a npm test`.
- Lint stack: ESLint 9 with TypeScript ESLint packages; script is `npm run lint`.
- Package manager: npm; `package-lock.json` present and should stay aligned with `package.json`.
- Extension packaging/publishing uses `vsce` scripts (`makePackage`, `publish*`) when dependencies provide the tool.