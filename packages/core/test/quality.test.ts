import * as assert from 'assert';

import {
	QUALITY_DIAGNOSTIC_CODES,
	analyzeQuickScript,
	definitionAt,
	qualityDiagnostics,
	referencesAt,
} from '../src';

suite('QuickScript quality diagnostics', () => {
	test('warns once per non-ASCII identifier without changing language validity', () => {
		const source = [
			'DIM Größe AS INTEGER;',
			'DIM Lüfter1 AS DISCRETE;',
			'Größe = Größe + 1;',
		].join('\n');
		const model = analyzeQuickScript(source);
		const diagnostics = qualityDiagnostics(model);

		assert.deepStrictEqual(model.diagnostics, []);
		assert.deepStrictEqual(diagnostics.map(item => [item.code, item.severity, item.range.start]), [
			[QUALITY_DIAGNOSTIC_CODES.nonAsciiIdentifier, 'warning', { line: 0, character: 4 }],
			[QUALITY_DIAGNOSTIC_CODES.nonAsciiIdentifier, 'warning', { line: 1, character: 4 }],
		]);
		assert.ok(diagnostics.every(item => item.source === 'intouch-quality'));
	});

	test('keeps ASCII identifier forms clean', () => {
		const model = analyzeQuickScript([
			'DIM Groesse AS INTEGER;',
			'DIM TABINDEX AS INTEGER;',
			'DIM _Temp AS INTEGER;',
			'SYS_Tag-Name = $Second + #Trend;',
		].join('\n'));

		assert.deepStrictEqual(qualityDiagnostics(model), []);
	});

	test('checks QuickFunction and parameter declarations from metadata comment tokens', () => {
		const source = [
			'{>',
			'Type: QuickFunction',
			'Name: Fünktion',
			'',
			'Parameters:',
			'Integer Größe',
			'',
			'Usage:',
			'CALL Fünktion(Größe);',
			'{<}',
		].join('\n');
		const model = analyzeQuickScript(source);

		assert.deepStrictEqual(model.quickFunctions.map(item => item.name), ['Fünktion']);
		assert.deepStrictEqual(model.quickFunctions[0].parameters.map(item => item.name), ['Größe']);
		assert.deepStrictEqual(qualityDiagnostics(model).map(item => item.range.start), [
			{ line: 2, character: 6 },
			{ line: 5, character: 8 },
		]);
	});

	test('checks only literal names in documented window-operation contexts', () => {
		const source = [
			'Show "Anlage1";',
			'Show "Anlage 1";',
			'Hide "Übersicht";',
			'ShowAt("Anlage Übersicht", 10, 20);',
			'MoveWindow("Fenster Zwei", 0, 0, 10, 10);',
			'PrintWindow("FensterÜ", 0, 0, 10, 10, 0);',
			'StatusMessage = "Störung Lüftung Süd";',
			'LogMessage("Störung Lüftung");',
		].join('\n');
		const diagnostics = qualityDiagnostics(analyzeQuickScript(source));

		assert.deepStrictEqual(diagnostics.map(item => [item.code, item.range.start.line]), [
			[QUALITY_DIAGNOSTIC_CODES.windowWhitespace, 1],
			[QUALITY_DIAGNOSTIC_CODES.windowNonAscii, 2],
			[QUALITY_DIAGNOSTIC_CODES.windowWhitespace, 3],
			[QUALITY_DIAGNOSTIC_CODES.windowNonAscii, 3],
			[QUALITY_DIAGNOSTIC_CODES.windowWhitespace, 4],
			[QUALITY_DIAGNOSTIC_CODES.windowNonAscii, 5],
		]);
	});

	test('keeps strings, brace comments, and apostrophe comments isolated', () => {
		const source = [
			'StatusMessage = "Störung Lüftung Süd";',
			'{',
			'DIM Größe AS INTEGER;',
			'Show "Übersicht Anlage";',
			'}',
			'\' Show "Übersicht Anlage";',
		].join('\n');

		assert.deepStrictEqual(qualityDiagnostics(analyzeQuickScript(source)), []);
	});

	test('supports configurable severity and off without changing navigation', () => {
		const source = 'DIM Größe AS INTEGER;\nGröße = Größe + 1;';
		const model = analyzeQuickScript(source);

		assert.strictEqual(qualityDiagnostics(model, { nonAsciiIdentifiers: 'off' }).length, 0);
		for (const severity of ['hint', 'information', 'warning', 'error'] as const) {
			assert.strictEqual(qualityDiagnostics(model, { nonAsciiIdentifiers: severity })[0].severity, severity);
		}
		assert.deepStrictEqual(definitionAt(model, { line: 1, character: 1 }), { start: { line: 0, character: 4 }, end: { line: 0, character: 9 } });
		assert.strictEqual(referencesAt(model, { line: 0, character: 5 }).length, 3);
	});
});
