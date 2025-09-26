# Modernization & Maintenance Plan Intouch-Language Extension (Status: 2025-09-14)

Goal: Update the extension, fix formatter bug (final "endif" disappears at end of file), improve code quality & stability, and use current VS Code / Node toolchain.

---

## 1. Acute Bug: Last `endif` (or any last line) disappears ✅ (Done)

**Symptom:** When formatting, a final `endif` sometimes disappears (especially if the file does not end with CRLF / blank line).

**Analysis Notes:**

- `formatNestings()` splits with `text.split(CRLF)` and iterates: `for (let i = 0; i < codeFragments.length - 1; i++) { ... }` — the LAST fragment line is intentionally skipped (due to `- 1`).
- At the end only up to `length - 1` is concatenated again: the actual last code line can be lost if there is no trailing CRLF.
- If the file is saved without a trailing newline the last line is effectively not re-added to `buf`.

**Minimal Fix Proposal:**

1. On split check whether the original text ends with CRLF. If not, process full length without loss.
2. Change loop condition to `for (let i = 0; i < codeFragments.length; i++)` and also include full length when reconstructing.
3. Optional: At the end add exactly ONE final newline consistently (`ensureFinalNewline`).

**Example (Before / After Pseudocode):**

```ts
// before
codeFragments = text.split(CRLF);
for (let i = 0; i < codeFragments.length - 1; i++) { /* ... */ }
...
for (let i = 0; i < codeFragments.length - 1; i++) { buf += codeFragments[i] + CRLF; }

// after
const hadFinalNewline = text.endsWith(CRLF);
codeFragments = text.split(CRLF);
for (let i = 0; i < codeFragments.length; i++) { /* ... */ }
...
for (let i = 0; i < codeFragments.length; i++) {
  // append last line only if (i < last) or hadFinalNewline
  if (i < codeFragments.length - 1 || hadFinalNewline) {
     buf += codeFragments[i] + CRLF;
  } else {
     buf += codeFragments[i];
  }
}
```

**Additionally:** Added unit test (`formats.eof.test.ts`): file without trailing CRLF containing final `ENDIF` → test passes after fix.

**Implemented on:** 2025-09-14

**Changes:**

- Loop conditions in `formatNestings` adjusted to full length.
- Reconstruction respects original trailing CRLF.
- New test covers both cases (with/without CRLF).

**Recommended Commit Message:**

```text
fix(formatter): preserve last line (ENDIF) when file has no trailing CRLF
```

---
## 2. Clean Separation: TextEdit return vs. Direct Edit ✅ (Done)

Current: `formatTE()` returns `TextEdit[]`, but `format()` additionally called `activeEditor.edit(...)` ⇒ duplicate / side-effect path.

**Desired (implemented):** Pure function behavior for formatter. Only `provideDocumentFormattingEdits` returns `TextEdit[]`. No direct editor access inside formatting functions.

**Changes:**

- `format()` now returns the string (no more `activeEditor.edit` side effects).
- `formatTE()` creates the `TextEdit` from the return value only.
- New test `formats.idempotent.test.ts` confirms idempotency.

**Recommended Commit Message:**

```text
refactor(formatter): make formatting pure and add idempotency test
```

**Example Before:**

```ts
if (formatted) {
  activeEditor.edit(e => e.replace(range, formatted));
}
return '';
```
**After:**
```ts
return formatted; // Caller baut daraus TextEdit
```

---

## 3. Consistent Line Endings & Robustness

Problem Sources: Explicit use of `CRLF`. On Linux/Mac formatting may become inconsistent.

**Improvement:**

- Detect document line ending via `document.eol` (VSCode API) and use dynamically.
- Work internally with `\n`, reapply target EOL on reconstruction.
- Offer setting: `VBI.formatter.lineEnding` (auto | LF | CRLF).

---

## 4. Simplify / Test Nesting Logic

Currently many regex & state flags (`thisLineBack`, `nestingCounterPrevious`). Error prone.

**Goals:**

- Extract into its own module (`nestingEngine.ts`).
- Data-driven stack instead of global counter (enables later error detection: unclosed `IF`).
- Unit tests for: simple IF, nested, regions, mixed blocks, comments, edge cases (keywords inside strings, `EXIT FOR`).

---

## 5. Simplify Keyword Uppercasing / Tokenizer

Current loop is char-by-char with `modified` flag → hard to maintain.

