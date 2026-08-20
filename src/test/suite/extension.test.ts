import * as assert from 'assert';
import * as vscode from 'vscode';


suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Temp Test to test mocha as own', () => {
		assert.strictEqual([1, 2, 3].indexOf(5), -1);
		assert.strictEqual([1, 2, 3].indexOf(0), -1);
	});

	test('registers the formatter command through the language client', async () => {
		const extension = vscode.extensions.getExtension('Vitaly-ruhl.intouch-language');
		assert.ok(extension);
		await extension.activate();
		assert.ok((await vscode.commands.getCommands(true)).includes('vbi-format'));
	});

	test('routes document formatting through the language server', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'intouch',
			content: 'if Ready>0 then\ncall LogMessage("ok");\nendif;',
		});
		const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
			'vscode.executeFormatDocumentProvider',
			document.uri,
			{ insertSpaces: true, tabSize: 4 },
		);

		assert.ok(edits);
		assert.ok(edits.length > 0);
		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.set(document.uri, edits);
		assert.strictEqual(await vscode.workspace.applyEdit(workspaceEdit), true);
		assert.match(document.getText(), /^IF Ready > 0 THEN\r?\n {4}CALL LogMessage\("ok"\);\r?\nENDIF;$/);
	});
});
