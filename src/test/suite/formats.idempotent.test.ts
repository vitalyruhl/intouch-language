import * as assert from 'assert';
const fo = require('../../formats');
const functions = require('../../functions');
let config = functions.getConfig();

/*
  This test ensures applying the same formatting pipeline twice
  (preFormat -> formatNestings -> RemoveEmptyLines) yields no further changes.
  Idempotency is important for a pure formatter contract.
*/

suite('test formats.ts - Idempotency', () => {
  test('Double formatting produces identical result', () => {
    const input = 'IF a==b THEN  c=a;ENDIF';//todo, load the all.test.vbi for this test!
    const once = fo.formatNestings(fo.preFormat(input, config), config);
    const twice = fo.formatNestings(fo.preFormat(once, config), config);
    assert.equal(twice, once, 'Formatter is not idempotent – second pass changes the text.');
  });
});