**Modernization:**

- Introduce tokenizer step: split into tokens (StringLiteral, Comment, Identifier, Operator, Whitespace).
- Only inspect identifiers → uppercase if in set.
- Removes many special cases (`modified`, manual whitespace re-emission).

**Example Sketch:**

```ts
for (const token of tokenize(text)) {
  if (token.type === 'identifier' && KEYWORDS_SET.has(token.value.toUpperCase())) {
     out += token.value.toUpperCase();
  } else {
     out += token.raw;
  }
}
```

---

## 6. Unify Configuration / Type Safety

`config: any` + repeated `workspace.getConfiguration()` calls.

**Improvement:**

- Define `FormatterConfig` interface.
- Single lazy load + subscribe to changes: `workspace.onDidChangeConfiguration`.
- Central validation.

**Example:**

```ts
interface FormatterConfig { allowedEmptyLines: number; removeEmpty: boolean; ... }
function loadConfig(): FormatterConfig { /* ... */ }
let currentCfg = loadConfig();
workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('VBI.formatter')) currentCfg = loadConfig(); });
```

---

## 7. Expand Tests

Current: Some tests exist, but no test for end-of-file / missing newline / lost tokens.

**New Test Cases:**

1. `EOF`: file ends directly after `ENDIF` without CRLF.
2. Mixed line endings (simulate) → no duplicates.
3. Comment blocks with `{region` / `{endregion`.
4. `EXIT FOR` inside nested FOR loops.
5. Strings containing operators (`"a==b"`) → operators inside remain unchanged.

---

## 8. Update Linting & Tooling
- TSLint is deprecated → recommend only ESLint (already in scripts, but no `.eslintrc.*`).
- Node / TypeScript versions: currently TS 4.9 – updating to >=5.5 useful (depends on VS Code engine).
- Add: `.editorconfig`, `.eslintrc.json`, optional `prettier` for consistency.

**Tasks:**

1. Add `.eslintrc.json` (extends `eslint:recommended`, `@typescript-eslint/recommended`).
2. Add script `lint:fix`.
3. Remove `ms-vscode.vscode-typescript-tslint-plugin` recommendation.

---

## 9. VS Code Engine & @types/vscode Update

Current: `"engines.vscode": "^1.73.1"` (Nov 2022). 2025 current LTS > 1.90.

**Plan:**
- Test against current API: update `@types/vscode` + engine (e.g. `^1.92.0`).
- CHANGELOG entry & major/minor bump (breaking due to minimum version).

---

## 10. Packaging & Security
- Check `vsce ls --yarn` / `npm audit` (dependencies).
- Signed publishing (if desired) via `vsce package --githubBranch main` (or keep master but adjust README).
- README: License should be more precise (GNU → specify version: GPL-3.0-only or -or-later).

---

## 11. Performance / Memory

Formatter reads full document as string.

**Improvement:** For very large files optionally stream / line-based (LOW priority) – current sizes likely fine.

---

## 12. API & Activation

Currently only `onLanguage:intouch`. Optional: command even without open file? → add `onCommand:vbi-format`.

**Example:**

```json
"activationEvents": [
  "onLanguage:intouch",
  "onCommand:vbi-format"
]
```

---

## 13. Documentation
- README: Add section "Known Issues" (EOF formatter bug -> fixed from version X).
- Contribution & test execution instructions.
- Link `TODO.md` or migrate into issues after completion.

---

## 14. Continuous Integration (CI)

Completely missing.

**Recommendation:** GitHub Actions Workflow `.github/workflows/ci.yml`:
- Matrix: Node 18 / 20.
- Steps: Install, Lint, Build, Test.

**Sketch:**

```yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix: { node: [18, 20] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node }} }
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

---

## 15. Telemetry / Logging

Currently: Custom output channel logging. Optional: structured debug flag; no PII – OK.

**Optional:** A global logger wrapper with level enum and guard.

---

## 16. Future Feature: Range Formatting

Currently whole document. Desire (per README): selection.

**Implementation:** Additionally register in `registerDocumentRangeFormattingEditProvider`:
```ts
vscode.languages.registerDocumentRangeFormattingEditProvider({ language: 'intouch' }, { provideDocumentRangeFormattingEdits(doc, range) { ... } });
```
Use the existing pure-format function on the range text.

---

## 17. More Robust Nesting Detection (Case-Insensitive + Word Boundaries)

Ensure keywords in variable names (e.g. `endifFlag`) are not matched.

**Regex Adjustment:** `\bIF\b`, `\bENDIF\b` etc. and tokenizer first.

---

## 18. Diagnostics / Error Reporting

Optional added value: use `vscode.DiagnosticCollection` for:
- Unclosed IF / FOR.
- Unexpected `ENDIF` / `NEXT`.

**Sketch:**

```ts
const diagnostics: vscode.Diagnostic[] = [];
if (stack.length > 0) diagnostics.push(new vscode.Diagnostic(new Range(...), 'Unclosed IF', DiagnosticSeverity.Warning));
collection.set(document.uri, diagnostics);
```

---

## 19. Standardize Automatic Changelog

Adopt `Keep a Changelog` + `npm version` hooks.

---

## 20. Developer Experience
- `npm run dev` → starts `watch` + `Extension Host` via `vsce` or `vscode-test`.
- Add scripts: `"lint:fix"`, `"test:watch"`.

---

## 21. License Clarification
`"license": "GNU"` is ambiguous. Suggest: `"license": "GPL-3.0-or-later"` and adjust `LICENSE` if needed.

---

## 22. Minimal Refactor Priority List

Order of execution:
1. Bugfix EOF (Section 1) + Pure Formatter (2).
2. Tests (7) for regression.
3. Config type safety (6) + keyword tokenizer (5).
4. Nesting refactor (4 + 17).
5. Line endings (3).
6. Lint/tooling update (8) + engine (9) + CI (14).
7. Range formatting (16) + diagnostics (18).
8. Docs & changelog (13 + 19 + 21).

---

## 23. Issue Mapping Proposal

| Section | Label | Description |
|--------|-------|-------------|
| 1 | bug | EOF `endif` loss |
| 2 | refactor | Pure formatter interface |
| 4/5 | enhancement | Tokenizer & nesting engine |
| 7 | test | New test cases |
| 8/9/14 | ci/tooling | Toolchain modernization |
| 16 | feature | Range formatting |
| 18 | feature | Diagnostics |
| 21 | license | License clarification |

---

## 24. Quick Win Commits (Recommended)
1. `fix(formatter): preserve last line (endif)`
2. `refactor(format): remove side-effect edits`
3. `test(formatter): add eof no-newline case`
4. `chore(tooling): add eslint config`
5. `feat(formatter): range formatting provider`

---

## 25. Example ESLint Config (Suggestion)
```json
{
  "root": true,
  "env": { "es2022": true, "node": true },
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "project": ["./tsconfig.json"], "sourceType": "module" },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

---

## 26. Example Test for EOF Bug
```ts
it('keeps final endif without trailing newline', () => {
  const input = 'IF a == b THEN\n  c = a;\nENDIF'; // no CRLF at end
  const formatted = formatNestings(forFormat(input, cfg), cfg);
  expect(formatted.endsWith('ENDIF')).to.be.true;
});
```

---

## 27. Migration Checklist (Short Form)
- [ ] EOF bug fixed
- [ ] Pure formatter
- [ ] New tests + CI
- [ ] ESLint integrated
- [ ] Engine version updated
- [ ] Tokenizer / nesting refactor
- [ ] Range formatting
- [ ] Diagnostics optional
- [ ] README / changelog / license updated

---

## 28. Risks / Edge Cases
- Files with mixed EOL (`\r\n` + `\n`) → normalize.
- Very large files → measure performance after refactor.
- Comments with `{` / `}` inside strings → tokenizer protects.
- Variables resembling keywords (`endifFlag`) → ensure word boundaries.

---

## 29. Optional Long Term
- Language Server (LSP) instead of pure extension-host code: enables hover, go-to definition (basic heuristics).
- Format On Type support (`onTypeFormatting` for `;` / newline).

---

## 30. Summary
Most important immediate step: correct loop conditions in `formatNestings`, implement pure-function approach and tests for end-of-file edge cases. Afterwards perform structured modernization (tooling + architecture) and optional features.

---
*(Generated automatically on 2025-09-14)*

## 31. Additions
- In the folder `errors` there are some files containing incorrect formatting; they should be reviewed and issues corrected.
- In IF statements sometimes <=, >=, == get split apart; this should also be reviewed and fixed.
- Variables are not recognized as such.

