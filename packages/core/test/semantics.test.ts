import * as assert from 'assert';

import { KNOWN_FUNCTIONS } from '../src/generatedFunctionCatalog';
import { analyzeQuickScript, definitionAt, referencesAt } from '../src/semantics';

suite('QuickScript semantic model', () => {
	test('resolves document-local DIM declarations case-insensitively', () => {
		const source = 'DIM Counter AS INTEGER;\nCounter = counter + 1;\nCALL Report(Counter);';
		const model = analyzeQuickScript(source);

		assert.deepStrictEqual(model.symbols.map(symbol => [symbol.name, symbol.datatype]), [['Counter', 'INTEGER']]);
		assert.strictEqual(model.references.filter(reference => reference.declarationId === 0).length, 4);
		assert.deepStrictEqual(definitionAt(model, { line: 1, character: 12 }), model.symbols[0].selectionRange);
		assert.strictEqual(referencesAt(model, { line: 0, character: 5 }).length, 4);
	});

	test('reports duplicate local DIM declarations', () => {
		const model = analyzeQuickScript('DIM Value AS REAL;\nDIM value AS REAL;');

		assert.ok(model.diagnostics.some(item => item.code === 'duplicate-local'));
	});

	test('does not guess definitions for unknown names or member accesses', () => {
		const model = analyzeQuickScript('DIM Value AS REAL;\nObject.Value = Unknown;');

		assert.strictEqual(definitionAt(model, { line: 1, character: 7 }), undefined);
		assert.strictEqual(definitionAt(model, { line: 1, character: 15 }), undefined);
	});

	test('does not emit syntax or semantic diagnostics from comment tokens', () => {
		const sources = [
			[
				'{',
				'Version history:',
				'DIM X AS FALSCH;',
				'CALL NichtVorhanden();',
				'FR I = 1 TO 10',
				'IF X THEN;',
				'TABINDEX + TABINDEX + 1;',
				'}',
			].join('\n'),
			[
				'{>',
				'Script:',
				'Type: QuickFunction',
				'Name: Test',
				'',
				'Version history:',
				'DIM X AS FALSCH;',
				'CALL NichtVorhanden();',
				'FR I = 1 TO 10',
				'{<}',
			].join('\n'),
			"' DIM X AS FALSCH; CALL NichtVorhanden();",
			'{> Version Name Usage CALL DIM NichtVorhanden()}',
		];

		for (const source of sources) {
			assert.deepStrictEqual(analyzeQuickScript(source).diagnostics, [], source);
		}
	});

	test('keeps diagnostics active between same-line-closed nesting markers', () => {
		const model = analyzeQuickScript([
			'{> following code shall be nested}',
			'DIM X AS FALSCH;',
			'CALL NichtVorhanden();',
			'{<-------------------------------------------}',
		].join('\n'));

		assert.deepStrictEqual(model.diagnostics.map(item => item.code), ['unknown-datatype', 'unknown-function']);
	});

	test('preserves native function knowledge without accepting misspellings', () => {
		const catalogEntries = ['LogMessage', 'StringLeft', 'TagExists']
			.map(name => KNOWN_FUNCTIONS.find(item => item.name === name));
		const model = analyzeQuickScript('CALL LogMessage("ok");\nCALL LogMessageX("ok");');

		assert.ok(catalogEntries.every(item => item !== undefined));
		assert.deepStrictEqual(
			model.diagnostics.filter(item => item.code === 'unknown-function').map(item => item.range.start),
			[{ line: 1, character: 5 }],
		);
	});

	test('separates CALL expression syntax from known-function resolution', () => {
		const known = analyzeQuickScript([
			'X = CALL StringLeft(Source, 1);',
			'Object.Field = CALL StringRight(Topic, 1);',
			'X = StringLower(CALL StringLeft(Source, 1));',
		].join('\n'));
		const unknown = analyzeQuickScript('X = CALL StringLeftX(Source, 1);');

		assert.deepStrictEqual(known.diagnostics, []);
		assert.deepStrictEqual(unknown.diagnostics.map(item => [item.code, item.range.start]), [
			['unknown-function', { line: 0, character: 9 }],
		]);
	});

	test('uses the existing definition and reference path for CALL expression targets', () => {
		const source = [
			'DIM LocalCallable AS INTEGER;',
			'CALL LocalCallable();',
			'Value = CALL LocalCallable();',
			'Value = Wrapper(CALL LocalCallable());',
		].join('\n');
		const model = analyzeQuickScript(source, { knownFunctionNames: ['LocalCallable', 'Wrapper'] });
		const callReferences = model.references.filter(reference => reference.name === 'LocalCallable' && reference.kind === 'call');

		assert.strictEqual(callReferences.length, 3);
		assert.deepStrictEqual(definitionAt(model, { line: 2, character: 15 }), model.symbols[0].selectionRange);
		assert.strictEqual(referencesAt(model, { line: 2, character: 15 }).length, 4);
	});
});
