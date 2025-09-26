import * as assert from 'assert';

const fo = require('../../formats');
const functions = require('../../functions');
let config = functions.getConfig();


suite('test formats.ts - EOF Handling', () => {
  test('Keep final ENDIF without trailing newline', () => {
    // No final CRLF here intentionally.
    const input = 'IF a == b THEN\n  c = a;\nENDIF';

  // Same order as production pipeline: first preFormat (keywords/operators) then formatNestings (indentation)
    const mid = fo.preFormat(input, config);
    const output = fo.formatNestings(mid, config);

    assert.ok(/ENDIF\s*$/.test(output), 'ERROR: Last line is not preserved: "' + output + '"');
  });

  test('Keep final ENDIF with trailing CRLF (control case)', () => {
    const input = 'IF a == b THEN\n  c = a;\nENDIF\r\n';
    const mid = fo.preFormat(input, config);
    const output = fo.formatNestings(mid, config);
    assert.ok(/ENDIF\r?\n?$/.test(output), 'ERROR: Last line is not preserved with CRLF: "' + output + '"');
  });
});
