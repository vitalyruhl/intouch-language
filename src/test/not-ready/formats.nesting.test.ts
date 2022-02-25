import * as assert from "assert";
// import * as vscode from "vscode";

const fo = require("../../formats")
const functions = require("../../functions")
let config = functions.getConfig()

suite('test formats.ts - Nestings...', () => {

  test('Test wrong Nesting', () => {
    // let testString = '{Test wrong Nesting}\r\nIF sys > 0 THEN sys + 1; ENDIF;\r\n    IF sys > 0 THEN sys + 1; ENDIF;\r\n       IF sys > 0 THEN sys + 1; ENDIF;\r\n          IF sys > 0 THEN sys + 1; ENDIF;\r\n{------------------}'
    // let toBeString = '{Test wrong Nesting}\r\nIF sys > 0 THEN sys + 1; ENDIF;\r\nIF sys > 0 THEN sys + 1; ENDIF;\r\nIF sys > 0 THEN sys + 1; ENDIF;\r\nIF sys > 0 THEN sys + 1; ENDIF;\r\n{------------------}'
    let testString = `
IF a == b THEN c = a ENDIF;
    IF a == b THEN c = a ENDIF;
  IF a == b THEN c = a ENDIF;`

    let toBeString = `
IF a == b THEN c = a ENDIF;
IF a == b THEN c = a ENDIF;
IF a == b THEN c = a ENDIF;`
    
    // let zws = fo.forFormat(testString,config)
    assert.equal(fo.formatNestings(testString,config),toBeString)
  });

});

