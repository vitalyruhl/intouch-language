# Conventions

- Repository governance artifacts are English even when chat is German.
- Keep code comments, log/error text, identifiers, governance, GitHub text, and generated repo artifacts in English unless explicitly requested otherwise.
- Preserve user edits; never revert or overwrite without explicit request.
- Governance changes must preserve imported rule intent and structure unless owner approves consolidation or removal.
- VS Code extension behavior spans package contributions, TextMate grammar, snippets, theme generation, formatter logic, and tests; validate the affected path rather than assuming app-only behavior.
- Formatter fixtures in `src/test/suite/testfiles/` are expected outputs; update only with intentional formatter behavior changes.