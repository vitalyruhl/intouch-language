import * as assert from "assert";
// import * as vscode from "vscode";

const fo = require("../../formats")
const functions = require("../../functions")
let config = functions.getConfig()


suite('formats.misc basic smoke tests', () => {
  test('Ground format #1 (no change)', () => {
    const testString = 'test String'
    const toBeString = 'test String'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });
});

suite('formats.misc operator spacing', () => {

  test('Operator spacing (binary minus before variable spaced)', () => { // '-g' is a bug: should become '- g'
    let testString = 'c=a+b +d- e+ f -g -x + d-a-s-h-e-d-V-a-r; {following comment not formatted! -> c=a+b +d - e+ f;}'
    // Expected now reflects fix: binary minus before variable must have trailing space -> '- g'
    let toBeString = 'c = a + b + d - e + f - g - x + d-a-s-h-e-d-V-a-r; {following comment not formatted! -> c=a+b +d - e+ f;}'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });

  test('no space on -/+ before Number!', () => {
    let testString = 'a = -1;'
    let toBeString = 'a = -1;'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });

  test('dashes in variable shall not be formatted', () => {
    let testString = 'new1-2-issue-dashed-variable-12-3 = "this variable -shall- not - +be formatted the string please too -+123"'
    let toBeString = 'new1-2-issue-dashed-variable-12-3 = "this variable -shall- not - +be formatted the string please too -+123"'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });
});

suite('formats.misc double operator spacing', () => {

  test('== / =', () => {
    let testString = 'IF foo==bar THEN  baz=foo; ENDIF;'
    let toBeString = 'IF foo == bar THEN  baz = foo; ENDIF;'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });

  test('<=', () => {
    let testString = 'IF foo <=bar THEN  baz =foo; ENDIF;'
    let toBeString = 'IF foo <= bar THEN  baz = foo; ENDIF;'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });

  test('<>', () => {
    let testString = 'IF foo<> bar THEN  baz = foo; ENDIF;'
    let toBeString = 'IF foo <> bar THEN  baz = foo; ENDIF;'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });

  test('>=', () => {
    let testString = 'IF foo>= bar THEN  baz= foo; ENDIF;'
    let toBeString = 'IF foo >= bar THEN  baz = foo; ENDIF;'
  assert.equal(fo.preFormat(testString,config),toBeString)
  });

});
