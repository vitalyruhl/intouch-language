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
import { WorkspaceSymbol, WorkspaceSymbolIndex, documentFileName } from './workspaceSymbols';

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

function workspaceIndex(value: WorkspaceSymbolIndex | Iterable<string> | undefined): WorkspaceSymbolIndex | undefined {
	return value instanceof WorkspaceSymbolIndex ? value : undefined;
}

function knownFunctionNames(value: WorkspaceSymbolIndex | Iterable<string> | undefined): Iterable<string> | undefined {
	const index = workspaceIndex(value);
	return index === undefined ? value as Iterable<string> | undefined : index.knownFunctionNames();
}

function analyzeDocument(document: TextDocument, workspace?: WorkspaceSymbolIndex | Iterable<string>) {
	return analyzeQuickScript(document.getText(), {
		knownFunctionNames: knownFunctionNames(workspace),
		fileName: documentFileName(document.uri),
	});
}

function quickFunctionSignature(symbol: WorkspaceSymbol): string {
	const parameters = symbol.metadata.parameters
		.map(parameter => `${parameter.name}: ${parameter.datatype}`)
		.join(', ');
	const returns = symbol.metadata.returnType === undefined ? '' : `: ${symbol.metadata.returnType}`;
	return `${symbol.name}(${parameters})${returns}`;
}

function workspaceFunctionDetail(symbol: WorkspaceSymbol): string {
	const signature = quickFunctionSignature(symbol);
	return symbol.metadata.description === undefined ? signature : `${signature}\n\n${symbol.metadata.description}`;
}

export function diagnosticsFor(
	document: TextDocument,
	workspace?: WorkspaceSymbolIndex | Iterable<string>,
	settings: ServerSettings = {},
): Diagnostic[] {
	const model = analyzeDocument(document, workspace);
	const workspaceDiagnostics = workspaceIndex(workspace)?.diagnostics(document.uri) ?? [];
	return [...model.diagnostics, ...workspaceDiagnostics, ...qualityDiagnostics(model, settings.qualityDiagnostics)].map(item => ({
		code: item.code,
		message: item.message,
		range: item.range,
		severity: lspDiagnosticSeverity(item.severity),
		source: item.source ?? 'intouch-language',
	}));
}

export function formattingEdits(document: TextDocument, settings: ServerSettings): TextEdit[] {
	const lineEnding = settings.lineEnding ?? (document.getText().includes('\r\n') ? '\r\n' : '\n');
	const result = formatQuickScript(document.getText(), { ...settings, lineEnding });
	if (!result.changed) {
		return [];
	}
	return [TextEdit.replace(Range.create(Position.create(0, 0), document.positionAt(document.getText().length)), result.text)];
}

export function symbolsFor(document: TextDocument): DocumentSymbol[] {
	const symbolKind = (kind: ReturnType<typeof documentSymbols>[number]['kind']): SymbolKind => {
		switch (kind) {
			case 'variable': return SymbolKind.Variable;
			case 'function': return SymbolKind.Function;
			case 'window': return SymbolKind.Namespace;
			case 'event': return SymbolKind.Event;
			case 'application': return SymbolKind.Module;
			case 'data-change': return SymbolKind.Event;
			case 'condition': return SymbolKind.Event;
			case 'key-script': return SymbolKind.Event;
			default: return SymbolKind.Struct;
		}
	};
	const convert = (entry: ReturnType<typeof documentSymbols>[number]): DocumentSymbol => DocumentSymbol.create(
		entry.name,
		undefined,
		symbolKind(entry.kind),
		entry.range,
		entry.selectionRange,
		entry.children.map(convert),
	);
	return documentSymbols(analyzeDocument(document)).map(convert);
}

