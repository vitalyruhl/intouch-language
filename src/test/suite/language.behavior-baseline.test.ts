import * as assert from 'assert';

import { formatNestings, getConfig, preFormat } from './formatterTestSupport';

const config = getConfig();

suite('QuickScript formatter behavior baseline', () => {
	test('preserves representative language constructs while formatting code', () => {
		const input = [
			'dim MessageText as message;',
			'dim Index as integer;',
			'if Index>=1 then',
			'LogMessage("if {not a comment} >= 1");',
			'else',
			"{ call FakeFunction(1); inside a comment }",
			'for Index=1 to 2 step 1',
			'call xGatawaySettings();',
			'next;',
			'endif;',
		].join('\n');

		const formatted = formatNestings(preFormat(input, config), config);

		assert.match(formatted, /DIM MessageText AS MESSAGE;/);
		assert.match(formatted, /DIM Index AS INTEGER;/);
		assert.match(formatted, /IF Index >= 1 THEN/);
		assert.match(formatted, /LogMessage\("if \{not a comment\} >= 1"\);/);
		assert.match(formatted, /ELSE/);
		assert.match(formatted, /\{ call FakeFunction\(1\); inside a comment \}/);
		assert.match(formatted, /FOR Index = 1 TO 2 STEP 1/);
		assert.match(formatted, /CALL xGatawaySettings\(\);/);
		assert.match(formatted, /NEXT;/);
		assert.match(formatted, /ENDIF;/);
	});

	test('treats keywords case-insensitively without changing identifiers', () => {
		const input = 'iF ifValue == 1 tHeN\nendifValue = ifValue;\neNdIf;';
		const formatted = preFormat(input, config);

		assert.match(formatted, /^IF ifValue == 1 THEN/m);
		assert.match(formatted, /^endifValue = ifValue;/m);
		assert.match(formatted, /^ENDIF;/m);
	});

	test('keeps strings and brace comments byte-for-byte intact', () => {
		const string = '"if  a==b  then {comment-like};"';
		const comment = '{ if  a==b  then "string-like"; }';
		const formatted = preFormat(`MessageText=${string};\n${comment}`, config);

		assert.ok(formatted.includes(string));
		assert.ok(formatted.includes(comment));
	});

	test('does not throw or drop an incomplete final statement', () => {
		const input = 'if Reading >';
		let formatted = '';

		assert.doesNotThrow(() => {
			formatted = formatNestings(preFormat(input, config), config);
		});
		assert.match(formatted, /IF Reading >\s*$/);
	});
});
