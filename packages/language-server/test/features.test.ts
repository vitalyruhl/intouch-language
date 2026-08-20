import * as assert from 'assert';

import * as fs from 'fs';
import * as path from 'path';

import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KNOWN_FUNCTIONS } from '@intouch-language/core';

import {
	completionsFor,
	definitionFor,
	diagnosticsFor,
	formattingEdits,
	hoverFor,
	referencesFor,
	serverCapabilities,
	symbolsFor,
} from '../src/features';
import { formattingSettings, readSettings } from '../src/settings';
import { WorkspaceFunctionIndex, WorkspaceSymbolIndex, workspaceDocumentKey } from '../src/workspaceFunctions';

function formattedText(document: TextDocument, settings = {}): string {
	const [edit] = formattingEdits(document, settings);
	return edit === undefined ? document.getText() : edit.newText;
}

suite('QuickScript language server features', () => {
	const document = TextDocument.create(
		'file:///sample.vbi',
		'intouch',
		1,
		'DIM Counter AS INTEGER;\nIF Counter>0 THEN\nCALL LogMessage("ok");\nENDIF;',
	);

	test('advertises the required protocol capabilities', () => {
		const capabilities = serverCapabilities().capabilities;

		assert.strictEqual(capabilities.documentFormattingProvider, true);
		assert.strictEqual(capabilities.documentSymbolProvider, true);
		assert.strictEqual(capabilities.definitionProvider, true);
		assert.strictEqual(capabilities.referencesProvider, true);
		assert.strictEqual(capabilities.hoverProvider, true);
		assert.ok(capabilities.completionProvider);
	});

	test('serves formatting, symbols, navigation, completion, hover, and diagnostics', () => {
		assert.strictEqual(formattingEdits(document, { indentSize: 2 }).length, 1);
		assert.ok(symbolsFor(document).some(symbol => symbol.name === 'Counter'));
		assert.strictEqual(definitionFor(document, { line: 1, character: 4 })?.uri, document.uri);
		assert.ok(referencesFor(document, { line: 0, character: 5 }, true).length >= 2);
		assert.ok(completionsFor(document).some(item => item.label === 'LogMessage'));
		assert.ok(hoverFor(document, { line: 2, character: 8 }));
		assert.deepStrictEqual(diagnosticsFor(document), []);
	});

	test('publishes parser and semantic diagnostics', () => {
		const broken = TextDocument.create('file:///broken.vi', 'intouch', 1, 'DIM A AS Bogus;\nDIM a AS REAL;\nIF A THEN');
		const codes = diagnosticsFor(broken).map(item => item.code);

		assert.ok(codes.includes('unknown-datatype'));
		assert.ok(codes.includes('duplicate-local'));
		assert.ok(codes.includes('missing-endif'));
	});

	test('maps nested VS Code formatter settings to core options', () => {
		const settings = readSettings({ VBI: {
			formatter: {
				EmptyLine: { allowedNumberOfEmptyLines: 2, RemoveEmptyLines: true, EmptyLinesAlsoInComment: true },
				BC: { BlockCodeBegin: '{begin', BlockCodeEnd: '{end', BlockCodeExclude: '{back' },
				Region: { BlockCodeBegin: '{r', BlockCodeEnd: '{/r', BlockCodeExclude: '{rb' },
				Misc: { ReplaceTabToSpaces: false, IndentSize: 3 },
			},
			diagnostics: { naming: {
				nonAsciiIdentifiers: 'information',
				windowWhitespace: 'off',
				windowNonAscii: 'error',
			} },
		} });

		assert.deepStrictEqual(settings, {
			allowedNumberOfEmptyLines: 2,
			removeEmptyLines: true,
			removeEmptyLinesInComments: true,
			blockCodeBegin: '{begin',
			blockCodeEnd: '{end',
			blockCodeExclude: '{back',
			regionBlockCodeBegin: '{r',
			regionBlockCodeEnd: '{/r',
			regionBlockCodeExclude: '{rb',
			insertSpaces: false,
			indentSize: 3,
			qualityDiagnostics: {
				nonAsciiIdentifiers: 'information',
				windowWhitespace: 'off',
				windowNonAscii: 'error',
			},
		});
		assert.deepStrictEqual(formattingSettings(settings, { insertSpaces: true, tabSize: 8 }), settings);
	});

	test('maps quality settings to LSP severity and source without changing syntax validity', () => {
		const source = [
			'DIM Größe AS INTEGER;',
			'Show "Anlage Übersicht";',
			'StatusMessage = "Störung Lüftung";',
		].join('\n');
		const document = TextDocument.create('file:///quality.vbi', 'intouch', 1, source);
		const defaults = diagnosticsFor(document);

		assert.deepStrictEqual(defaults.map(item => [item.code, item.severity, item.source]), [
			['quickscript.naming.nonAsciiIdentifier', DiagnosticSeverity.Warning, 'intouch-quality'],
			['quickscript.naming.windowWhitespace', DiagnosticSeverity.Warning, 'intouch-quality'],
			['quickscript.naming.windowNonAscii', DiagnosticSeverity.Warning, 'intouch-quality'],
		]);
		assert.ok(!defaults.some(item => item.range.start.line === 2));

		for (const [setting, severity] of [
			['hint', DiagnosticSeverity.Hint],
			['information', DiagnosticSeverity.Information],
			['warning', DiagnosticSeverity.Warning],
			['error', DiagnosticSeverity.Error],
		] as const) {
			const diagnostics = diagnosticsFor(document, undefined, {
				qualityDiagnostics: {
					nonAsciiIdentifiers: setting,
					windowWhitespace: 'off',
					windowNonAscii: 'off',
				},
			});
			assert.deepStrictEqual(diagnostics.map(item => item.severity), [severity]);
		}
		assert.deepStrictEqual(diagnosticsFor(document, undefined, {
			qualityDiagnostics: {
				nonAsciiIdentifiers: 'off',
				windowWhitespace: 'off',
				windowNonAscii: 'off',
			},
		}), []);
	});

	test('formats the established comment nesting fixture through the language-server formatter entrypoint', () => {
		const fixtureDirectory = path.resolve(__dirname, '../../../src/test/suite/testfiles');
		const source = fs.readFileSync(path.join(fixtureDirectory, '05.comment_rules.nesting.test.vbi'), 'utf8');
		const expected = fs.readFileSync(path.join(fixtureDirectory, '05.comment_rules.nesting.tobe.vbi'), 'utf8');
		const document = TextDocument.create('file:///nesting.vbi', 'intouch', 1, source);
		const settings = { indentSize: 4, insertSpaces: true };

		const once = formattedText(document, settings);
		const twice = formattedText(TextDocument.create(document.uri, 'intouch', 2, once), settings);

		assert.strictEqual(once, expected);
		assert.strictEqual(twice, expected);
	});

	test('formats a multiline metadata comment across blank lines through the language-server entrypoint', () => {
		const source = [
			'{>',
			'Script:',
			'',
			'Type: QuickFunction',
			'',
			'Name: GetFullTopic',
			'',
			'Parameters:',
			'',
			'Message Topic',
			'',
			'Usage:',
			'',
			'CALL GetFullTopic( ... );',
			'',
			'{<}',
		].join('\r\n');
		const expected = [
			'{>',
			'    Script:',
			'',
			'    Type: QuickFunction',
			'',
			'    Name: GetFullTopic',
			'',
			'    Parameters:',
			'',
			'    Message Topic',
			'',
			'    Usage:',
			'',
			'    CALL GetFullTopic( ... );',
			'',
			'{<}',
		].join('\r\n');
		const document = TextDocument.create('file:///hil-nesting.vbi', 'intouch', 1, source);

		const once = formattedText(document, { indentSize: 4, insertSpaces: true });
		const twice = formattedText(TextDocument.create(document.uri, 'intouch', 2, once), { indentSize: 4, insertSpaces: true });

		assert.strictEqual(once, expected);
		assert.strictEqual(twice, expected);
	});

	test('isolates the exact real QuickFunction headers through the LSP diagnostic pipeline', () => {
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
			'',
			'{>',
			'    Version history:',
			'    V2.0.0 16.10.2020 ViRu Irgend etwas passt da vorn und Hinten nicht!',
			'    V2.1.0 03.02.2022 ViRu Typ (typ + 10 = ohne PLS --> PLSActive AS Memory Discrete --> Als Globale Variable festlegen!)',
			'    V2.2.0 30.10.2024 ViRu debug mit xHerDebugL',
			'{<}',
		].join('\r\n');
		const document = TextDocument.create('file:///TABHER012EA.vbi', 'intouch', 1, source);

		assert.deepStrictEqual(diagnosticsFor(document), []);
	});

	test('keeps LSP diagnostics active between same-line-closed nesting markers', () => {
		const source = [
			'{> following code shall be nested}',
			'DIM X AS FALSCH;',
			'CALL NichtVorhanden();',
			'{<-------------------------------------------}',
		].join('\n');
		const document = TextDocument.create('file:///nested-code.vbi', 'intouch', 1, source);

		assert.deepStrictEqual(diagnosticsFor(document).map(item => item.code), ['unknown-datatype', 'unknown-function']);
	});

	test('diagnoses unresolved CALL and expression functions while resolving catalogs and QuickFunctions', () => {
		const source = [
			'CALL xHerDebuga(Funkt + " ", 40);',
			'a = StringLaft(Test, 4);',
			'a = StringLeft(Test, StringInString(Test, ".", 1, 0) - 1);',
			'CALL xHerDebug(Funkt, 40);',
			'{>',
			'Type: QuickFunction',
			'Name: GetFullTopic',
			'{<}',
			'CALL GetFullTopic();',
			'CALL GetFullTopica();',
		].join('\n');
		const document = TextDocument.create('file:///functions.vbi', 'intouch', 1, source);
		const diagnostics = diagnosticsFor(document);
		const unknown = diagnostics.filter(diagnostic => diagnostic.code === 'unknown-function');

		assert.deepStrictEqual(unknown.map(diagnostic => [diagnostic.range.start.line, diagnostic.range.start.character]), [
			[0, 5],
			[1, 4],
			[9, 5],
		]);
		assert.ok(unknown.every(diagnostic => diagnostic.severity === 2));
	});

	test('isolates code diagnostics from brace, apostrophe, and metadata comments', () => {
		const source = [
			'{',
			'Version history:',
			'DIM X AS FALSCH;',
			'CALL NichtVorhanden();',
			'FR I = 1 TO 10',
			'IF X THEN;',
			'TABINDEX + TABINDEX + 1;',
			'}',
			"' DIM Y AS FALSCH; CALL AuchNichtVorhanden();",
			'{> Version Name Usage CALL DIM MetaNichtVorhanden()}',
		].join('\n');
		const commented = TextDocument.create('file:///comment-diagnostics.vbi', 'intouch', 1, source);

		assert.deepStrictEqual(diagnosticsFor(commented), []);
	});

	test('publishes only semantic diagnostics for syntactically valid CALL expressions', () => {
		const source = [
			'TAB_HandF.Reference = CALL SetReferenceBool(tTopic, 1, BitS1);',
			'tTopic = StringLower(CALL GetSplittByIndex(TAB_AAFF.Reference, ".", 1));',
			'Value = CALL GetSplittByIndeXx(Source, ".", 1);',
		].join('\n');
		const calls = TextDocument.create('file:///call-expressions.vbi', 'intouch', 1, source);

		assert.deepStrictEqual(diagnosticsFor(calls).map(item => [item.code, item.range.start]), [
			['unknown-function', { line: 2, character: 13 }],
		]);
		assert.ok(hoverFor(calls, { line: 1, character: 34 }));
		assert.ok(completionsFor(calls).some(item => item.label === 'GetSplittByIndex'));
	});

	test('uses existing definition and references for CALL expression targets', () => {
		const source = [
			'DIM LocalCallable AS INTEGER;',
			'Value = CALL LocalCallable();',
		].join('\n');
		const calls = TextDocument.create('file:///call-expression-navigation.vbi', 'intouch', 1, source);

		assert.deepStrictEqual(definitionFor(calls, { line: 1, character: 15 })?.range.start, { line: 0, character: 4 });
		assert.strictEqual(referencesFor(calls, { line: 1, character: 15 }, true).length, 2);
	});

	test('resolves project functions only when the workspace declares them', () => {
		const definitions = TextDocument.create('file:///definitions.vi', 'intouch', 1, '{>\nType: QuickFunction\nName: WorkspaceFunction\n{<}');
		const caller = TextDocument.create('file:///caller.vbi', 'intouch', 1, 'CALL workspacefunction();\nCALL WorkspaceFunctio();');
		const workspace = new WorkspaceFunctionIndex();
		const isolated = diagnosticsFor(caller).filter(diagnostic => diagnostic.code === 'unknown-function');
		workspace.updateDocument(definitions);

		const diagnostics = diagnosticsFor(caller, workspace.knownFunctionNames()).filter(diagnostic => diagnostic.code === 'unknown-function');
		assert.deepStrictEqual(isolated.map(diagnostic => diagnostic.range.start), [
			{ line: 0, character: 5 },
			{ line: 1, character: 5 },
		]);
		assert.deepStrictEqual(diagnostics.map(diagnostic => diagnostic.range.start), [{ line: 1, character: 5 }]);
	});

	test('resolves metadata QuickFunctions across files without a QF filename prefix', () => {
		const definition = TextDocument.create('file:///SomethingCompletelyDifferent.vbi', 'intouch', 1, [
			'{>',
			'@ScriptType QuickFunction',
			'@Name MyFunction',
			'@Description Test function.',
			'@Param Source MESSAGE Source value.',
			'@Returns MESSAGE',
			'{<}',
		].join('\n'));
		const caller = TextDocument.create('file:///caller.vbi', 'intouch', 1, 'CALL MyFunction(Value);');
		const nestedCaller = TextDocument.create('file:///nested-caller.vi', 'intouch', 1, 'X = Wrapper(CALL MyFunction(Value));');
		const workspace = new WorkspaceSymbolIndex();
		workspace.updateDocument(definition);
		workspace.updateDocument(caller);
		workspace.updateDocument(nestedCaller);

		assert.ok(!diagnosticsFor(caller, workspace).some(diagnostic => diagnostic.code === 'unknown-function'));
		assert.deepStrictEqual(definitionFor(caller, { line: 0, character: 7 }, workspace), {
			uri: definition.uri,
			range: { start: { line: 2, character: 6 }, end: { line: 2, character: 16 } },
		});
		assert.deepStrictEqual(
			referencesFor(caller, { line: 0, character: 7 }, true, workspace).map(location => location.uri).sort(),
			[definition.uri, caller.uri, nestedCaller.uri].sort(),
		);
		assert.match(String((hoverFor(caller, { line: 0, character: 7 }, workspace)?.contents as { value: string }).value), /MyFunction\(Source: MESSAGE\): MESSAGE/);
		assert.match(completionsFor(caller, workspace).find(item => item.label === 'MyFunction')?.detail ?? '', /Test function/);
	});

	test('classifies Window events as non-callable document symbols', () => {
		const workspace = new WorkspaceSymbolIndex();
		for (const event of ['OnShow', 'WhileRunning', 'OnClose']) {
			const document = TextDocument.create(`file:///MainWindow-${event}.vbi`, 'intouch', 1, [
				'{>',
				'@ScriptType Window',
				'@Name MainWindow',
				`@Event ${event}`,
				'{<}',
			].join('\n'));
			workspace.updateDocument(document);
			const symbols = symbolsFor(document);
			assert.strictEqual(symbols[0].name, 'MainWindow');
			assert.strictEqual(symbols[0]?.children?.[0]?.name, event);
			assert.match(JSON.stringify(hoverFor(document, { line: 2, character: 8 }, workspace)?.contents), /Window/);
		}
		const caller = TextDocument.create('file:///window-caller.vbi', 'intouch', 1, 'CALL MainWindow();');
		workspace.updateDocument(caller);

		assert.ok(diagnosticsFor(caller, workspace).some(diagnostic => diagnostic.code === 'unknown-function'));
		assert.ok(!workspace.knownFunctionNames().includes('MainWindow'));
		assert.ok(!completionsFor(caller, workspace).some(item => item.label === 'MainWindow'));
		assert.deepStrictEqual(workspace.symbols().filter(symbol => symbol.kind === 'WindowEvent').map(symbol => symbol.metadata.event), [
			'OnClose', 'OnShow', 'WhileRunning',
		]);
	});

	test('indexes Application, DataChange, Condition, and KeyScript documents without making them callable', () => {
		const workspace = new WorkspaceSymbolIndex();
		const sources = [
			['application.vbi', 'Type: ApplicationScript\nName: APP_Application_on_startup', 'ApplicationScript'],
			['datachange.vbi', 'Type: datachange\nTagname[.field]: SomeTag', 'DataChangeScript'],
			['condition.vbi', 'Type: ConditionalScript\nName: ReadyCondition\nCondition: Ready\nCondition Type: OnTrue', 'ConditionScript'],
			['key.vbi', 'Type: KeyScript\nName: KEY_Ctrl_D\nShortcut: Ctrl+d', 'KeyScript'],
		] as const;
		for (const [file, body] of sources) {
			workspace.updateDocument(TextDocument.create(`file:///${file}`, 'intouch', 1, `{>\n${body}\n{<}`));
		}

		assert.deepStrictEqual(workspace.symbols().map(symbol => symbol.kind).sort(), sources.map(([, , kind]) => kind).sort());
		assert.deepStrictEqual(workspace.knownFunctionNames(), []);
	});

	test('diagnoses duplicate QuickFunctions and never chooses an arbitrary definition', () => {
		const workspace = new WorkspaceSymbolIndex();
		const source = '{>\n@ScriptType QuickFunction\n@Name DuplicateName\n{<}';
		const first = TextDocument.create('file:///first.vbi', 'intouch', 1, source);
		const second = TextDocument.create('file:///second.vbi', 'intouch', 1, source);
		const caller = TextDocument.create('file:///duplicate-caller.vbi', 'intouch', 1, 'CALL DuplicateName();');
		for (const document of [first, second, caller]) workspace.updateDocument(document);

		assert.ok(diagnosticsFor(first, workspace).some(diagnostic => diagnostic.code === 'duplicate-quickfunction'));
		assert.ok(diagnosticsFor(caller, workspace).some(diagnostic => diagnostic.code === 'ambiguous-quickfunction'));
		assert.strictEqual(definitionFor(caller, { line: 0, character: 7 }, workspace), undefined);
		assert.strictEqual(referencesFor(caller, { line: 0, character: 7 }, true, workspace).length, 3);
	});

	test('replaces one physical Windows QuickFunction across scan and open-document lifecycle', () => {
		const scanUri = 'file:///C:/HIL/QF_StartEP3_1.0.1.vbi';
		const openUri = 'file:///c:/HIL/QF_StartEP3_1.0.1.vbi';
		const source = '{>\n@ScriptType QuickFunction\n@Name StartEP3\n{<}';
		const caller = TextDocument.create('file:///C:/HIL/caller.vbi', 'intouch', 1, 'CALL StartEP3();');
		const workspace = new WorkspaceSymbolIndex();
		const assertPhase = (expectedUri: string): void => {
			assert.strictEqual(workspace.quickFunctions('StartEP3').length, 1);
			assert.strictEqual(
				workspace.diagnostics(expectedUri).filter(diagnostic => diagnostic.code === 'duplicate-quickfunction').length,
				0,
			);
			assert.strictEqual(definitionFor(caller, { line: 0, character: 7 }, workspace)?.uri, expectedUri);
		};

		assert.strictEqual(workspaceDocumentKey(scanUri), workspaceDocumentKey(openUri));
		workspace.replaceWorkspaceDocuments([{ uri: scanUri, text: source }]);
		workspace.updateDocument(caller);
		assertPhase(scanUri);

		workspace.updateDocument(TextDocument.create(openUri, 'intouch', 1, source));
		assertPhase(openUri);
		workspace.updateDocument(TextDocument.create(openUri, 'intouch', 2, `${source}\n`));
		assertPhase(openUri);
		workspace.removeDocument(openUri);
		assertPhase(scanUri);
		workspace.updateDocument(TextDocument.create(openUri, 'intouch', 3, source));
		assertPhase(openUri);
	});

	test('uses QF filenames only when structured metadata is absent', () => {
		const workspace = new WorkspaceSymbolIndex();
		workspace.updateDocument(TextDocument.create('file:///QF_FallbackOnly_1.0.0.vbi', 'intouch', 1, ''));
		workspace.updateDocument(TextDocument.create('file:///QF_WrongName_1.0.0.vbi', 'intouch', 1, '{>\n@ScriptType QuickFunction\n@Name CanonicalName\n{<}'));

		assert.deepStrictEqual(workspace.knownFunctionNames(), ['CanonicalName', 'FallbackOnly']);
	});

	test('keeps static Hermes catalog entries out of workspace definition counts', () => {
		const workspace = new WorkspaceSymbolIndex();
		const definition = TextDocument.create('file:///StartEP3.vbi', 'intouch', 1, [
			'{>',
			'@ScriptType QuickFunction',
			'@Name StartEP3',
			'@Description Workspace implementation.',
			'{<}',
		].join('\n'));
		const caller = TextDocument.create('file:///hermes-caller.vbi', 'intouch', 1, 'CALL StartEP3();');
		workspace.updateDocument(definition);
		workspace.updateDocument(caller);

		assert.strictEqual(KNOWN_FUNCTIONS.filter(entry => entry.name.toUpperCase() === 'STARTEP3').length, 1);
		assert.strictEqual(workspace.quickFunctions('StartEP3').length, 1);
		assert.ok(!diagnosticsFor(definition, workspace).some(diagnostic => diagnostic.code === 'duplicate-quickfunction'));
		assert.strictEqual(definitionFor(caller, { line: 0, character: 7 }, workspace)?.uri, definition.uri);
		assert.match(JSON.stringify(hoverFor(caller, { line: 0, character: 7 }, workspace)?.contents), /Workspace implementation/);
		assert.match(completionsFor(caller, workspace).find(item => item.label === 'StartEP3')?.detail ?? '', /Workspace implementation/);
	});

	test('keeps the positive HIL datatype and function diagnostics', () => {
		const document = TextDocument.create('file:///hil-positive.vbi', 'intouch', 1, [
			'DIM ENDE AS DISCRET;',
			'Value = StringLang(Source);',
			'Value = StraingMid(Source, 1, 2);',
		].join('\n'));
		const diagnostics = diagnosticsFor(document);

		assert.deepStrictEqual(
			diagnostics.filter(item => item.code === 'unknown-datatype').map(item => item.range.start),
			[{ line: 0, character: 12 }],
		);
		assert.deepStrictEqual(
			diagnostics.filter(item => item.code === 'unknown-function').map(item => item.range.start),
			[{ line: 1, character: 8 }, { line: 2, character: 8 }],
		);
		const unmatchedNext = TextDocument.create('file:///hil-next.vbi', 'intouch', 1, 'NEXT;');
		assert.ok(diagnosticsFor(unmatchedNext).some(item => item.code === 'invalid-nesting'));
	});

	test('reports focused statement diagnostics without cascading from FR to NEXT', () => {
		const document = TextDocument.create('file:///hil-statements.vbi', 'intouch', 1, [
			'DIM TEXT6 AS MESSAGE',
			'DIM TEXT6 AS MESSAGE;',
			'DI TEXT9 AS MESSAGE;',
			'FR TABINDEX = 1 TO StringLen(TEXT9)',
			'NEXT;',
		].join('\n'));
		const diagnostics = diagnosticsFor(document);

		assert.deepStrictEqual(
			diagnostics.filter(item => item.code === 'missing-semicolon').map(item => item.range.start),
			[{ line: 0, character: 20 }],
		);
		assert.deepStrictEqual(
			diagnostics.filter(item => item.code === 'invalid-statement').map(item => item.range.start),
			[{ line: 2, character: 0 }, { line: 3, character: 0 }],
		);
		assert.ok(!diagnostics.some(item => item.code === 'invalid-nesting' && item.range.start.line === 4));
	});

	test('publishes the grammar-derived HIL round 3 diagnostics at primary tokens', () => {
		const document = TextDocument.create('file:///hil-round-3.vbi', 'intouch', 1, [
			'TABINDEX = TABINDEX + 1',
			'IF Ready THEN;',
			'ENDIF;',
			'FOR TABINDEX == TABINDEX TO StringLen(TEXT9)',
			'NEXT;',
			'TABINDEX + TABINDEX + 1;',
		].join('\n'));
		const diagnostics = diagnosticsFor(document);

		assert.deepStrictEqual(
			diagnostics.map(item => [item.code, item.range.start]),
			[
				['missing-semicolon', { line: 0, character: 23 }],
				['unexpected-semicolon', { line: 1, character: 13 }],
				['expected-equals', { line: 3, character: 13 }],
				['expected-assignment', { line: 5, character: 0 }],
			],
		);
	});
});
