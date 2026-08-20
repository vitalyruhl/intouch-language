import * as assert from 'assert';

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
import { readSettings } from '../src/settings';

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
	});
});
