import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { positionAt } from '../src/source';
import { Token, TokenKind } from '../src/token';
import { tokenize } from '../src/tokenizer';

function significant(tokens: Token[]): Token[] {
	return tokens.filter(token => token.kind !== TokenKind.Whitespace && token.kind !== TokenKind.Newline);
}

suite('QuickScript tokenizer', () => {
	test('classifies representative declarations, control flow, calls, and values', () => {
		const tokens = significant(tokenize('dim MessageText as message; IF Reading>=10.5 THEN CALL LogMessage("ok"); ENDIF;'));
		const actual = tokens.map(token => [token.kind, token.lexeme]);

		assert.deepStrictEqual(actual, [
			[TokenKind.Keyword, 'dim'],
			[TokenKind.Identifier, 'MessageText'],
			[TokenKind.Keyword, 'as'],
			[TokenKind.Datatype, 'message'],
			[TokenKind.Punctuation, ';'],
			[TokenKind.Keyword, 'IF'],
			[TokenKind.Identifier, 'Reading'],
			[TokenKind.Operator, '>='],
			[TokenKind.Number, '10.5'],
			[TokenKind.Keyword, 'THEN'],
			[TokenKind.Keyword, 'CALL'],
			[TokenKind.Identifier, 'LogMessage'],
			[TokenKind.Punctuation, '('],
			[TokenKind.String, '"ok"'],
			[TokenKind.Punctuation, ')'],
			[TokenKind.Punctuation, ';'],
			[TokenKind.Keyword, 'ENDIF'],
			[TokenKind.Punctuation, ';'],
			[TokenKind.EOF, ''],
		]);
	});

	test('preserves case and treats InTouch and Hermes function names as identifiers', () => {
		const tokens = significant(tokenize('CALL LogMessage(); CALL xGatawaySettings();'));
		const identifiers = tokens.filter(token => token.kind === TokenKind.Identifier);

		assert.deepStrictEqual(identifiers.map(token => token.lexeme), ['LogMessage', 'xGatawaySettings']);
	});

	test('recognizes established identifier forms without splitting instance prefixes', () => {
		const tokens = significant(tokenize('STATION1:S09BNOnline = SYS_Tag-Name; $Second = #Trend;'));
		const identifiers = tokens.filter(token => token.kind === TokenKind.Identifier);

		assert.deepStrictEqual(
			identifiers.map(token => token.lexeme),
			['STATION1', 'S09BNOnline', 'SYS_Tag-Name', '$Second', '#Trend'],
		);
	});

	test('keeps Unicode letters and numbers inside QuickScript identifiers', () => {
		const tokens = significant(tokenize('Größe2 = Außentemperatur_1 + 123Pump.Name + 2-3;'));
		const identifiers = tokens.filter(token => token.kind === TokenKind.Identifier);

		assert.deepStrictEqual(identifiers.map(token => token.lexeme), ['Größe2', 'Außentemperatur_1', '123Pump', 'Name']);
		assert.ok(tokens.some(token => token.kind === TokenKind.Operator && token.lexeme === '-'));
	});

	test('keeps syntax-looking text inside strings and comments', () => {
		const source = 'Empty = ""; Message = "IF {not a comment} then"; { IF a >= 1 }\n\' NEXT is a comment';
		const tokens = tokenize(source);

		assert.deepStrictEqual(
			tokens.filter(token => token.kind === TokenKind.String).map(token => token.lexeme),
			['""', '"IF {not a comment} then"'],
		);
		assert.deepStrictEqual(
			tokens.filter(token => token.kind === TokenKind.Comment).map(token => token.lexeme),
			['{ IF a >= 1 }', "' NEXT is a comment"],
		);
	});

	test('ends a multiline brace comment at its closing brace and resumes code tokens', () => {
		const source = [
			'{ DIM altDebug AS DISCRETE;',
			'',
			'altDebug = Sys_Debug_info;',
			'',
			'Sys_Debug_info = 1; }',
			'',
			'CALL xHerDebug(Funkt + " ", 0);',
		].join('\n');
		const tokens = tokenize(source);
		const comment = tokens.find(token => token.kind === TokenKind.Comment);
		const call = tokens.find(token => token.kind === TokenKind.Keyword && token.lexeme === 'CALL');

		assert.deepStrictEqual(comment?.range, {
			start: { line: 0, character: 0 },
			end: { line: 4, character: 21 },
		});
		assert.deepStrictEqual(call?.range.start, { line: 6, character: 0 });
	});

	test('keeps invalid-looking multiline QuickScript inside one comment token', () => {
		const source = [
			'{',
			'Version history:',
			'DIM X AS FALSCH;',
			'CALL NichtVorhanden();',
			'FR I = 1 TO 10',
			'IF X THEN;',
			'TABINDEX + TABINDEX + 1;',
			'}',
		].join('\n');
		const content = tokenize(source).filter(token => token.kind !== TokenKind.EOF);

		assert.strictEqual(content.length, 1);
		assert.strictEqual(content[0].kind, TokenKind.Comment);
		assert.strictEqual(content[0].lexeme, source);
	});

	test('keeps an unclosed metadata opener through the later closing brace in one comment token', () => {
		const source = [
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
		].join('\n');
		const content = tokenize(source).filter(token => token.kind !== TokenKind.EOF);

		assert.strictEqual(content.length, 1);
		assert.strictEqual(content[0].kind, TokenKind.Comment);
		assert.strictEqual(content[0].lexeme, source);
		assert.strictEqual(content.map(token => token.lexeme).join(''), source);
	});

	test('keeps code between same-line-closed nesting markers as QuickScript tokens', () => {
		const source = [
			'{> following code shall be nested}',
			'DIM X AS FALSCH;',
			'CALL NichtVorhanden();',
			'{<-------------------------------------------}',
		].join('\n');
		const tokens = tokenize(source);
		const comments = tokens.filter(token => token.kind === TokenKind.Comment);

		assert.deepStrictEqual(comments.map(token => token.lexeme), [
			'{> following code shall be nested}',
			'{<-------------------------------------------}',
		]);
		assert.ok(tokens.some(token => token.kind === TokenKind.Keyword && token.lexeme === 'DIM'));
		assert.ok(tokens.some(token => token.kind === TokenKind.Keyword && token.lexeme === 'CALL'));
		assert.strictEqual(tokens.slice(0, -1).map(token => token.lexeme).join(''), source);
	});

	test('matches operators longest-first and recognizes QuickScript punctuation', () => {
		const tokens = significant(tokenize('A==B; C<>D; E<=F; G>=H; Tag.Field->Method()[1], X:Y;'));

		assert.deepStrictEqual(
			tokens.filter(token => token.kind === TokenKind.Operator).map(token => token.lexeme),
			['==', '<>', '<=', '>=', '->'],
		);
		assert.deepStrictEqual(
			tokens.filter(token => token.kind === TokenKind.Punctuation).map(token => token.lexeme),
			[';', ';', ';', ';', '.', '(', ')', '[', ']', ',', ':', ';'],
		);
	});

	test('tracks CRLF positions and half-open offsets', () => {
		const tokens = tokenize('IF\r\nReading >= 10;');
		const keyword = tokens[0];
		const newline = tokens[1];
		const identifier = tokens[2];

		assert.deepStrictEqual(keyword.span, { start: 0, end: 2 });
		assert.deepStrictEqual(keyword.range, { start: { line: 0, character: 0 }, end: { line: 0, character: 2 } });
		assert.deepStrictEqual(newline.span, { start: 2, end: 4 });
		assert.deepStrictEqual(newline.range.end, { line: 1, character: 0 });
		assert.deepStrictEqual(identifier.range, { start: { line: 1, character: 0 }, end: { line: 1, character: 7 } });
	});

	test('returns stable tokens for unclosed strings and unknown characters', () => {
		const tokens = tokenize('Message = "unfinished\n@');

		assert.strictEqual(tokens.find(token => token.kind === TokenKind.String)?.lexeme, '"unfinished');
		assert.strictEqual(tokens.find(token => token.kind === TokenKind.Unknown)?.lexeme, '@');
		assert.strictEqual(tokens[tokens.length - 1].kind, TokenKind.EOF);
	});

	for (const fixture of ['representative.vbi', 'incomplete.vi']) {
		test(`maintains token invariants for ${fixture}`, () => {
			const fixturePath = path.resolve(__dirname, '../../../packages/core/test/fixtures', fixture);
			const source = fs.readFileSync(fixturePath, 'utf8');
			const tokens = tokenize(source);
			const contentTokens = tokens.slice(0, -1);

			assert.strictEqual(contentTokens.map(token => token.lexeme).join(''), source);
			assert.strictEqual(tokens[tokens.length - 1].kind, TokenKind.EOF);
			for (let index = 0; index < tokens.length; index += 1) {
				const token = tokens[index];
				assert.ok(token.span.start >= 0);
				assert.ok(token.span.end >= token.span.start);
				assert.ok(token.span.end <= source.length);
				assert.deepStrictEqual(token.range.start, positionAt(source, token.span.start));
				assert.deepStrictEqual(token.range.end, positionAt(source, token.span.end));
				if (index > 0) {
					assert.strictEqual(token.span.start, tokens[index - 1].span.end);
				}
			}
		});
	}
});
