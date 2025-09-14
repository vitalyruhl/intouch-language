import * as assert from 'assert';

// Re-Use bestehendes Muster aus anderen Tests
const fo = require('../../formats');
const functions = require('../../functions');
let config = functions.getConfig();

/*
  Dieser Test deckt den aktuellen Bug ab:
  - Wenn die Datei NICHT mit CRLF endet, wird die letzte Zeile (hier ENDIF) in der aktuellen Implementation
    potenziell beim Nesting-Formatting verloren gelassen, weil in formatNestings() mit
      for (let i = 0; i < codeFragments.length - 1; i++) {...}
    iteriert wird.
  Erwartetes Verhalten (nach Bugfix): Das finale 'ENDIF' bleibt erhalten.
  Momentaner Zustand: Test kann fehlschlagen – das ist beabsichtigt als TDD-Ausgangspunkt.
*/

suite('test formats.ts - EOF Handling', () => {
  test('Keep final ENDIF without trailing newline', () => {
    // Kein abschließendes CRLF!
    const input = 'IF a == b THEN\n  c = a;\nENDIF';

    // Reihenfolge wie im produktiven Code: erst Keyword/Operator Format, dann Nestings
    const mid = fo.forFormat(input, config);
    const output = fo.formatNestings(mid, config);

    // Erwartung: die Ausgabe enthält weiterhin genau ein letztes ENDIF (nicht verloren / nicht gedoppelt)
    // HINWEIS: Dieser Test SCHLÄGT DERZEIT FEHL (ROT) – das ist beabsichtigt und beweist den Bug.
    // Nach dem Bugfix in formatNestings() (Schleifen-Grenze + Handling finaler Zeile) soll er grün werden.
    assert.ok(/ENDIF\s*$/.test(output), 'Finales ENDIF fehlt oder wurde verändert: "' + output + '"');
  });

  test('Keep final ENDIF with trailing CRLF (control case)', () => {
    const input = 'IF a == b THEN\n  c = a;\nENDIF\r\n';
    const mid = fo.forFormat(input, config);
    const output = fo.formatNestings(mid, config);
    assert.ok(/ENDIF\r?\n?$/.test(output), 'Finales ENDIF fehlt bei Variante mit CRLF: "' + output + '"');
  });
});
