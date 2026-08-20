# QuickScript Document Metadata

## Purpose and syntax boundary

QuickScript document metadata describes the script container around executable
QuickScript. It is stored inside an ordinary brace comment and is not native
QuickScript syntax. The tokenizer emits the complete block as comment trivia;
the metadata extractor is a separate consumer of that same lossless comment
token.

```text
{>
@ScriptType QuickFunction
@Name GetSomething
@Description Returns something useful.
@Param Source MESSAGE Source value.
@Param Index INTEGER Requested index.
@Returns MESSAGE
{<}
```

Metadata text cannot produce parser or semantic diagnostics as executable code.
Metadata-specific diagnostics use the `intouch-metadata` source. Formatting may
move the whole comment block to its structural indentation while preserving its
content and relative internal indentation.

## Canonical document types

The editor-independent core model supports these canonical script types:

- `QuickFunction`: a callable workspace function;
- `DataChange`: a data-change script with optional trigger metadata;
- `Condition`: a condition script with optional trigger and condition event;
- `Application`: an application script;
- `Window`: a non-callable window event script;
- `KeyScript`: a non-callable canonical InTouch shortcut script;
- `Generic`: valid QuickScript without a more specific classification;
- `Unknown`: structured metadata named a script type that is not yet modeled.

`KeyScript` is an InTouch document type, not a project-specific helper type.
Its shortcut is modeled separately from executable QuickScript.

## Explicit fields

Field names are matched case-insensitively. The canonical spellings below are
recommended. Leading and trailing horizontal whitespace is ignored; field
values are otherwise preserved.

| Field | Value |
| --- | --- |
| `@ScriptType` | One canonical script type listed above. |
| `@Name` | Document, function, window, or script name. |
| `@Description` | One-line sourced description. |
| `@Event` | Window event, or a sourced Application/Condition event. |
| `@Trigger` | DataChange/Condition trigger symbol. |
| `@Shortcut` | KeyScript shortcut such as `Ctrl+d`. |
| `@Param` | `Name TYPE Description...`; description is optional. |
| `@Returns` | QuickFunction return datatype. |

The initial parameter datatypes are `DISCRETE`, `INTEGER`, `MESSAGE`, and
`REAL`. Parameters remain ordered. The model contains enough signature data for
completion and hover. LSP Signature Help is intentionally deferred until a
separate provider is implemented.

Unknown `@` fields produce the informational `unknown-metadata-field`
diagnostic. Missing or malformed values produce `invalid-metadata-value`.
Unknown explicit script types produce `invalid-script-type`.

## Window scripts

Only these Window events are canonical in the initial model:

- `OnShow`;
- `WhileRunning`;
- `OnClose`.

```text
{>
@ScriptType Window
@Name MainOverview
@Event OnShow
@Description Initializes the window when it is opened.
{<}
```

Event values are matched case-insensitively and normalized to the canonical
spelling. Other Window events produce `invalid-window-event`. A Window script
is indexed as a non-callable Window container plus a WindowEvent symbol, so its
name does not resolve `CALL MainOverview()` and is not offered as a function
completion. A Window return type conflicts with its document type.

Duplicate Window-event diagnostics are deliberately deferred. Versioned or
backup exports cannot yet be distinguished reliably enough to avoid false
positives. Documents with explicit Window metadata are still grouped by Window
name and event in the workspace symbol model.

## KeyScripts

A KeyScript can use explicit metadata:

```text
{>
@ScriptType KeyScript
@Name OpenPrintWindow
@Shortcut Ctrl+d
{<}
```

Legacy `Type: KeyScript` and `Shortcut:` fields are also supported. KeyScripts
appear as non-callable document symbols and never enter QuickFunction
resolution or completion.

## Legacy header compatibility

Structured classic headers remain supported:

```text
{>
Script:
Type: QuickFunction
Name: GetSomething

Parameters:
Message Source
Integer Index
{<}
```

The extractor recognizes structured legacy labels only in a comment containing
`Script:` or a `Type:` plus an identity field. Supported real-corpus mappings
include:

- `QuickFunction` -> `QuickFunction`;
- `datachange` -> `DataChange`, with `Tagname[.field]:` as its trigger;
- `ConditionalScript` -> `Condition`, with `Condition:` as its trigger and
  `Condition Type:` as its sourced event;
- `ApplicationScript` -> `Application`;
- `KeyScript` -> `KeyScript`, with `Shortcut:` as its shortcut.

Legacy parameter lines use `TYPE Name Description...`. Arbitrary comments that
merely contain words such as `function`, `window`, or `script` are not metadata.

## Source priority and conflicts

Each field follows this priority:

1. explicit `@` metadata;
2. structured classic headers;
3. unambiguous InTouch export metadata when a separate source becomes
   available;
4. filename fallback;
5. `Generic` or `Unknown`.

The current real corpus represents export context through structured classic
headers, so there is no separate non-comment export source yet. The canonical
model reserves that source without guessing one.

When explicit and legacy values disagree, the explicit value wins and a
warning-level `metadata-conflict` identifies the lower-priority value. Known
field/type incompatibilities also use `metadata-conflict`; they are never
QuickScript syntax errors.

Filename conventions are fallback hints only. In the absence of structured
metadata, `QF_`, `DCH_`, `CS_`, `APP_`, and `KEY_` can classify a document and
remove a trailing numeric version. Metadata always overrides the filename.

## Workspace behavior

The language server incrementally indexes `.vbi` and `.vi` documents by URI.
Each entry retains canonical metadata, symbol kind, callability, definition
range, and call references. A QuickFunction declared in
`SomethingCompletelyDifferent.vbi` is therefore resolved by `@Name`, without a
`QF_` prefix.

Workspace QuickFunctions provide cross-file diagnostics, completion, hover,
definition, and references. A workspace definition has richer information and
takes precedence over a static native or Hermes catalog entry with the same
name. Duplicate QuickFunction definitions produce deterministic duplicate and
ambiguity diagnostics; definition requests never choose an arbitrary file.

Trigger metadata is represented as a semantic reference without inventing a
global-variable definition or producing an `unknown-variable` diagnostic.
Project-wide tag-dictionary indexing remains outside this metadata block.
