import * as assert from 'assert';

import { completions, documentSymbols, hoverAt } from '../src/languageService';
import { analyzeQuickScript } from '../src/semantics';

suite('QuickScript language service', () => {
	const source = 'DIM Counter AS INTEGER;\nIF Counter > 0 THEN\nCALL LogMessage("ok");\nCALL xGatawaySettings();\nENDIF;';
	const model = analyzeQuickScript(source);

	test('offers keywords, datatypes, sourced functions, Hermes helpers, locals, and call targets', () => {
		const entries = completions(model);
		const byLabel = new Map(entries.map(entry => [entry.label.toUpperCase(), entry]));

		assert.strictEqual(byLabel.get('IF')?.kind, 'keyword');
		assert.strictEqual(byLabel.get('INTEGER')?.kind, 'datatype');
		assert.strictEqual(byLabel.get('LOGMESSAGE')?.kind, 'function');
		assert.strictEqual(byLabel.get('XGATAWAYSETTINGS')?.kind, 'function');
		assert.strictEqual(byLabel.get('COUNTER')?.kind, 'variable');
	});

	test('returns hover only for facts backed by language or document data', () => {
		assert.strictEqual(hoverAt(model, { line: 0, character: 5 })?.detail, 'Local INTEGER variable');
		assert.match(hoverAt(model, { line: 2, character: 8 })?.detail ?? '', /IT-functions/);
		assert.strictEqual(hoverAt(analyzeQuickScript('UnknownName;'), { line: 0, character: 2 }), undefined);
	});

	test('builds variable and hierarchical block symbols', () => {
		const symbols = documentSymbols(model);

		assert.deepStrictEqual(symbols.map(symbol => symbol.kind), ['variable', 'if']);
	});
});
