import * as assert from 'assert';

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
			"' DIM X AS FALSCH; CALL NichtVorhanden();",
			'{> Version Name Usage CALL DIM NichtVorhanden()}',
		];

		for (const source of sources) {
			assert.deepStrictEqual(analyzeQuickScript(source).diagnostics, [], source);
		}
	});

	test('separates CALL expression syntax from known-function resolution', () => {
		const known = analyzeQuickScript([
			'X = CALL GetSplittByIndex(Source, ".", 1);',
			'Object.Field = CALL SetReferenceBool(Topic, 1, Bit);',
			'X = StringLower(CALL GetSplittByIndex(Source, ".", 1));',
		].join('\n'));
		const unknown = analyzeQuickScript('X = CALL GetSplittByIndeXx(Source, ".", 1);');

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
