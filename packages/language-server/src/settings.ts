import { ServerSettings } from './features';
import { FormattingOptions } from 'vscode-languageserver/node';

function asRecord(candidate: unknown): Record<string, unknown> {
	return typeof candidate === 'object' && candidate !== null ? candidate as Record<string, unknown> : {};
}

function numberValue(candidate: unknown): number | undefined {
	return typeof candidate === 'number' ? candidate : undefined;
}

function booleanValue(candidate: unknown): boolean | undefined {
	return typeof candidate === 'boolean' ? candidate : undefined;
}

function stringValue(candidate: unknown): string | undefined {
	return typeof candidate === 'string' ? candidate : undefined;
}

function severityValue(candidate: unknown): 'off' | 'hint' | 'information' | 'warning' | 'error' | undefined {
	const value = stringValue(candidate)?.toLowerCase();
	return value !== undefined && ['off', 'hint', 'information', 'warning', 'error'].includes(value)
		? value as 'off' | 'hint' | 'information' | 'warning' | 'error'
		: undefined;
}

export function readSettings(value: unknown): ServerSettings {
	const root = asRecord(value);
	const vbi = root.VBI === undefined ? root : asRecord(root.VBI);
	const formatter = asRecord(vbi.formatter);
	const emptyLine = asRecord(formatter.EmptyLine);
	const block = asRecord(formatter.BC);
	const region = asRecord(formatter.Region);
	const misc = asRecord(formatter.Misc);
	const diagnostics = asRecord(vbi.diagnostics);
	const naming = asRecord(diagnostics.naming);
	return {
		allowedNumberOfEmptyLines: numberValue(emptyLine.allowedNumberOfEmptyLines),
		removeEmptyLines: booleanValue(emptyLine.RemoveEmptyLines),
		removeEmptyLinesInComments: booleanValue(emptyLine.EmptyLinesAlsoInComment),
		blockCodeBegin: stringValue(block.BlockCodeBegin),
		blockCodeEnd: stringValue(block.BlockCodeEnd),
		blockCodeExclude: stringValue(block.BlockCodeExclude),
		regionBlockCodeBegin: stringValue(region.BlockCodeBegin),
		regionBlockCodeEnd: stringValue(region.BlockCodeEnd),
		regionBlockCodeExclude: stringValue(region.BlockCodeExclude),
		insertSpaces: booleanValue(misc.ReplaceTabToSpaces),
		indentSize: numberValue(misc.IndentSize),
		qualityDiagnostics: {
			nonAsciiIdentifiers: severityValue(naming.nonAsciiIdentifiers),
			windowWhitespace: severityValue(naming.windowWhitespace),
			windowNonAscii: severityValue(naming.windowNonAscii),
		},
	};
}

/** Keep explicit extension formatter settings authoritative over generic editor tab settings. */
export function formattingSettings(settings: ServerSettings, options: FormattingOptions): ServerSettings {
	return {
		...settings,
		insertSpaces: settings.insertSpaces ?? options.insertSpaces,
		indentSize: settings.indentSize ?? options.tabSize,
	};
}
