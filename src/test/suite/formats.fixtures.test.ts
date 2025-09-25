import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
// Use the same formatting pipeline as the real editor command: forFormat -> formatNestings -> empty line normalization.
const fo = require('../../formats');
const functions = require('../../functions');
let config = functions.getConfig();

// Automatically validate every pair *.test.vbi -> *.tobe.vbi in testfiles folder.
// A pair is considered if a corresponding .tobe.vbi exists.

function findProjectRoot(start: string): string {
  let dir = start;
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dir;
}

suite('formatter fixture pairs (*.test.vbi -> *.tobe.vbi)', () => {
  // Determine project root based on presence of package.json to be resilient inside VS Code test harness.
  const projectRoot = findProjectRoot(__dirname);
  const baseDir = path.join(projectRoot, 'src', 'test', 'suite', 'testfiles');
  if (!fs.existsSync(baseDir)) {
    console.warn('No testfiles directory found at', baseDir);
    return;
  }
  const entries = fs.readdirSync(baseDir).filter(f => f.endsWith('.test.vbi'));
  entries.forEach(testFile => {
    const expectedFile = testFile.replace('.test.vbi', '.tobe.vbi');
    const expectedPath = path.join(baseDir, expectedFile);
    const testPath = path.join(baseDir, testFile);
    if (!fs.existsSync(expectedPath)) {
      console.warn(`Skipping ${testFile} because expected file ${expectedFile} is missing.`);
      return;
    }

    test(`fixture: ${testFile}`, () => {
      const input = fs.readFileSync(testPath, 'utf8');
      const expected = fs.readFileSync(expectedPath, 'utf8');

      // Stage 1: keyword/operator spacing & semicolon/trailing whitespace normalization
      let stage1 = fo.forFormat(input, config);
      // Stage 2: nesting / indentation logic
      let stage2 = fo.formatNestings(stage1, config);
      // Stage 3: replicate empty line reduction exactly like functions.format()
      const nEL: number = (config.allowedNumberOfEmptyLines || 1) + 1.0;
      if (config.RemoveEmptyLines) {
        let regex: RegExp;
        if (config.EmptyLinesAlsoInComment) {
          regex = new RegExp(`(?![^{]*})(^[\t]*$\r?\n){${nEL},}`, 'gm');
        } else {
          regex = new RegExp(`(^[\t]*$\r?\n){${nEL},}`, 'gm');
        }
        stage2 = stage2.replace(regex, '\r\n');
      }

      const actual = stage2;
      assert.equal(actual, expected, `Formatted output of ${testFile} differs from ${expectedFile}`);
    });
  });
});
