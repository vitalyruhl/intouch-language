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
4. Hover a local variable, a known InTouch function, and a known Hermes helper;
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
and pass/fail status. Do not change the extension version, merge, publish, or
release until the user confirms this HIL gate.
