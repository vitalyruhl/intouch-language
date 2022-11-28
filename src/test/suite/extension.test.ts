import * as assert from 'assert';
import * as vscode from 'vscode';


suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Temp Test to test mocha as own', () => {
		assert.strictEqual([1, 2, 3].indexOf(5), -1);
		assert.strictEqual([1, 2, 3].indexOf(0), -1);
	});
});
