# Modernisierung & Wartungsplan Intouch-Language Extension (Stand: 2025-09-14)

Ziel: Extension aktualisieren, Formatter-Bug ("endif" verschwindet am Dateiende) beheben, Codequalität & Stabilität erhöhen, aktuelle VS Code / Node Toolchain nutzen.

---
## 1. Akuter Bug: Letztes `endif` (oder andere letzte Zeile) verschwindet ✅ (Erledigt)
**Symptom:** Beim Formatieren verschwindet manchmal ein finales `endif` (insbesondere wenn die Datei nicht mit CRLF / Leerzeile endet).

**Analyse-Hinweise:**
- `formatNestings()` splittet mit `text.split(CRLF)` und iteriert: `for (let i = 0; i < codeFragments.length - 1; i++) { ... }` — die LETZTE Fragment-Zeile wird bewusst ausgelassen (wegen `- 1`).
- Am Ende wird erneut nur bis `length - 1` zusammengefügt: dadurch kann die tatsächliche letzte Codezeile verloren gehen, wenn kein abschließendes CRLF existiert.
- Falls die Datei ohne abschließenden Zeilenumbruch gespeichert ist, wird die letzte Zeile faktisch nicht wieder in `buf` aufgenommen.

**Fix-Vorschlag (minimal):**
1. Beim Split prüfen, ob der ursprüngliche Text mit CRLF endet. Falls nicht, Split ohne Verlust behandeln und gesamte Länge iterieren.
2. Schleifen-Bedingung ändern: `for (let i = 0; i < codeFragments.length; i++)` und beim Zusammenbau ebenfalls komplette Länge berücksichtigen.
3. Optional: Am Ende konsistent genau EINE abschließende Zeile hinzufügen (`ensureFinalNewline`).

