import {
	CompletionItem,
	CompletionItemKind,
	Diagnostic,
	DiagnosticSeverity,
	DocumentSymbol,
	Hover,
	InitializeResult,
	Location,
	Position,
	Range,
	SymbolKind,
	TextEdit,
	TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
	FormatOptions,
	QualityDiagnosticSettings,
	analyzeQuickScript,
	completions,
	definitionAt,
	documentSymbols,
	formatQuickScript,
	hoverAt,
	qualityDiagnostics,
	referencesAt,
} from '@intouch-language/core';

export interface ServerSettings extends FormatOptions {
	qualityDiagnostics?: QualityDiagnosticSettings;
}

export function serverCapabilities(): InitializeResult {
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			documentFormattingProvider: true,
			documentSymbolProvider: true,
			definitionProvider: true,
			referencesProvider: true,
			completionProvider: { resolveProvider: false },
			hoverProvider: true,
		},
	};
}

function completionKind(kind: string): CompletionItemKind {
	switch (kind) {
		case 'keyword': return CompletionItemKind.Keyword;
		case 'datatype': return CompletionItemKind.TypeParameter;
		case 'variable': return CompletionItemKind.Variable;
		case 'call-target': return CompletionItemKind.Method;
		default: return CompletionItemKind.Function;
	}
}

function lspDiagnosticSeverity(severity: 'error' | 'warning' | 'information' | 'hint'): DiagnosticSeverity {
	switch (severity) {
		case 'error': return DiagnosticSeverity.Error;
		case 'information': return DiagnosticSeverity.Information;
		case 'hint': return DiagnosticSeverity.Hint;
		default: return DiagnosticSeverity.Warning;
	}
}

export function diagnosticsFor(
	document: TextDocument,
	knownFunctionNames?: Iterable<string>,
	settings: ServerSettings = {},
): Diagnostic[] {
	const model = analyzeQuickScript(document.getText(), { knownFunctionNames });
	return [...model.diagnostics, ...qualityDiagnostics(model, settings.qualityDiagnostics)].map(item => ({
		code: item.code,
		message: item.message,
		range: item.range,
		severity: lspDiagnosticSeverity(item.severity),
		source: item.source ?? 'intouch-language',
	}));
}

export function formattingEdits(document: TextDocument, settings: ServerSettings): TextEdit[] {
	const result = formatQuickScript(document.getText(), settings);
	if (!result.changed) {
		return [];
	}
	return [TextEdit.replace(Range.create(Position.create(0, 0), document.positionAt(document.getText().length)), result.text)];
}

export function symbolsFor(document: TextDocument): DocumentSymbol[] {
	const convert = (entry: ReturnType<typeof documentSymbols>[number]): DocumentSymbol => DocumentSymbol.create(
		entry.name,
		undefined,
		entry.kind === 'variable' ? SymbolKind.Variable : SymbolKind.Struct,
		entry.range,
		entry.selectionRange,
		entry.children.map(convert),
	);
	return documentSymbols(analyzeQuickScript(document.getText())).map(convert);
}

export function definitionFor(document: TextDocument, position: Position): Location | undefined {
	const range = definitionAt(analyzeQuickScript(document.getText()), position);
	return range === undefined ? undefined : Location.create(document.uri, range);
}

export function referencesFor(document: TextDocument, position: Position, includeDeclaration: boolean): Location[] {
	return referencesAt(analyzeQuickScript(document.getText()), position, includeDeclaration)
		.map(range => Location.create(document.uri, range));
}

export function completionsFor(document: TextDocument): CompletionItem[] {
	return completions(analyzeQuickScript(document.getText())).map(entry => ({
		label: entry.label,
		kind: completionKind(entry.kind),
		detail: entry.detail,
	}));
}

export function hoverFor(document: TextDocument, position: Position): Hover | undefined {
	const hover = hoverAt(analyzeQuickScript(document.getText()), position);
	return hover === undefined ? undefined : {
		contents: { kind: 'markdown', value: `**${hover.label}**\n\n${hover.detail}` },
		range: hover.range,
	};
}
