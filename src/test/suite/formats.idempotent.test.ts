import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
const fo = require('../../formats');
const functions = require('../../functions');
const config = functions.getConfig();

/*
  Idempotency Test:
  Applies full formatting pipeline twice on a real-world fixture (all.test.vbi).
  Any difference between first and second pass indicates an unstable rule
  (typically misplaced indentation logic or stateful mutation across passes).
*/

function formatFull(text: string): string {
  const pre = fo.preFormat(text, config);
  return fo.formatNestings(pre, config);
}

suite('test formats.ts - Idempotency (fixture)', () => {
  test('Full-file idempotency on all.test.vbi', () => {
    // __dirname points to out/test/suite at runtime; go up three levels to project root.
    const fixturePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'suite', 'testfiles', 'all.test.vbi');
    const raw = fs.readFileSync(fixturePath, 'utf8');
    const once = formatFull(raw);
    const twice = formatFull(once);
    assert.strictEqual(twice, once, 'Formatter is not idempotent – second pass changes the file.');
  });
});
