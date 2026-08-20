import * as assert from 'assert';

import { offsetAt, positionAt, sourceRange } from '../src/source';

suite('core source model', () => {
	const source = 'alpha\r\nβ😀\n';

	test('uses zero-based UTF-16 positions across supported newline forms', () => {
		assert.deepStrictEqual(positionAt(source, 0), { line: 0, character: 0 });
		assert.deepStrictEqual(positionAt(source, 5), { line: 0, character: 5 });
		assert.deepStrictEqual(positionAt(source, 7), { line: 1, character: 0 });
		assert.deepStrictEqual(positionAt(source, 10), { line: 1, character: 3 });
		assert.deepStrictEqual(positionAt(source, 11), { line: 2, character: 0 });
	});

	test('maps valid positions back to offsets', () => {
		assert.strictEqual(offsetAt(source, { line: 0, character: 5 }), 5);
		assert.strictEqual(offsetAt(source, { line: 1, character: 3 }), 10);
		assert.strictEqual(offsetAt(source, { line: 2, character: 0 }), 11);
	});

	test('uses inclusive starts and exclusive ends for ranges', () => {
		assert.deepStrictEqual(sourceRange(source, { start: 7, end: 10 }), {
			span: { start: 7, end: 10 },
			range: {
				start: { line: 1, character: 0 },
				end: { line: 1, character: 3 },
			},
		});
	});

	test('rejects offsets and positions outside the source', () => {
		assert.throws(() => positionAt(source, -1), RangeError);
		assert.throws(() => positionAt(source, source.length + 1), RangeError);
		assert.throws(() => offsetAt(source, { line: 1, character: 4 }), RangeError);
		assert.throws(() => sourceRange(source, { start: 4, end: 3 }), RangeError);
	});
});
