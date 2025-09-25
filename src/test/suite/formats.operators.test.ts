import * as assert from 'assert';
const fo = require('../../formats');
const functions = require('../../functions');
let config = functions.getConfig();

suite('test formats.ts - double operators spacing', () => {
  test('>= remains intact with spaces', () => {
    const input = 'IF ( a >= b ) THEN';
    const expected = 'IF ( a >= b ) THEN';
    assert.equal(fo.forFormat(input + '\n', config).trim(), expected);
  });

  test('<= remains intact with spaces', () => {
    const input = 'IF ( a <= b ) THEN';
    const expected = 'IF ( a <= b ) THEN';
    assert.equal(fo.forFormat(input + '\n', config).trim(), expected);
  });

  test('<> remains intact with spaces', () => {
    const input = 'IF ( a <> b ) THEN';
    const expected = 'IF ( a <> b ) THEN';
    assert.equal(fo.forFormat(input + '\n', config).trim(), expected);
  });

  test('== remains intact with spaces', () => {
    const input = 'IF ( a == b ) THEN';
    const expected = 'IF ( a == b ) THEN';
    assert.equal(fo.forFormat(input + '\n', config).trim(), expected);
  });
});
