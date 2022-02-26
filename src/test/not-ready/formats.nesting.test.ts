import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as glob from "glob";
import * as fs from "fs";
const fu = require("../../functions");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function content(p, f = false) {
  //https://github.com/microsoft/vscode/blob/main/extensions/vscode-api-tests/src/singlefolder-tests/workspace.fs.test.ts
  await vscode.workspace.fs.readFile(vscode.Uri.file(p));
  await vscode.window.showTextDocument(vscode.Uri.file(p), { preview: false });
  if (f) {
    vscode.commands.executeCommand("editor.action.formatDocument");
  }
  const txt = vscode.window.activeTextEditor.document.getText;
  console.log(txt);

  return txt;
}

function getTestFiles(prefix: String) {
  const testsRoot = path.resolve(__dirname, "..");
  let testFiles = [];
  let search = `../../src/test/suite/testfiles/**${prefix}.test.vbi`;
  // console.log("search:", search);
  glob
    .sync(search, {
      ignore: ["**/node_modules/**"],
      cwd: testsRoot,
    })
    .map((f) => {
      let file = path.resolve(testsRoot, f);
      // console.log("File-Found:", file);
      testFiles.push(file);
    });

  // console.log("glob:testFiles:", testFiles);
  return testFiles;
}

// suite("test formats.ts - Nestings (PRE-TEST)", () => {
//   test("PRE-TEST", () => {
//     const arr = [1, 2, 3];
//     assert.deepEqual(fu.cloneArray(arr), arr);
//     assert.notEqual(fu.cloneArray(arr), arr);
//   });
// });

// suite("test formats.ts - Nestings", () => {
//   test("Test Nestings #01", async () => {
//     const Prefix = ".nesting";
//     let testFiles = getTestFiles(Prefix);
//     // console.log("nesting - testFiles:", testFiles);

//     for (let file in testFiles) {
//       await suite("test formats.ts - Nestings...", async () => {
//         console.log("test File:", testFiles[file]);
//         const testFile = await content(testFiles[file], true);
//         // const toBeFile = await content(file.replace(".test.vbi", ".tobe.vbi"), false);
//         const toBeFile = fs.readFileSync(
//           testFiles[file].replace(".test.vbi", ".tobe.vbi")
//         );

//         console.log("testFile:", testFile);
//         console.log("toBeFile:", toBeFile);

//         assert.equal(testFile, toBeFile);

//         // testFiles.map(async (file) => {});
//       });
//     }
//   });
// });

function add() {
  return Array.prototype.slice.call(arguments).reduce(function(prev, curr) {
    return prev + curr;
  }, 0);
}

describe('add()', function() {
  var tests = [
    {args: [1, 2],       expected: 3},
    {args: [1, 2, 3],    expected: 6},
    {args: [1, 2, 3, 4], expected: 10}
  ];

  tests.forEach(function(test) {
    it('correctly adds ' + test.args.length + ' args', function() {
      var res = add.apply(null, test.args);
      assert.equal(res, test.expected);
    });
  });
});

// beforeEach(function() {
//   return db.clear()
//     .then(function() {
//       return db.save([tobi, loki, jane]);
//     });
// });

// describe('#find()', function() {
//   it('respond with matching records', function() {
//     return db.find({ type: 'User' }).should.eventually.have.length(3);
//   });
// });