**Beispiel (Before / After Pseudocode):**
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
  // letzte Zeile nur anhängen wenn (i < last) oder hadFinalNewline
  if (i < codeFragments.length - 1 || hadFinalNewline) {
     buf += codeFragments[i] + CRLF;
  } else {
     buf += codeFragments[i];
  }
}
```

**Ergänzend:** Unit-Test hinzugefügt (`formats.eof.test.ts`): Datei ohne End-CRLF mit finalem `ENDIF` → Test jetzt grün nach Fix.

**Implementiert am:** 2025-09-14

**Änderungen:**
- Schleifenbedingungen in `formatNestings` auf volle Länge angepasst.
- Rekonstruktion unter Berücksichtigung ursprünglichem finalen CRLF.
- Neuer Test deckt beide Fälle (mit/ohne CRLF) ab.

**Empfohlene Commit-Message:**
```
fix(formatter): preserve last line (ENDIF) when file has no trailing CRLF
```

---
## 2. Saubere Trennung: TextEdit Rückgabe vs. Direktes Edit ✅ (Erledigt)
Aktuell: `formatTE()` gibt zwar `TextEdit[]` zurück, aber `format()` ruft zusätzlich `activeEditor.edit(...)` auf ⇒ doppelter / seiteneffektbehafteter Pfad.

**Soll (umgesetzt):** Reines Pure-Function-Verhalten für Formatter. Nur `provideDocumentFormattingEdits` gibt `TextEdit[]` zurück. Kein direkter Editorzugriff in Format-Funktionen.

**Änderungen:**
- `format()` liefert jetzt string zurück (keine `activeEditor.edit` Seiteneffekte mehr).
- `formatTE()` erzeugt einzig die `TextEdit` aus dem Rückgabewert.
- Neuer Test `formats.idempotent.test.ts` bestätigt Idempotenz.

**Empfohlene Commit-Message:**
```
refactor(formatter): make formatting pure and add idempotency test
```

**Beispiel Before:**
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
## 3. Konsistente Line-Endings & Robustheit
Problemquellen: Explizite Nutzung von `CRLF`. Unter Linux/Mac kann Formatierung inkonsistent sein.

**Verbesserung:**
- Erkennen des Dokument-Line-Endings via `document.eol` (VSCode API) und dynamisch nutzen.
- Intern mit `\n` arbeiten, beim Rekonstruieren wieder Ziel-EOL anwenden.
- Setting anbieten: `VBI.formatter.lineEnding` (auto | LF | CRLF).

---
## 4. Nesting-Logik vereinfachen / testen
Aktuell viele Regex & Zustandsflags (`thisLineBack`, `nestingCounterPrevious`). Fehleranfällig.

**Ziele:**
- Extrahieren in eigene Klasse / Modul (`nestingEngine.ts`).
- Datengetriebener Stack statt globaler Counter (ermöglicht spätere Fehlererkennung: nicht geschlossenes `IF`).
- Unit-Tests für: einfache IF, verschachtelt, Regionen, gemischte Blocks, Kommentare, Edge Cases (unterbrochene Keywords in Strings, `EXIT FOR`).

---
## 5. Keyword-Uppercasing / Tokenizer vereinfachen
Aktuelle Schleife char-by-char + `modified` Flag → schwer wartbar.

**Modernisierung:**
- Tokenizer-Schritt: Split in Tokens (StringLiteral, Comment, Identifier, Operator, Whitespace).
- Nur Identifier prüfen → Uppercase wenn in Set.
- Entfernt viele Spezialfälle (`modified`, manuelles Zurückschreiben von Leerzeichen).

**Beispiel Sketch:**
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
## 6. Konfiguration vereinheitlichen / Typsicherheit
`config: any` + wiederholte `workspace.getConfiguration()` Aufrufe.

**Verbesserung:**
- Interface `FormatterConfig` definieren.
- Einmalige Lazy-Ladung + Veränderung abonnieren: `workspace.onDidChangeConfiguration`.
- Validierung zentral.

**Beispiel:**
```ts
interface FormatterConfig { allowedEmptyLines: number; removeEmpty: boolean; ... }
function loadConfig(): FormatterConfig { /* ... */ }
let currentCfg = loadConfig();
workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('VBI.formatter')) currentCfg = loadConfig(); });
```

---
## 7. Tests erweitern
Aktuell: Einige Tests vorhanden, aber kein Test für End-of-file / fehlenden Zeilenumbruch / verlorene Tokens.

**Neue Testfälle:**
1. `EOF`: Datei endet direkt nach `ENDIF` ohne CRLF.
2. Mixed line endings (simulate) → keine Duplikate.
3. Kommentarblöcke mit `{region` / `{endregion`.
4. `EXIT FOR` innerhalb verschachtelter FOR-Schleifen.
5. Strings mit Operatoren (`"a==b"`) → Operatoren innen unverändert.

---
## 8. Linting & Tooling aktualisieren
- TSLint ist deprecated → Empfehlung nur ESLint (bereits im Script, aber kein `.eslintrc.*`).
- Node / Typescript Versionen: aktuell TS 4.9 – Update auf >=5.5 sinnvoll (abhängig von VS Code Engine).
- Add: `.editorconfig`, `.eslintrc.json`, `prettier` optional für Konsistenz.

**Tasks:**
1. `.eslintrc.json` hinzufügen (extends `eslint:recommended`, `@typescript-eslint/recommended`).
2. Script `lint:fix` ergänzen.
3. Entferne `ms-vscode.vscode-typescript-tslint-plugin` Empfehlung.

---
## 9. VS Code Engine & @types/vscode Update
Aktuell: `"engines.vscode": "^1.73.1"` (Nov 2022). 2025 aktuelle LTS > 1.90.

**Plan:**
- Test gegen aktuelle API: Update `@types/vscode` + Engine (z.B. `^1.92.0`).
- CHANGELOG Eintrag & Major/Minor bump (Breaking durch Mindestversion).

---
## 10. Packaging & Security
- Prüfen auf `vsce ls --yarn` / `npm audit` (Abhängigkeiten). 
- Signierte Veröffentlichung (falls gewünscht) mit `vsce package --githubBranch main` (oder master beibehalten aber README angleichen).
- README: Lizenz sollte exakter sein (GNU → Angabe Version: GPL-3.0-only oder -or-later).

---
## 11. Performance / Speicher
Formatter liest komplettes Dokument als String.

**Verbesserung:** Für sehr lange Dateien optional streaming / Zeilenweise. (LOW Prio) – aktuelles Volumen vermutlich unkritisch.

---
## 12. API & Aktivierung
Aktuell nur `onLanguage:intouch`. Optional: Befehl auch ohne offene Datei? → `onCommand:vbi-format` ergänzen.

**Beispiel:**
```json
"activationEvents": [
  "onLanguage:intouch",
  "onCommand:vbi-format"
]
```

---
## 13. Dokumentation
- README: Ergänzen Abschnitt "Known Issues" (EOF Formatter Bug -> behoben ab Version X).
- Hinweise für Contribution + Testausführung.
- `TODO.md` verlinken oder nach Abarbeitung in Issues migrieren.

---
## 14. Continuous Integration (CI)
Fehlt komplett.

**Empfehlung:** GitHub Actions Workflow `.github/workflows/ci.yml`:
- Matrix: Node 18 / 20.
- Schritte: Install, Lint, Build, Test.

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
Derzeit: Eigenes Output-Channel Logging. Optional: Strukturiertes Debug Flag; keine PII – OK.

**Optional:** Ein globaler Logger Wrapper mit Level-Enum und Guard.

---
## 16. Future Feature: Selektives Formatieren
Momentan ganze Datei. Wunsch laut README: Auswahl.

**Implementierung:** In `registerDocumentRangeFormattingEditProvider` zusätzlich registrieren: 
```ts
vscode.languages.registerDocumentRangeFormattingEditProvider({ language: 'intouch' }, { provideDocumentRangeFormattingEdits(doc, range) { ... } });
```
Verwendung der existierenden Pure-Format Funktion auf Range-Text.

---
## 17. Robustere Nesting-Erkennung (Case-Insensitive + Wortgrenzen)
Sicherstellen, dass Keywords in Variablennamen (z.B. `endifFlag`) nicht greifen.

**Regex Anpassung:** `\bIF\b`, `\bENDIF\b` etc. und vorher Tokenizer.

---
## 18. Fehlermeldungen / Diagnostics
Optionaler Mehrwert: `vscode.DiagnosticCollection` nutzen für:
- Nicht geschlossenes IF / FOR.
- Unerwartetes `ENDIF` / `NEXT`.

**Sketch:**
```ts
const diagnostics: vscode.Diagnostic[] = [];
if (stack.length > 0) diagnostics.push(new vscode.Diagnostic(new Range(...), 'Unclosed IF', DiagnosticSeverity.Warning));
collection.set(document.uri, diagnostics);
```

---
## 19. Automatischer Changelog Standardisieren
Adoption von `Keep a Changelog` + `npm version` Hooks.

---
## 20. Developer Experience
- `npm run dev` → startet `watch` + `Extension Host` via `vsce` oder `vscode-test`.
- Hinzufügen von `scripts`: `"lint:fix"`, `"test:watch"`.

---
## 21. Lizenzpräzisierung
`"license": "GNU"` ist nicht eindeutig. Vorschlag: `"license": "GPL-3.0-or-later"` und `LICENSE` prüfen / anpassen.

---
## 22. Minimales Refactor Prioritätenliste
Reihenfolge zur Abarbeitung:
1. Bugfix EOF (Section 1) + Pure Formatter (2).
2. Tests (7) für Regression.
3. Config Typsicherheit (6) + Keyword Tokenizer (5).
4. Nesting Refactor (4 + 17).
5. Line-Endings (3).
6. Lint/Tooling Update (8) + Engine (9) + CI (14).
7. Selektives Formatieren (16) + Diagnostics (18).
8. Doku & Changelog (13 + 19 + 21).

---
## 23. Issue Mapping Vorschlag
| Sektion | Label | Beschreibung |
|--------|-------|--------------|
| 1 | bug | EOF `endif` Verlust |
| 2 | refactor | Pure Formatter Schnittstelle |
| 4/5 | enhancement | Tokenizer & Nesting Engine |
| 7 | test | Neue Testfälle |
| 8/9/14 | ci/tooling | Modernisierung Toolchain |
| 16 | feature | Range Formatting |
| 18 | feature | Diagnostics |
| 21 | license | Lizenzpräzisierung |

---
## 24. Quick Win Commits (Empfohlen)
1. `fix(formatter): preserve last line (endif)`
2. `refactor(format): remove side-effect edits`
3. `test(formatter): add eof no-newline case`
4. `chore(tooling): add eslint config`
5. `feat(formatter): range formatting provider`

---
## 25. Beispiel ESLint Config (Vorschlag)
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
## 26. Beispiel Test für EOF Bug
```ts
it('keeps final endif without trailing newline', () => {
  const input = 'IF a == b THEN\n  c = a;\nENDIF'; // kein CRLF am Ende
  const formatted = formatNestings(forFormat(input, cfg), cfg);
  expect(formatted.endsWith('ENDIF')).to.be.true;
});
```

---
## 27. Migrations-Checkliste (Kurzform)
- [ ] EOF Bug behoben
- [ ] Pure Formatter
- [ ] Neue Tests + CI
- [ ] ESLint integriert
- [ ] Engine Version aktualisiert
- [ ] Tokenizer / Nesting Refactor
- [ ] Range Formatting
- [ ] Diagnostics optional
- [ ] README / Changelog / Lizenz aktualisiert

---
## 28. Risiken / Edge Cases
- Dateien mit Misch-EOL (`\r\n` + `\n`) → Normalisieren.
- Sehr große Dateien → Performance messen nach Refactor.
- Kommentare mit `{` / `}` in Strings → Tokenizer schützt.
- Variablen, die wie Keywords aussehen (`endifFlag`) → Wortgrenzen sicherstellen.

---
## 29. Optional Langfristig
- Language Server (LSP) statt reinem Extension-Host Code: ermöglicht Hover, Go-to Definition (Basis Heuristiken).
- Format On Type Support (`onTypeFormatting` für `;` / Zeilenumbruch).

---
## 30. Zusammenfassung
Wichtigster Sofortschritt: Schleifen-Bedingungen in `formatNestings` korrigieren, Pure-Function-Ansatz einführen und Tests für End-of-File Edge Cases. Danach strukturierte Modernisierung (Tooling + Architektur) und optionale Features.

---
*(Erstellt automatisch am 2025-09-14)*



## 31. Ergänzungen
- im ordner errors liegen einige dateien die fehlerhafte formatierungen enthalten, diese sollten geprüft und fehler korrigiert werden.
- in if statement werden manchmal <=, >= ==, auseinander gerissen, dies sollte auch geprüft und korrigiert werden.
- Variablen werden nicht als solche erkannt.

