import * as assert from 'assert';

import { parseQuickScript } from '../src/parser';

suite('QuickScript structure parser', () => {
	test('builds nested IF and FOR blocks with parent-child ranges', () => {
		const source = 'IF Ready THEN\nFOR Index = 1 TO 2\nCALL Run(Index);\nNEXT;\nELSE\nCALL Stop();\nENDIF;';
		const document = parseQuickScript(source);

		assert.deepStrictEqual(document.blocks.map(block => block.kind), ['if', 'for']);
		assert.strictEqual(document.blocks[1].parentId, document.blocks[0].id);
		assert.deepStrictEqual(document.blocks[0].childIds, [document.blocks[1].id]);
		assert.ok(document.blocks.every(block => block.closer !== undefined));
		assert.deepStrictEqual(document.lines.map(line => line.indentDepth), [0, 1, 2, 1, 0, 1, 0]);
		assert.deepStrictEqual(document.diagnostics, []);
	});

	test('recovers from invalid nesting and reports missing closers', () => {
		const document = parseQuickScript('IF Ready THEN\nFOR Index = 1 TO 2\nENDIF;');

		assert.ok(document.diagnostics.some(item => item.code === 'invalid-nesting'));
		assert.ok(document.diagnostics.some(item => item.code === 'missing-endif'));
		assert.ok(document.diagnostics.some(item => item.code === 'missing-next'));
	});

	test('parses DIM and CALL statements and diagnoses unknown datatypes', () => {
		const document = parseQuickScript('DIM Counter AS INTEGER;\nDIM Broken AS Bogus;\nCALL Start(Counter);');
		const declarations = document.statements.filter(statement => statement.kind === 'dim');
		const call = document.statements.find(statement => statement.kind === 'call');

		assert.deepStrictEqual(declarations.map(statement => [statement.name, statement.datatype]), [
			['Counter', 'INTEGER'],
			['Broken', 'Bogus'],
		]);
		assert.strictEqual(call?.name, 'Start');
		assert.ok(document.diagnostics.some(item => item.code === 'unknown-datatype'));
	});

	test('does not treat EXIT FOR as an opener', () => {
		const document = parseQuickScript('FOR Index = 1 TO 2\nIF Done THEN EXIT FOR; ENDIF;\nNEXT;');

		assert.deepStrictEqual(document.blocks.map(block => block.kind), ['for', 'if']);
		assert.deepStrictEqual(document.diagnostics, []);
	});

	test('supports multiple DIM names and repository-evidenced WHILE/NEXT blocks', () => {
		const document = parseQuickScript('DIM First, Second AS REAL;\nWHILE First < Second\nFirst = First + 1;\nNEXT;');

		assert.deepStrictEqual(
			document.statements.filter(statement => statement.kind === 'dim').map(statement => statement.name),
			['First', 'Second'],
		);
		assert.strictEqual(document.blocks[0].kind, 'while');
		assert.deepStrictEqual(document.lines.map(line => line.indentDepth), [0, 0, 1, 0]);
		assert.deepStrictEqual(document.diagnostics, []);
	});
});
