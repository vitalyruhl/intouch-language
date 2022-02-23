import * as assert from 'assert';
// import * as vscode from 'vscode';

const fo = require("../../formats")
const functions = require("../../functions")
let config = functions.getConfig()


describe('test formats.ts', () => {
  it('Ground Format #1', () => {
    const testString = 'test String'
    const toBeString = 'test String'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });
});

