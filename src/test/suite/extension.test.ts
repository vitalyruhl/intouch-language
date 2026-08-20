import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

async function waitForDiagnostics(
	uri: vscode.Uri,
	predicate: (diagnostics: readonly vscode.Diagnostic[]) => boolean,
	description: string,
): Promise<readonly vscode.Diagnostic[]> {
	const current = vscode.languages.getDiagnostics(uri);
	if (predicate(current)) return current;
	return new Promise((resolve, reject) => {
		let subscription: vscode.Disposable | undefined;
		const timeout = setTimeout(() => {
			subscription?.dispose();
			reject(new Error(`Timed out waiting for diagnostics: ${description}.`));
		}, 10000);
		subscription = vscode.languages.onDidChangeDiagnostics(event => {
			if (!event.uris.some(changed => changed.toString() === uri.toString())) return;
			const diagnostics = vscode.languages.getDiagnostics(uri);
			if (!predicate(diagnostics)) return;
			clearTimeout(timeout);
			subscription?.dispose();
			resolve(diagnostics);
		});
	});
}

async function waitForDiagnosticCode(uri: vscode.Uri, code: string): Promise<readonly vscode.Diagnostic[]> {
	return waitForDiagnostics(uri, diagnostics => diagnostics.some(diagnostic => diagnostic.code === code), code);
}

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

	test('formats the comment nesting fixture exactly and idempotently through the production provider', async () => {
		const fixtureDirectory = path.resolve(__dirname, '../../../src/test/suite/testfiles');
		const source = fs.readFileSync(path.join(fixtureDirectory, '05.comment_rules.nesting.test.vbi'), 'utf8');
		const expected = fs.readFileSync(path.join(fixtureDirectory, '05.comment_rules.nesting.tobe.vbi'), 'utf8');
		const document = await vscode.workspace.openTextDocument({ language: 'intouch', content: source });
		const options = { insertSpaces: true, tabSize: 8 };

		const firstEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
			'vscode.executeFormatDocumentProvider',
			document.uri,
			options,
		);
		assert.ok(firstEdits);
		const firstWorkspaceEdit = new vscode.WorkspaceEdit();
		firstWorkspaceEdit.set(document.uri, firstEdits);
		assert.strictEqual(await vscode.workspace.applyEdit(firstWorkspaceEdit), true);
		assert.strictEqual(document.getText(), expected);

		const secondEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
			'vscode.executeFormatDocumentProvider',
			document.uri,
			options,
		);
		assert.ok(secondEdits === undefined || secondEdits.length === 0);
		assert.strictEqual(document.getText(), expected);
	});

	test('isolates a real multiline metadata header through the production language client', async () => {
		const extension = vscode.extensions.getExtension('Vitaly-ruhl.intouch-language');
		assert.ok(extension);
		await extension.activate();
		const source = [
			'{>',
			'    Script:',
			'    Type: QuickFunction',
			'    Name: TABHER012EA',
			'',
			'    Parameters:',
			'    No formal parameters.',
			'',
			'    Usage:',
			'    CALL TABHER012EA( );',
			'{<}',
			'DIM X AS FALSCH;',
		].join('\n');
		const document = await vscode.workspace.openTextDocument({ language: 'intouch', content: source });
		const diagnostics = await waitForDiagnosticCode(document.uri, 'unknown-datatype');

		assert.deepStrictEqual(diagnostics.map(diagnostic => [diagnostic.code, diagnostic.range.start.line]), [
			['unknown-datatype', 11],
		]);
	});

	test('routes naming quality settings and window context through the production language client', async () => {
		const extension = vscode.extensions.getExtension('Vitaly-ruhl.intouch-language');
		assert.ok(extension);
		await extension.activate();
		const configuration = vscode.workspace.getConfiguration('VBI');
		const keys = [
			'diagnostics.naming.nonAsciiIdentifiers',
			'diagnostics.naming.windowWhitespace',
			'diagnostics.naming.windowNonAscii',
		] as const;
		const previous = new Map(keys.map(key => [key, configuration.inspect<string>(key)?.globalValue]));

		try {
			for (const key of keys) await configuration.update(key, 'warning', vscode.ConfigurationTarget.Global);
			const source = [
				'DIM Größe AS INTEGER;',
				'Show "Übersicht Anlage";',
				'StatusMessage = "Übersicht Anlage";',
			].join('\n');
			const document = await vscode.workspace.openTextDocument({ language: 'intouch', content: source });
			const initial = await waitForDiagnostics(document.uri, diagnostics =>
				diagnostics.filter(item => item.source === 'intouch-quality').length === 3,
			'initial quality warnings');
			assert.deepStrictEqual(initial.filter(item => item.source === 'intouch-quality').map(item => [item.code, item.severity, item.range.start.line]), [
				['quickscript.naming.nonAsciiIdentifier', vscode.DiagnosticSeverity.Warning, 0],
				['quickscript.naming.windowWhitespace', vscode.DiagnosticSeverity.Warning, 1],
				['quickscript.naming.windowNonAscii', vscode.DiagnosticSeverity.Warning, 1],
			]);

			for (const [setting, severity] of [
				['information', vscode.DiagnosticSeverity.Information],
				['warning', vscode.DiagnosticSeverity.Warning],
				['error', vscode.DiagnosticSeverity.Error],
			] as const) {
				const changed = waitForDiagnostics(document.uri, diagnostics => diagnostics.some(item =>
					item.code === 'quickscript.naming.nonAsciiIdentifier' && item.severity === severity), setting);
				await configuration.update(keys[0], setting, vscode.ConfigurationTarget.Global);
				await changed;
			}

			const identifierDisabled = waitForDiagnostics(document.uri, diagnostics =>
				!diagnostics.some(item => item.code === 'quickscript.naming.nonAsciiIdentifier'), 'non-ASCII identifier off');
			await configuration.update(keys[0], 'off', vscode.ConfigurationTarget.Global);
			await identifierDisabled;

			const allDisabled = waitForDiagnostics(document.uri, diagnostics =>
				!diagnostics.some(item => item.source === 'intouch-quality'), 'all naming quality diagnostics off');
			await configuration.update(keys[1], 'off', vscode.ConfigurationTarget.Global);
			await configuration.update(keys[2], 'off', vscode.ConfigurationTarget.Global);
			assert.deepStrictEqual(await allDisabled, []);
		} finally {
			for (const key of keys) {
				await configuration.update(key, previous.get(key), vscode.ConfigurationTarget.Global);
			}
		}
	});
});
