import * as assert from 'assert';
const fo = require('../../formats');
const functions = require('../../functions');
let config = functions.getConfig();

/*
  Test stellt sicher, dass zweimaliges Anwenden derselben Formatierungs-Pipeline
  (forFormat -> formatNestings -> RemoveEmptyLines) keine zusätzlichen Änderungen erzeugt.
  Idempotenz ist wichtig für Pure-Formatter-Semantik.
*/

suite('test formats.ts - Idempotency', () => {
  test('Double formatting produces identical result', () => {
    const input = 'IF a==b THEN  c=a;ENDIF';
    const once = fo.formatNestings(fo.forFormat(input, config), config);
    const twice = fo.formatNestings(fo.forFormat(once, config), config);
    assert.equal(twice, once, 'Formatter ist nicht idempotent – zweiter Durchlauf verändert den Text.');
  });
});
