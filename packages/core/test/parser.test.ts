import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

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

	test('accepts the documented statement and expression productions', () => {
		const sources = [
			'DIM First, Second AS REAL;',
			'TABINDEX = (TABINDEX + 1) * 2;',
			'STATION2:S09BNOnline = NOT (Value == 0 OR Ready == FALSE);',
			'CALL Run(StringMid(TextValue, 1, 2));',
			'LogMessage("ready");',
			'StartApp SYS_ToolsPath + "\\Scheduler.exe";',
			'Show "Overview";',
			'IF INDEX == cpuen THEN EXIT FOR; ENDIF;',
			'FOR I = 1 TO StringLen(TextValue) STEP 2\nNEXT;',
			'WHILE First < Second\nFirst = First + 1;\nNEXT;',
			'RETURN Temp_Return;',
		];

		for (const source of sources) {
			assert.deepStrictEqual(parseQuickScript(source).diagnostics, [], source);
		}
	});

	test('keeps representative repository corpora diagnostic-clean', () => {
		const fixtures = [
			path.resolve(__dirname, '../../../packages/core/test/fixtures/representative.vbi'),
			path.resolve(__dirname, '../../../src/test/suite/testfiles/04.indentation.basic.nesting.tobe.vbi'),
			path.resolve(__dirname, '../../../src/test/suite/testfiles/05.comment_rules.nesting.tobe.vbi'),
			path.resolve(__dirname, '../../../src/test/suite/testfiles/06.region.nesting.tobe.vbi'),
			path.resolve(__dirname, '../../../src/test/suite/testfiles/07.instance.highlight.tobe.vbi'),
		];

		for (const fixture of fixtures) {
			const diagnostics = parseQuickScript(fs.readFileSync(fixture, 'utf8')).diagnostics;
			assert.deepStrictEqual(diagnostics, [], fixture);
		}
	});

	test('derives focused negative diagnostics from grammar expectations', () => {
		const cases: Array<{
			production: string;
			source: string;
			code: string;
			start: { line: number; character: number };
		}> = [
			{ production: 'DIM terminator', source: 'DIM X AS INTEGER', code: 'missing-semicolon', start: { line: 0, character: 16 } },
			{ production: 'DIM identifier', source: 'DIM AS INTEGER;', code: 'missing-identifier', start: { line: 0, character: 3 } },
			{ production: 'DIM AS', source: 'DIM X INTEGER;', code: 'missing-as', start: { line: 0, character: 13 } },
			{ production: 'assignment terminator', source: 'X = X + 1', code: 'missing-semicolon', start: { line: 0, character: 9 } },
			{ production: 'statement kind', source: 'X + X + 1;', code: 'expected-assignment', start: { line: 0, character: 0 } },
			{ production: 'IF terminator', source: 'IF X == 1 THEN;\nENDIF;', code: 'unexpected-semicolon', start: { line: 0, character: 14 } },
			{ production: 'IF THEN', source: 'IF X == 1\nENDIF;', code: 'missing-then', start: { line: 0, character: 9 } },
			{ production: 'FOR assignment operator', source: 'FOR I == 1 TO 10\nNEXT;', code: 'expected-equals', start: { line: 0, character: 6 } },
			{ production: 'FOR TO', source: 'FOR I = 1 10\nNEXT;', code: 'missing-to', start: { line: 0, character: 12 } },
			{ production: 'FOR variable', source: 'FOR = 1 TO 10\nNEXT;', code: 'missing-loop-variable', start: { line: 0, character: 4 } },
			{ production: 'CALL delimiter', source: 'CALL Foo(1; ', code: 'unclosed-delimiter', start: { line: 0, character: 10 } },
			{ production: 'block end', source: 'NEXT;', code: 'invalid-nesting', start: { line: 0, character: 0 } },
			{ production: 'block closer', source: 'IF Ready THEN', code: 'missing-endif', start: { line: 0, character: 0 } },
			{ production: 'unknown declaration', source: 'DI X AS INTEGER;', code: 'invalid-statement', start: { line: 0, character: 0 } },
		];

		for (const item of cases) {
			const found = parseQuickScript(item.source).diagnostics.find(candidate => candidate.code === item.code);
			assert.ok(found, `${item.production}: expected ${item.code}`);
			assert.deepStrictEqual(found.range.start, item.start, item.production);
		}
	});

	test('recovers malformed loop-shaped statements without a NEXT cascade', () => {
		const document = parseQuickScript('FR I = 1 TO 10\nCALL Run(I);\nNEXT;');

		assert.ok(document.diagnostics.some(item => item.code === 'invalid-statement' && item.range.start.line === 0));
		assert.ok(!document.diagnostics.some(item => item.code === 'invalid-nesting'));
	});

	test('applies deterministic grammar mutations to valid statements', () => {
		const mutations = [
			{ source: 'X = X + 1;', mutate: (value: string) => value.replace(/;$/, ''), code: 'missing-semicolon' },
			{ source: 'FOR I = 1 TO 10\nNEXT;', mutate: (value: string) => value.replace('I =', 'I =='), code: 'expected-equals' },
			{ source: 'IF Ready THEN\nENDIF;', mutate: (value: string) => value.replace(' THEN', ''), code: 'missing-then' },
			{ source: 'CALL Run(I);', mutate: (value: string) => value.replace(')', ''), code: 'unclosed-delimiter' },
		];

		for (const mutation of mutations) {
			assert.deepStrictEqual(parseQuickScript(mutation.source).diagnostics, [], mutation.source);
			assert.ok(parseQuickScript(mutation.mutate(mutation.source)).diagnostics.some(item => item.code === mutation.code));
		}
	});
});
