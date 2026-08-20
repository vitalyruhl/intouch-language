# Manual QuickScript HIL

## Purpose

This checklist validates the local extension against real, user-selected
`.vbi` and `.vi` files. Automated fixtures cannot confirm compatibility with
the user's production QuickScript corpus, so completion of this checklist is a
manual release gate.

## Preparation

1. Keep an untouched backup or use disposable copies of the real files.
2. Build the local extension with `npm run vscode:prepublish`.
3. Start the Extension Development Host with the repository's VS Code launch
   configuration, or install the locally generated VSIX from `npm run makePackage`.
4. Open one representative `.vbi` and one representative `.vi` file and verify
   that the language mode is `Intouch`.

## Language-server checks

For each file:

1. Confirm that activation completes without an extension-host or language
   server error.
2. Open the Outline view and confirm that local `DIM` variables and nested
   `IF`, `FOR`, and evidenced `WHILE` blocks appear with plausible ranges.
3. Trigger completion in code and verify representative keywords, datatypes,
   InTouch functions, Hermes helpers, local variables, and existing `CALL`
   targets.
4. Hover a local variable, a known native InTouch function, and a workspace
   QuickFunction;
   verify that unknown project identifiers do not receive invented details.
5. Use Go to Definition and Find All References on a local `DIM` variable.
   Confirm that results stay within the document and do not jump to unrelated
   member fields or similarly named identifiers.
6. Review diagnostics. Confirm that valid files do not show false missing-block,
   duplicate-local, or datatype errors.

## Formatter safety checks

Use disposable copies and review the full diff after formatting:

1. Run **Format Document** once.
2. Confirm expected keyword casing, operator spacing, comma/semicolon spacing,
   blank-line policy, and indentation for nested `IF`/`ELSE`/`ENDIF`,
   `FOR`/`NEXT`, and configured comment/region blocks.
3. Confirm that string contents, brace-comment contents, apostrophe-comment
   contents, dashed identifiers, instance prefixes, UNC paths, and a final line
   without a newline retain their meaning and content.
4. Confirm that inline `IF ... ENDIF`, `EXIT FOR`, multiline IF expressions,
   and incomplete trailing statements are not dropped or structurally moved.
5. Run **Format Document** a second time and confirm that it produces no diff.

## Diagnostic recovery check

In a separate disposable document, introduce one case at a time:

- an `IF` without `ENDIF`;
- a `FOR` without `NEXT`;
- an unexpected `ELSE`, `ENDIF`, or `NEXT`;
- a duplicate local `DIM` name with different casing;
- an unknown datatype.

Confirm that the expected diagnostic appears at a useful range, later symbols
and completion remain available, and removing the error clears the diagnostic.

## Result recording

Record the tested file types, representative constructs, any formatter diff,
and pass/fail status. Do not merge, publish, tag, or release until the user
confirms this HIL gate. A HIL correction round may explicitly require a new
locally committed patch version for its uniquely identifiable VSIX artifact.

## 2026-08-20 manual HIL round 1

Status: `MANUAL HIL ROUND 1: FAIL – FIXABLE FINDINGS`.

- F1 LOW: The visible copyright range still ended in 2025.
- F2 HIGH: Standalone `{>` / `{<}` comment-nesting markers caused the tokenizer
  to treat the enclosed content as one brace comment, so the formatter skipped
  the required extra indentation.
- F3 HIGH: Unknown `CALL` targets were not resolved or diagnosed.
- F4 HIGH: Unknown function calls in expressions were not resolved or
  diagnosed.

Confirmed checks from the manual run:

- PASS: language id is `intouch`.
- PASS: the language-server diagnostic pipeline is active.
- PASS: unknown datatype diagnostics are visible.
- PASS: general formatting outside extra nesting looked plausible in the
  sampled file.

The local fix build for the retest uses package version `1.5.1` and the
expected file name `intouch-language-1.5.1.vsix`. This is an HIL artifact only:
there is no tag, publish, Marketplace release, GitHub release, or merge to
`main`.

Artifact created on 2026-08-20:

- Path: `intouch-language-1.5.1.vsix`
- Size: 221154 bytes
- SHA-256: `5A2394245744E0790AD9151F513A4F62E1A8DCE9F497BE733F569D0764435428`
