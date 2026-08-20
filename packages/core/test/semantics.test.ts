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
});
