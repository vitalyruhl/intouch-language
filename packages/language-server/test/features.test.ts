import * as assert from 'assert';

import * as fs from 'fs';
import * as path from 'path';

import { TextDocument } from 'vscode-languageserver-textdocument';

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
import { WorkspaceFunctionIndex } from '../src/workspaceFunctions';

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
		const settings = readSettings({ VBI: { formatter: {
			EmptyLine: { allowedNumberOfEmptyLines: 2, RemoveEmptyLines: true, EmptyLinesAlsoInComment: true },
			BC: { BlockCodeBegin: '{begin', BlockCodeEnd: '{end', BlockCodeExclude: '{back' },
			Region: { BlockCodeBegin: '{r', BlockCodeEnd: '{/r', BlockCodeExclude: '{rb' },
			Misc: { ReplaceTabToSpaces: false, IndentSize: 3 },
		} } });

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
		});
		assert.deepStrictEqual(formattingSettings(settings, { insertSpaces: true, tabSize: 8 }), settings);
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

	test('keeps extra comment nesting across blank lines through the language-server formatter entrypoint', () => {
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

	test('resolves QuickFunctions from open workspace documents case-insensitively', () => {
		const definitions = TextDocument.create('file:///definitions.vi', 'intouch', 1, 'Type: QuickFunction\nName: WorkspaceFunction');
		const caller = TextDocument.create('file:///caller.vbi', 'intouch', 1, 'CALL workspacefunction();\nCALL WorkspaceFunctio();');
		const workspace = new WorkspaceFunctionIndex();
		workspace.updateDocument(definitions);

		const diagnostics = diagnosticsFor(caller, workspace.knownFunctionNames()).filter(diagnostic => diagnostic.code === 'unknown-function');
		assert.deepStrictEqual(diagnostics.map(diagnostic => diagnostic.range.start), [{ line: 1, character: 5 }]);
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
});
