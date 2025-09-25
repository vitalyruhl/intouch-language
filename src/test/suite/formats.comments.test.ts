import * as assert from "assert";
// import * as vscode from "vscode";

const fo = require("../../formats")
const functions = require("../../functions")
let config = functions.getConfig()


suite('formats.comments comment handling (should not reformat inside)', () => {

  test('simple multiline comment', () => {
    const testString = "\r\n{\r\n first line\r\n second line\r\n third line\r\n}";
    const toBeString = testString; // formatter should not alter internals
    assert.equal(fo.preFormat(testString, config), toBeString);
  });

  test('dashes in comment', () => {
    let testString = '{-------------------------------------------}'
    let toBeString = '{-------------------------------------------}'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });

  test('code-looking tokens stay untouched inside comment', () => {
    const testString = "\r\n{Formating-Test comment - comment wil be ignoredl not be formatted -\r\n  if the \"if\" is big after Formatting, then we know the code is wrong...\r\n  if a==b then C=a; endif;\r\n}";
    const toBeString = testString;
    assert.equal(fo.preFormat(testString, config), toBeString);
  });
});

