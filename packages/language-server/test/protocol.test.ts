import * as assert from 'assert';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';

import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { CompletionItem, Diagnostic, DiagnosticSeverity, Hover, InitializeResult, Location, TextEdit } from 'vscode-languageserver/node';

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
		const workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'intouch-language-metadata-protocol-'));
		const definitionPath = path.join(workspacePath, 'SomethingCompletelyDifferent.vbi');
		const callerPath = path.join(workspacePath, 'caller.vbi');
		const nestedCallerPath = path.join(workspacePath, 'nested-caller.vi');
		const definitionSource = [
			'{>',
			'@ScriptType QuickFunction',
			'@Name MyFunction',
			'@Description Test function.',
			'@Param Source MESSAGE Source value.',
			'@Returns MESSAGE',
			'{<}',
		].join('\n');
		const callerSource = 'CALL MyFunction(Value);';
		fs.writeFileSync(definitionPath, definitionSource, 'utf8');
		fs.writeFileSync(callerPath, callerSource, 'utf8');
		fs.writeFileSync(nestedCallerPath, 'X = Wrapper(CALL MyFunction(Value));', 'utf8');
		const workspaceUri = pathToFileURL(workspacePath).toString();
		const definitionUri = pathToFileURL(definitionPath).toString();
		const callerUri = pathToFileURL(callerPath).toString();
		const nestedCallerUri = pathToFileURL(nestedCallerPath).toString();
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
		const diagnosticWaiters: Array<{
			uri: string;
			predicate: (diagnostics: Diagnostic[]) => boolean;
			resolve: (diagnostics: Diagnostic[]) => void;
		}> = [];
		const nextDiagnostics = (
			uri: string,
			predicate: (diagnostics: Diagnostic[]) => boolean = () => true,
		): Promise<Diagnostic[]> => new Promise(resolve => {
			diagnosticWaiters.push({ uri, predicate, resolve });
		});
		connection.onNotification('textDocument/publishDiagnostics', params => {
			const published = params as { uri: string; diagnostics: Diagnostic[] };
			const index = diagnosticWaiters.findIndex(waiter =>
				waiter.uri === published.uri && waiter.predicate(published.diagnostics));
			if (index < 0) return;
			const [waiter] = diagnosticWaiters.splice(index, 1);
			waiter.resolve(published.diagnostics);
		});
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
				diagnostics: { naming: {
					nonAsciiIdentifiers: 'information',
					windowWhitespace: 'information',
					windowNonAscii: 'information',
				} },
			}];
		});
		connection.listen();

		try {
			const initialize = await connection.sendRequest('initialize', {
				processId: null,
				rootUri: workspaceUri,
				capabilities: { workspace: { configuration: true } },
				workspaceFolders: [{ uri: workspaceUri, name: 'metadata-protocol' }],
			});
			assert.strictEqual((initialize as InitializeResult).capabilities.documentFormattingProvider, true);
			connection.sendNotification('initialized', {});
			await configurationRequest;
			connection.sendNotification('workspace/didChangeConfiguration', { settings: { VBI: {
				formatter: {
					BC: { BlockCodeBegin: '{>', BlockCodeEnd: '{<', BlockCodeExclude: '{#' },
					Region: { BlockCodeBegin: '{region', BlockCodeEnd: '{endregion', BlockCodeExclude: '{#' },
					Misc: { ReplaceTabToSpaces: true, IndentSize: 4 },
				},
				diagnostics: { naming: {
					nonAsciiIdentifiers: 'information',
					windowWhitespace: 'information',
					windowNonAscii: 'information',
				} },
			} } });

			const metadataDiagnosticWaiter = nextDiagnostics(callerUri, diagnostics =>
				!diagnostics.some(diagnostic => diagnostic.code === 'unknown-function'));
			connection.sendNotification('textDocument/didOpen', {
				textDocument: {
					uri: callerUri,
					languageId: 'intouch',
					version: 1,
					text: callerSource,
				},
			});
			const metadataDiagnostics = await metadataDiagnosticWaiter;
			assert.ok(!metadataDiagnostics.some(diagnostic => diagnostic.code === 'unknown-function'));

			const crossFileDefinition = await connection.sendRequest<Location | undefined>('textDocument/definition', {
				textDocument: { uri: callerUri },
				position: { line: 0, character: 7 },
			});
			assert.strictEqual(crossFileDefinition?.uri, definitionUri);
			assert.deepStrictEqual(crossFileDefinition?.range.start, { line: 2, character: 6 });

			const crossFileReferences = await connection.sendRequest<Location[]>('textDocument/references', {
				textDocument: { uri: callerUri },
				position: { line: 0, character: 7 },
				context: { includeDeclaration: true },
			});
			assert.deepStrictEqual(crossFileReferences.map(location => location.uri).sort(), [definitionUri, callerUri, nestedCallerUri].sort());

			const metadataHover = await connection.sendRequest<Hover | undefined>('textDocument/hover', {
				textDocument: { uri: callerUri },
				position: { line: 0, character: 7 },
			});
			assert.match(JSON.stringify(metadataHover?.contents), /MyFunction\(Source: MESSAGE\): MESSAGE/);

			const metadataCompletion = await connection.sendRequest<CompletionItem[]>('textDocument/completion', {
				textDocument: { uri: callerUri },
				position: { line: 0, character: 5 },
			});
			assert.match(metadataCompletion.find(item => item.label === 'MyFunction')?.detail ?? '', /Test function/);

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

			const qualityUri = 'file:///protocol-quality.vbi';
			const initialQualityDiagnostics = nextDiagnostics(qualityUri);
			connection.sendNotification('textDocument/didOpen', {
				textDocument: {
					uri: qualityUri,
					languageId: 'intouch',
					version: 1,
					text: 'DIM Größe AS INTEGER;\nShow "Übersicht Anlage";\nStatusMessage = "Übersicht Anlage";',
				},
			});
			const qualityDiagnostics = await initialQualityDiagnostics;
			assert.deepStrictEqual(qualityDiagnostics.map(item => [item.code, item.severity, item.source]), [
				['quickscript.naming.nonAsciiIdentifier', DiagnosticSeverity.Information, 'intouch-quality'],
				['quickscript.naming.windowWhitespace', DiagnosticSeverity.Information, 'intouch-quality'],
				['quickscript.naming.windowNonAscii', DiagnosticSeverity.Information, 'intouch-quality'],
			]);

			const disabledQualityDiagnostics = nextDiagnostics(qualityUri, diagnostics => diagnostics.length === 0);
			connection.sendNotification('workspace/didChangeConfiguration', { settings: { VBI: {
				formatter: {
					BC: { BlockCodeBegin: '{>', BlockCodeEnd: '{<', BlockCodeExclude: '{#' },
					Region: { BlockCodeBegin: '{region', BlockCodeEnd: '{endregion', BlockCodeExclude: '{#' },
					Misc: { ReplaceTabToSpaces: true, IndentSize: 4 },
				},
				diagnostics: { naming: {
					nonAsciiIdentifiers: 'off',
					windowWhitespace: 'off',
					windowNonAscii: 'off',
				} },
			} } });
			assert.deepStrictEqual(await disabledQualityDiagnostics, []);

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
			assert.ok(path.resolve(workspacePath).startsWith(path.resolve(os.tmpdir()) + path.sep));
			fs.rmSync(workspacePath, { recursive: true, force: true });
		}
	});
});