export function definitionFor(document: TextDocument, position: Position, workspace?: WorkspaceSymbolIndex): Location | undefined {
	const range = definitionAt(analyzeDocument(document, workspace), position);
	if (range !== undefined) return Location.create(document.uri, range);
	if (workspace === undefined) return undefined;
	const name = workspace.symbolNameAt(document.uri, position);
	if (name === undefined) return undefined;
	const symbol = workspace.uniqueQuickFunction(name);
	return symbol === undefined ? undefined : Location.create(symbol.uri, symbol.definitionRange);
}

export function referencesFor(document: TextDocument, position: Position, includeDeclaration: boolean, workspace?: WorkspaceSymbolIndex): Location[] {
	const local = referencesAt(analyzeDocument(document, workspace), position, includeDeclaration);
	if (local.length > 0) return local.map(range => Location.create(document.uri, range));
	if (workspace === undefined) return [];
	const name = workspace.symbolNameAt(document.uri, position);
	return name === undefined ? [] : workspace.references(name, includeDeclaration)
		.map(reference => Location.create(reference.uri, reference.range));
}

export function completionsFor(document: TextDocument, workspace?: WorkspaceSymbolIndex): CompletionItem[] {
	const nonCallableNames = new Set((workspace?.symbols() ?? [])
		.filter(symbol => !symbol.callable)
		.map(symbol => symbol.name.toUpperCase()));
	const coreEntries = completions(analyzeDocument(document, workspace))
		.filter(entry => entry.kind !== 'call-target' || !nonCallableNames.has(entry.label.toUpperCase()));
	const entries = new Map(coreEntries.map(entry => [entry.label.toUpperCase(), {
		label: entry.label,
		kind: completionKind(entry.kind),
		detail: entry.detail,
	}]));
	for (const symbol of workspace?.quickFunctions() ?? []) {
		const duplicates = workspace?.quickFunctions(symbol.name).length ?? 0;
		entries.set(symbol.name.toUpperCase(), {
			label: symbol.name,
			kind: CompletionItemKind.Function,
			detail: duplicates > 1 ? `Ambiguous workspace QuickFunction (${duplicates} definitions)` : workspaceFunctionDetail(symbol),
		});
	}
	return [...entries.values()].sort((left, right) => left.label.localeCompare(right.label, 'en', { sensitivity: 'base' }));
}

export function hoverFor(document: TextDocument, position: Position, workspace?: WorkspaceSymbolIndex): Hover | undefined {
	const documentSymbol = workspace?.symbolAt(document.uri, position);
	if (documentSymbol !== undefined && documentSymbol.kind !== 'QuickFunction') {
		const context = documentSymbol.metadata.event ?? documentSymbol.metadata.shortcut ?? documentSymbol.metadata.trigger;
		const detail = context === undefined ? documentSymbol.kind : `${documentSymbol.kind}: ${context}`;
		return {
			contents: { kind: 'markdown', value: `**${documentSymbol.name}**\n\n${detail}` },
			range: documentSymbol.definitionRange,
		};
	}
	const workspaceName = workspace?.symbolNameAt(document.uri, position);
	if (workspaceName !== undefined) {
		const candidates = workspace!.quickFunctions(workspaceName);
		if (candidates.length > 1) {
			return { contents: { kind: 'markdown', value: `**${workspaceName}**\n\nAmbiguous workspace QuickFunction (${candidates.length} definitions).` } };
		}
		if (candidates.length === 1) {
			return {
				contents: { kind: 'markdown', value: `**${candidates[0].name}**\n\n${workspaceFunctionDetail(candidates[0])}` },
				range: workspace?.entry(document.uri)?.calls.find(reference => reference.name.toUpperCase() === workspaceName.toUpperCase()
					&& reference.range.start.line === position.line
					&& reference.range.start.character <= position.character
					&& reference.range.end.character > position.character)?.range,
			};
		}
	}
	const hover = hoverAt(analyzeDocument(document, workspace), position);
	return hover === undefined ? undefined : {
		contents: { kind: 'markdown', value: `**${hover.label}**\n\n${hover.detail}` },
		range: hover.range,
	};
}
