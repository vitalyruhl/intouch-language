import * as assert from "assert";
// import * as vscode from "vscode";

const fo = require("../../formats")
const functions = require("../../functions")
let config = functions.getConfig()


suite('test formats.ts - Test as Own', () => {
  test('Ground Format #1', () => {
    const testString = 'test String'
    const toBeString = 'test String'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });
});

suite('test formats.ts - Format signs', () => {

  test('Format signs as own', () => { //! '-g' is a bug! Shall be '- g'
    let testString = 'c=a+b +d- e+ f -g - x;{following comment not formatted! -> c=a+b +d - e+ f;}'
    let toBeString = 'c = a + b + d - e + f -g - x;{following comment not formatted! -> c=a+b +d - e+ f;}'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

  test('no space on -/+ before Number!', () => {
    let testString = 'SYS_Anlage = -1;{fixed 2021.10.29: no space on -/+ before Number!}'
    let toBeString = 'SYS_Anlage = -1;{fixed 2021.10.29: no space on -/+ before Number!}'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

  test('dashes in variable shall not be formatted', () => {
    let testString = 'new12-issue-dashed-variable-123 = "this variable shall not be formatted"'
    let toBeString = 'new12-issue-dashed-variable-123 = "this variable shall not be formatted"'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });
});

suite('test formats.ts - equals... ', () => {

  test('== / =', () => { 
    let testString = 'IF foo==bar THEN  baz=foo;ENDIF;'
    let toBeString = 'IF foo == bar THEN  baz = foo;ENDIF;'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

  test('<=', () => { 
    let testString = 'IF foo <=bar THEN  baz =foo;ENDIF;'
    let toBeString = 'IF foo <= bar THEN  baz = foo;ENDIF;'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

  test('<>', () => { 
    let testString = 'IF foo<> bar THEN  baz = foo;ENDIF;'
    let toBeString = 'IF foo <> bar THEN  baz = foo;ENDIF;'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

  test('=>', () => { 
    let testString = 'IF foo=> bar THEN  baz= foo; ENDIF;'
    let toBeString = 'IF foo => bar THEN  baz = foo; ENDIF;'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

});
