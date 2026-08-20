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
	analyzeQuickScript,
	completions,
	definitionAt,
	documentSymbols,
	formatQuickScript,
	hoverAt,
	referencesAt,
} from '@intouch-language/core';

export type ServerSettings = FormatOptions;

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

export function diagnosticsFor(document: TextDocument, knownFunctionNames?: Iterable<string>): Diagnostic[] {
	return analyzeQuickScript(document.getText(), { knownFunctionNames }).diagnostics.map(item => ({
		code: item.code,
		message: item.message,
		range: item.range,
		severity: item.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
		source: 'intouch-language',
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
