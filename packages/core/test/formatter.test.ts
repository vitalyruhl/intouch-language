import * as assert from 'assert';

import { formatQuickScript, formatQuickScriptLexically } from '../src/formatter';

suite('QuickScript lexical formatter', () => {
	test('normalizes tokens while preserving strings and comments', () => {
		const string = '"if  a==b  then {not a comment};"';
		const comment = '{ if  a==b  then "not a string"; }';
		const result = formatQuickScriptLexically(`dim Value as integer;\nMessageText=${string};\n${comment}`);

		assert.strictEqual(result.text, `DIM Value AS INTEGER;\r\nMessageText = ${string};\r\n${comment}`);
		assert.strictEqual(result.changed, true);
	});

	test('keeps dashed identifiers distinct from spaced subtraction', () => {
		const result = formatQuickScriptLexically('d- e + SYS-Tag - nextValue;');

		assert.strictEqual(result.text, 'd - e + SYS-Tag - nextValue;');
	});

	test('recognizes a closing quote after a trailing path separator', () => {
		const result = formatQuickScriptLexically('Path="\\\\share\\"; call Start(Path);');

		assert.strictEqual(result.text, 'Path = "\\\\share\\"; CALL Start(Path);');
	});

	test('is idempotent', () => {
		const once = formatQuickScriptLexically('if ( Value>=-1 ) then\nLogMessage("a  b");\nendif;').text;
		const twice = formatQuickScriptLexically(once).text;

		assert.strictEqual(twice, once);
	});

	test('returns normalized but otherwise unchanged malformed source', () => {
		const source = 'Message = "unfinished\nIF Value>1 THEN';
		const result = formatQuickScriptLexically(source);

		assert.strictEqual(result.text, 'Message = "unfinished\r\nIF Value>1 THEN');
	});

	test('uses parser structure for stable indentation', () => {
		const source = 'if Ready then\nfor Index=1 to 2\ncall Run(Index);\nnext;\nelse\ncall Stop();\nendif;';
		const once = formatQuickScript(source);
		const twice = formatQuickScript(once.text);

		assert.strictEqual(once.text, [
			'IF Ready THEN',
			'    FOR Index = 1 TO 2',
			'        CALL Run(Index);',
			'    NEXT;',
			'ELSE',
			'    CALL Stop();',
			'ENDIF;',
		].join('\r\n'));
		assert.strictEqual(twice.text, once.text);
	});

	test('preserves multiline comment blank lines unless explicitly configured', () => {
		const source = '{\nfirst\n\n\nsecond\n}\n\n\nValue=1;';
		const preserved = formatQuickScript(source, { allowedNumberOfEmptyLines: 1 });
		const compacted = formatQuickScript(source, { allowedNumberOfEmptyLines: 1, removeEmptyLinesInComments: true });

		assert.ok(preserved.text.includes('first\r\n\r\n\r\nsecond'));
		assert.ok(compacted.text.includes('first\r\n\r\nsecond'));
		assert.ok(!compacted.text.includes('first\r\n\r\n\r\nsecond'));
	});

	test('restores normal formatting after the reported multiline brace comment', () => {
		const source = [
			'CALL HideAllPLS();',
			'',
			'{Debug-Status Zwischenspeichern}',
			'',
			'{ DIM altDebug AS DISCRETE;',
			'',
			'altDebug = Sys_Debug_info;',
			'',
			'Sys_Debug_info = 1; }',
			'',
			'CALL xHerDebug(Funkt + " ", 0);',
		].join('\n');
		const once = formatQuickScript(source).text;
		const twice = formatQuickScript(once).text;

		assert.strictEqual(once, source.replace(/\n/g, '\r\n'));
		assert.strictEqual(twice, once);
	});

	test('moves a multiline brace comment as one relative-indentation block', () => {
		const source = [
			'{------------------------------------------------------------------------------}',
			'',
			'                { Button:',
			'                    CALL HideAllPLS( );',
			'                    TAB_AAF.Name = AT01_B0008B0020B0.Name;',
			'                    TAB_Sollwert.Reference = "";',
			'                    TAB_Einheit = "";',
			'                    PLSActive=sys_true;',
			'                    CALL TABHER012EA( );',
			'                }',
		].join('\n');
		const expected = [
			'{------------------------------------------------------------------------------}',
			'',
			'{ Button:',
			'    CALL HideAllPLS( );',
			'    TAB_AAF.Name = AT01_B0008B0020B0.Name;',
			'    TAB_Sollwert.Reference = "";',
			'    TAB_Einheit = "";',
			'    PLSActive=sys_true;',
			'    CALL TABHER012EA( );',
			'}',
		].join('\r\n');

		const once = formatQuickScript(source).text;
		const twice = formatQuickScript(once).text;

		assert.strictEqual(once, expected);
		assert.strictEqual(twice, once);
	});

	test('keeps configured comment directives separate from normal comment blocks', () => {
		const source = [
			'{>',
			'    { nested comment',
			'        relative text',
			'    }',
			'{<-------------------------------------------}',
			'{region sample}',
			'{endregion}',
		].join('\n');
		const once = formatQuickScript(source).text;

		assert.ok(once.includes('{>\r\n    { nested comment\r\n        relative text\r\n    }'));
		assert.ok(once.endsWith('{<-------------------------------------------}\r\n{region sample}\r\n{endregion}'));
		assert.strictEqual(formatQuickScript(once).text, once);
	});

	test('ends lexical preservation at a decorated block marker before later code', () => {
		const source = [
			'{>',
			'protected payload',
			'{<-------------------------------------------}',
			'{ DIM altDebug AS DISCRETE;',
			'altDebug = Sys_Debug_info;',
			'Sys_Debug_info = 1; }',
			'call xHerDebug(Funkt+" ",0);',
		].join('\n');

		const formatted = formatQuickScript(source).text;

		assert.ok(formatted.endsWith('CALL xHerDebug(Funkt + " ", 0);'));
	});
});
