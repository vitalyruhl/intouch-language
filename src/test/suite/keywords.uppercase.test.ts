import * as assert from 'assert';
import { preFormat } from '../../formats';
const functions = require('../../functions');
const config = functions.getConfig();

const KEYWORDS = [
  'mod','and','not','is','or','xor','to','shl','shr','sqr','sin','cos','tan','atn','exp','log','int','frac','round','rnd','sqrt',
  'as','if','endif','else','while','for','next','dim','then','exit','each','step','in','return','call'
];

suite('keyword uppercasing', () => {
  test('uppercases each standalone keyword', () => {
    const input = KEYWORDS.join('\r\n') + '\r\n';
    const out = preFormat(input, config).split(/\r?\n/);
    KEYWORDS.forEach((kw, idx) => {
      const expected = kw.toUpperCase();
      assert.equal(out[idx], expected, `Keyword ${kw} should become ${expected}`);
    });
  });

  test('does not uppercase substrings inside identifiers', () => {
    const tricky = 'ifVar\nendifVar\nelseVar\nwhileVar\nforVar\nnextVar\ndimVar\nthenVar\nexitVar\n';
    const out = preFormat(tricky, config);
    assert.ok(/ifVar/.test(out), 'ifVar should remain unchanged');
    assert.ok(/endifVar/.test(out), 'endifVar should remain unchanged');
    assert.ok(/elseVar/.test(out), 'elseVar should remain unchanged');
  });
});
