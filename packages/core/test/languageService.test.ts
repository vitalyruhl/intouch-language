import * as assert from 'assert';

import { completions, documentSymbols, hoverAt } from '../src/languageService';
import { analyzeQuickScript } from '../src/semantics';

suite('QuickScript language service', () => {
	const source = 'DIM Counter AS INTEGER;\nIF Counter > 0 THEN\nCALL LogMessage("ok");\nCALL WorkspaceFunction();\nENDIF;';
	const model = analyzeQuickScript(source);

	test('offers keywords, datatypes, native functions, locals, and call targets', () => {
		const entries = completions(model);
		const byLabel = new Map(entries.map(entry => [entry.label.toUpperCase(), entry]));

		assert.strictEqual(byLabel.get('IF')?.kind, 'keyword');
		assert.strictEqual(byLabel.get('INTEGER')?.kind, 'datatype');
		assert.strictEqual(byLabel.get('LOGMESSAGE')?.kind, 'function');
		assert.strictEqual(byLabel.get('WORKSPACEFUNCTION')?.kind, 'call-target');
		assert.strictEqual(byLabel.get('COUNTER')?.kind, 'variable');
	});

	test('returns hover only for facts backed by language or document data', () => {
		assert.strictEqual(hoverAt(model, { line: 0, character: 5 })?.detail, 'Local INTEGER variable');
		assert.match(hoverAt(model, { line: 2, character: 8 })?.detail ?? '', /IT-functions/);
		assert.strictEqual(hoverAt(analyzeQuickScript('Value = CALL WorkspaceFunction();'), { line: 0, character: 15 }), undefined);
		assert.strictEqual(hoverAt(analyzeQuickScript('UnknownName;'), { line: 0, character: 2 }), undefined);
	});

	test('builds variable and hierarchical block symbols', () => {
		const symbols = documentSymbols(model);

		assert.deepStrictEqual(symbols.map(symbol => symbol.kind), ['variable', 'if']);
	});

	test('builds metadata-backed QuickFunction, Window, and KeyScript outlines', () => {
		const quickFunction = documentSymbols(analyzeQuickScript('{>\n@ScriptType QuickFunction\n@Name Foo\n{<}\nDIM Value AS INTEGER;'));
		const window = documentSymbols(analyzeQuickScript('{>\n@ScriptType Window\n@Name MainWindow\n@Event OnShow\n{<}\nDIM Value AS INTEGER;'));
		const keyScript = documentSymbols(analyzeQuickScript('{>\n@ScriptType KeyScript\n@Name OpenPrint\n@Shortcut Ctrl+d\n{<}'));

		assert.deepStrictEqual([quickFunction[0].name, quickFunction[0].kind, quickFunction[0].children[0].kind], ['Foo', 'function', 'variable']);
		assert.deepStrictEqual([window[0].name, window[0].kind, window[0].children[0].name], ['MainWindow', 'window', 'OnShow']);
		assert.deepStrictEqual([keyScript[0].name, keyScript[0].kind, keyScript[0].children[0].name], ['OpenPrint', 'key-script', 'Ctrl+d']);
	});
});
