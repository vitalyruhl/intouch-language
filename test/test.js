
import { runTests } from '@vscode/test-electron';
import * as vscode from 'vscode';

async function go() {
try {

const editor = new TextEditor();
const testEditor = await new editor.EditorView().openEditor('testEditor.vbi')

const testString = "c=a+b +d- e+ f -g - x;{folowing comment not formated! -> c=a+b +d - e+ f;}"
const toBeString = "c = a + b + d - e + f -g - x;{folowing comment not formated! -> c=a+b +d - e+ f;}"
await testEditor.setText(testString)

test('basic test',() => {
    expect(testEditor.formatDocument()).toBe(toBeString)
})


} catch (err) {
    console.error('Failed to run tests')
    process.exit(1)
}

}

go();