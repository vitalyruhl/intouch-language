import * as assert from 'assert';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { CompletionItem, InitializeResult, TextEdit } from 'vscode-languageserver/node';

function applyFormattingEdits(source: string, edits: readonly TextEdit[]): string {
	if (edits.length === 0) {
		return source;
	}
	assert.strictEqual(edits.length, 1);
	assert.deepStrictEqual(edits[0].range.start, { line: 0, character: 0 });
	return edits[0].newText;
}

suite('QuickScript language server protocol', () => {
	test('handles lifecycle, synchronization, and representative requests without VS Code', async function () {
		this.timeout(10_000);
		const serverPath = path.resolve(__dirname, '../src/server.js');
		const environment = { ...process.env };
		delete environment.ELECTRON_RUN_AS_NODE;
		const child: ChildProcessWithoutNullStreams = spawn(process.execPath, [serverPath, '--stdio'], {
			env: environment,
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		let stderr = '';
		child.stderr.on('data', chunk => { stderr += chunk.toString(); });
		const connection = createMessageConnection(new StreamMessageReader(child.stdout), new StreamMessageWriter(child.stdin));
		let configurationRequested: (() => void) | undefined;
		const configurationRequest = new Promise<void>(resolve => { configurationRequested = resolve; });
		connection.onRequest('workspace/configuration', () => {
			configurationRequested?.();
			return [{
				formatter: {
					BC: { BlockCodeBegin: '{>', BlockCodeEnd: '{<', BlockCodeExclude: '{#' },
					Region: { BlockCodeBegin: '{region', BlockCodeEnd: '{endregion', BlockCodeExclude: '{#' },
					Misc: { ReplaceTabToSpaces: true, IndentSize: 4 },
				},
			}];
		});
		connection.listen();

		try {
			const initialize = await connection.sendRequest('initialize', {
				processId: null,
				rootUri: null,
				capabilities: { workspace: { configuration: true } },
				workspaceFolders: null,
			});
			assert.strictEqual((initialize as InitializeResult).capabilities.documentFormattingProvider, true);
			connection.sendNotification('initialized', {});
			await configurationRequest;

			const uri = 'file:///protocol-smoke.vbi';
			connection.sendNotification('textDocument/didOpen', {
				textDocument: {
					uri,
					languageId: 'intouch',
					version: 1,
					text: 'DIM Counter AS INTEGER;\nIF Counter>0 THEN\nCALL LogMessage("ok");\nENDIF;',
				},
			});
			connection.sendNotification('textDocument/didChange', {
				textDocument: { uri, version: 2 },
				contentChanges: [{
					text: 'DIM Counter AS INTEGER;\nDIM Updated AS REAL;\nIF Counter>0 THEN\nCALL LogMessage("ok");\nENDIF;',
				}],
			});

			const edits = await connection.sendRequest('textDocument/formatting', {
				textDocument: { uri },
				options: { tabSize: 4, insertSpaces: true },
			});
			assert.ok(Array.isArray(edits) && edits.length === 1);

			const fixtureDirectory = path.resolve(__dirname, '../../../src/test/suite/testfiles');
			const nestingSource = fs.readFileSync(path.join(fixtureDirectory, '05.comment_rules.nesting.test.vbi'), 'utf8');
			const nestingExpected = fs.readFileSync(path.join(fixtureDirectory, '05.comment_rules.nesting.tobe.vbi'), 'utf8');
			const nestingUri = 'file:///protocol-nesting.vbi';
			connection.sendNotification('textDocument/didOpen', {
				textDocument: {
					uri: nestingUri,
					languageId: 'intouch',
					version: 1,
					text: nestingSource,
				},
			});
			const nestingEdits = await connection.sendRequest<TextEdit[]>('textDocument/formatting', {
				textDocument: { uri: nestingUri },
				options: { tabSize: 8, insertSpaces: true },
			});
			const nestingOnce = applyFormattingEdits(nestingSource, nestingEdits);
			assert.strictEqual(nestingOnce, nestingExpected);

			connection.sendNotification('textDocument/didChange', {
				textDocument: { uri: nestingUri, version: 2 },
				contentChanges: [{ text: nestingOnce }],
			});
			const nestingSecondEdits = await connection.sendRequest<TextEdit[]>('textDocument/formatting', {
				textDocument: { uri: nestingUri },
				options: { tabSize: 8, insertSpaces: true },
			});
			assert.strictEqual(applyFormattingEdits(nestingOnce, nestingSecondEdits), nestingOnce);

			const completion = await connection.sendRequest('textDocument/completion', {
				textDocument: { uri },
				position: { line: 3, character: 6 },
			});
			assert.ok(Array.isArray(completion) && (completion as CompletionItem[]).some(item => item.label === 'LogMessage'));
			assert.ok(Array.isArray(completion) && (completion as CompletionItem[]).some(item => item.label === 'Updated'));

			const hover = await connection.sendRequest('textDocument/hover', {
				textDocument: { uri },
				position: { line: 3, character: 8 },
			});
			assert.ok(hover);

			await connection.sendRequest('shutdown');
			connection.sendNotification('exit');
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => reject(new Error(`Language server did not exit. ${stderr}`)), 3_000);
				child.once('exit', code => {
					clearTimeout(timeout);
					if (code === 0) resolve();
					else reject(new Error(`Language server exited with ${code}. ${stderr}`));
				});
			});
		} finally {
			connection.dispose();
			if (!child.killed && child.exitCode === null) {
				child.kill();
			}
		}
	});
});
