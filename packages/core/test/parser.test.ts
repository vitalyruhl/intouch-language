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

	test('diagnoses a missing DIM terminator without flagging a terminated DIM', () => {
		const missing = parseQuickScript('DIM TEXT6 AS MESSAGE');
		const terminated = parseQuickScript('DIM TEXT6 AS MESSAGE;');
		const diagnostic = missing.diagnostics.find(item => item.code === 'missing-semicolon');

		assert.ok(diagnostic);
		assert.deepStrictEqual(diagnostic.range, {
			start: { line: 0, character: 20 },
			end: { line: 0, character: 20 },
		});
		assert.ok(!terminated.diagnostics.some(item => item.code === 'missing-semicolon'));
	});

	test('diagnoses declaration- and FOR-shaped unknown statements locally without a NEXT cascade', () => {
		const document = parseQuickScript([
			'DI TEXT9 AS MESSAGE;',
			'FR TABINDEX = 1 TO StringLen(TEXT9)',
			'CALL LogMessage(TEXT9);',
			'NEXT;',
		].join('\n'));
		const invalidStatements = document.diagnostics.filter(item => item.code === 'invalid-statement');

		assert.deepStrictEqual(invalidStatements.map(item => item.range), [
			{ start: { line: 0, character: 0 }, end: { line: 0, character: 2 } },
			{ start: { line: 1, character: 0 }, end: { line: 1, character: 2 } },
		]);
		assert.ok(!document.diagnostics.some(item => item.code === 'invalid-nesting'));
	});

	test('does not require semicolons on block, control, or comment lines', () => {
		const document = parseQuickScript([
			'IF Ready THEN',
			'ELSE',
			'ENDIF;',
			'FOR Index = 1 TO 2',
			'NEXT;',
			'{Comment}',
		].join('\n'));

		assert.ok(!document.diagnostics.some(item => item.code === 'missing-semicolon'));
	});
});
