import * as assert from 'assert';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as path from 'path';

import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { CompletionItem, InitializeResult } from 'vscode-languageserver/node';

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
		connection.listen();

		try {
			const initialize = await connection.sendRequest('initialize', {
				processId: null,
				rootUri: null,
				capabilities: {},
				workspaceFolders: null,
			});
			assert.strictEqual((initialize as InitializeResult).capabilities.documentFormattingProvider, true);
			connection.sendNotification('initialized', {});

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
