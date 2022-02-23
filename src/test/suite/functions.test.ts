import * as assert from "assert";
import * as vscode from "vscode";

const fu = require("../../functions");
// import {cloneArray} from "../functions"

suite("test functions.ts", () => {
  vscode.window.showInformationMessage("Start all functions.ts tests.");

  test("test clone array", () => {
    const arr = [1, 2, 3];
    assert.deepEqual(fu.cloneArray(arr), arr);
    assert.notEqual(fu.cloneArray(arr), arr);
  });
});
