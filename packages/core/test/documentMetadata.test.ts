import * as assert from 'assert';

import { extractDocumentMetadata } from '../src/documentMetadata';
import { analyzeQuickScript } from '../src/semantics';

suite('QuickScript document metadata', () => {
	test('extracts explicit QuickFunction metadata exclusively from comment tokens', () => {
		const source = [
			'{>',
			'@ScriptType QuickFunction',
			'@Name GetSomething',
			'@Description Returns something useful.',
			'@Param Source MESSAGE Source value.',
			'@Param Index INTEGER Requested index.',
			'@Returns MESSAGE',
			'CALL MissingExample() remains comment text.',
			'{<}',
		].join('\n');
		const metadata = extractDocumentMetadata(source, { fileName: 'SomethingCompletelyDifferent.vbi' });
		const model = analyzeQuickScript(source, { fileName: 'SomethingCompletelyDifferent.vbi' });

		assert.strictEqual(metadata.scriptType, 'QuickFunction');
		assert.strictEqual(metadata.name, 'GetSomething');
		assert.strictEqual(metadata.metadataSource, 'explicit');
		assert.deepStrictEqual(metadata.parameters.map(parameter => [parameter.name, parameter.datatype, parameter.description]), [
			['Source', 'MESSAGE', 'Source value.'],
			['Index', 'INTEGER', 'Requested index.'],
		]);
		assert.strictEqual(metadata.returnType, 'MESSAGE');
		assert.deepStrictEqual(model.diagnostics, []);
		assert.strictEqual(model.quickFunctions[0].name, 'GetSomething');
	});

	test('extracts documented legacy InTouch script types and context fields', () => {
		const cases = [
			['Type: QuickFunction\nName: Foo\nParameters:\nInteger Index', 'QuickFunction', 'Foo', undefined, undefined],
			['Type: ApplicationScript\nName: APP_Application_on_startup', 'Application', 'APP_Application_on_startup', undefined, undefined],
			['Type: datachange\nTagname[.field]: SomeTag', 'DataChange', undefined, 'SomeTag', undefined],
			['Type: ConditionalScript\nName: ConditionScript\nCondition: Ready\nCondition Type: OnTrue', 'Condition', 'ConditionScript', 'Ready', 'OnTrue'],
		] as const;

		for (const [body, scriptType, name, trigger, event] of cases) {
			const metadata = extractDocumentMetadata(`{>\n${body}\n{<}`);
			assert.strictEqual(metadata.scriptType, scriptType);
			assert.strictEqual(metadata.name, name);
			assert.strictEqual(metadata.trigger, trigger);
			assert.strictEqual(metadata.event, event);
			assert.strictEqual(metadata.metadataSource, 'legacy');
		}
	});

	test('preserves DataChange triggers as metadata references without variable diagnostics', () => {
		const model = analyzeQuickScript('{>\n@ScriptType DataChange\n@Trigger SomeGlobalVariable\n{<}');

		assert.deepStrictEqual(model.references.map(reference => [reference.name, reference.kind]), [['SomeGlobalVariable', 'trigger']]);
		assert.ok(!model.diagnostics.some(diagnostic => diagnostic.code === 'unknown-variable'));
	});

	test('models KeyScript shortcuts as canonical InTouch metadata', () => {
		const legacy = extractDocumentMetadata([
			'{>',
			'Type: KeyScript',
			'Name: KEY_Ctrl_D',
			'Parameters:',
			'Shortcut: Ctrl+d',
			'{<}',
		].join('\n'));
		const explicit = extractDocumentMetadata([
			'{>',
			'@ScriptType KeyScript',
			'@Name OpenPrintWindow',
			'@Shortcut Ctrl+d',
			'{<}',
		].join('\n'));

		assert.deepStrictEqual([legacy.scriptType, legacy.shortcut], ['KeyScript', 'Ctrl+d']);
		assert.deepStrictEqual([explicit.scriptType, explicit.shortcut], ['KeyScript', 'Ctrl+d']);
	});

	test('prefers explicit metadata, reports conflicts, and uses filenames only as fallback', () => {
		const conflict = extractDocumentMetadata([
			'{>',
			'@ScriptType QuickFunction',
			'@Name ExplicitName',
			'Type: DataChange',
			'Name: LegacyName',
			'{<}',
		].join('\n'), { fileName: 'DCH_FileName_1.0.0.vbi' });
		const fallback = extractDocumentMetadata('', { fileName: 'QF_FallbackName_1.0.0.vbi' });

		assert.deepStrictEqual([conflict.scriptType, conflict.name, conflict.metadataSource], ['QuickFunction', 'ExplicitName', 'explicit']);
		assert.strictEqual(conflict.diagnostics.filter(diagnostic => diagnostic.code === 'metadata-conflict').length, 2);
		assert.deepStrictEqual([fallback.scriptType, fallback.name, fallback.metadataSource], ['QuickFunction', 'FallbackName', 'filename']);
	});

	test('validates Window events without making Window scripts callable', () => {
		for (const event of ['OnShow', 'WhileRunning', 'OnClose']) {
			const source = `{>\n@ScriptType Window\n@Name MainWindow\n@Event ${event}\n{<}`;
			const model = analyzeQuickScript(source);
			assert.deepStrictEqual([model.metadata.scriptType, model.metadata.event], ['Window', event]);
			assert.deepStrictEqual(model.quickFunctions, []);
			assert.deepStrictEqual(model.diagnostics, []);
		}

		const invalid = extractDocumentMetadata('{>\n@ScriptType Window\n@Name MainWindow\n@Event OnBanana\n@Returns INTEGER\n{<}');
		assert.deepStrictEqual(invalid.diagnostics.map(diagnostic => diagnostic.code), ['invalid-window-event', 'metadata-conflict']);
	});

	test('reports malformed known and unknown explicit fields as metadata diagnostics', () => {
		const metadata = extractDocumentMetadata('{>\n@ScriptType Banana\n@Name\n@FooBar Value\n{<}');

		assert.deepStrictEqual(metadata.diagnostics.map(diagnostic => [diagnostic.code, diagnostic.source]), [
			['invalid-script-type', 'intouch-metadata'],
			['invalid-metadata-value', 'intouch-metadata'],
			['unknown-metadata-field', 'intouch-metadata'],
		]);
		assert.strictEqual(metadata.scriptType, 'Generic');
	});
});
