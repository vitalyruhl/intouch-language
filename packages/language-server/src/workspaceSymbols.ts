import {
	CoreDiagnostic,
	Position,
	QuickReference,
	QuickScriptDocumentMetadata,
	Range,
	analyzeQuickScript,
} from '@intouch-language/core';
import { TextDocument } from 'vscode-languageserver-textdocument';

export type WorkspaceSymbolKind =
	| 'QuickFunction'
	| 'Window'
	| 'WindowEvent'
	| 'ApplicationScript'
	| 'DataChangeScript'
	| 'ConditionScript'
	| 'KeyScript';

export interface WorkspaceDocumentSource {
	uri: string;
	text: string;
}

export interface WorkspaceSymbol {
	name: string;
	kind: WorkspaceSymbolKind;
	callable: boolean;
	uri: string;
	definitionRange: Range;
	metadata: QuickScriptDocumentMetadata;
}

export interface WorkspaceReference {
	name: string;
	kind: 'declaration' | 'call';
	uri: string;
	range: Range;
}

export interface WorkspaceDocumentEntry {
	uri: string;
	metadata: QuickScriptDocumentMetadata;
	calls: QuickReference[];
	symbols: WorkspaceSymbol[];
}

function contains(range: Range, position: Position): boolean {
	return (position.line > range.start.line || (position.line === range.start.line && position.character >= range.start.character))
		&& (position.line < range.end.line || (position.line === range.end.line && position.character < range.end.character));
}

function zeroRange(): Range {
	return { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
}

export function documentFileName(uri: string): string | undefined {
	try {
		const parsed = new URL(uri);
		const segments = parsed.pathname.split('/');
		return decodeURIComponent(segments[segments.length - 1] || '') || undefined;
	} catch {
		const segments = uri.split(/[\\/]/);
		return segments[segments.length - 1] || undefined;
	}
}

function documentSymbols(uri: string, metadata: QuickScriptDocumentMetadata): WorkspaceSymbol[] {
	const name = metadata.name ?? metadata.trigger;
	const definitionRange = metadata.nameRange ?? metadata.triggerRange ?? zeroRange();
	if (metadata.scriptType === 'QuickFunction' && name !== undefined) {
		return [{ name, kind: 'QuickFunction', callable: true, uri, definitionRange, metadata }];
	}
	if (metadata.scriptType === 'Window' && metadata.name !== undefined) {
		const symbols: WorkspaceSymbol[] = [{
			name: metadata.name,
			kind: 'Window',
			callable: false,
			uri,
			definitionRange,
			metadata,
		}];
		if (metadata.event !== undefined) {
			symbols.push({
				name: `${metadata.name}.${metadata.event}`,
				kind: 'WindowEvent',
				callable: false,
				uri,
				definitionRange: metadata.eventRange ?? definitionRange,
				metadata,
			});
		}
		return symbols;
	}
	if (metadata.scriptType === 'Application') {
		return [{ name: name ?? 'Application', kind: 'ApplicationScript', callable: false, uri, definitionRange, metadata }];
	}
	if (metadata.scriptType === 'DataChange') {
		return [{ name: name ?? 'DataChange', kind: 'DataChangeScript', callable: false, uri, definitionRange, metadata }];
	}
	if (metadata.scriptType === 'Condition') {
		return [{ name: name ?? 'Condition', kind: 'ConditionScript', callable: false, uri, definitionRange, metadata }];
	}
	if (metadata.scriptType === 'KeyScript') {
		return [{ name: name ?? metadata.shortcut ?? 'KeyScript', kind: 'KeyScript', callable: false, uri, definitionRange, metadata }];
	}
	return [];
}

function indexDocument(source: WorkspaceDocumentSource): WorkspaceDocumentEntry {
	const model = analyzeQuickScript(source.text, { fileName: documentFileName(source.uri) });
	return {
		uri: source.uri,
		metadata: model.metadata,
		calls: model.references.filter(reference => reference.kind === 'call'),
		symbols: documentSymbols(source.uri, model.metadata),
	};
}

/** URI-aware incremental index for callable and non-callable QuickScript workspace symbols. */
export class WorkspaceSymbolIndex {
	private readonly workspaceDocuments = new Map<string, WorkspaceDocumentEntry>();
	private readonly openDocuments = new Map<string, WorkspaceDocumentEntry>();

	public replaceWorkspaceDocuments(sources: Iterable<WorkspaceDocumentSource>): void {
		this.workspaceDocuments.clear();
		for (const source of sources) this.workspaceDocuments.set(source.uri, indexDocument(source));
	}

	public updateWorkspaceDocument(source: WorkspaceDocumentSource): void {
		this.workspaceDocuments.set(source.uri, indexDocument(source));
	}

	public removeWorkspaceDocument(uri: string): void {
		this.workspaceDocuments.delete(uri);
	}

	public updateDocument(document: TextDocument): void {
		this.openDocuments.set(document.uri, indexDocument({ uri: document.uri, text: document.getText() }));
	}

	public removeDocument(uri: string): void {
		this.openDocuments.delete(uri);
	}

	public entries(): WorkspaceDocumentEntry[] {
		const documents = new Map(this.workspaceDocuments);
		for (const [uri, entry] of this.openDocuments) documents.set(uri, entry);
		return [...documents.values()].sort((left, right) => left.uri.localeCompare(right.uri, 'en'));
	}

	public entry(uri: string): WorkspaceDocumentEntry | undefined {
		return this.openDocuments.get(uri) ?? this.workspaceDocuments.get(uri);
	}

	public symbols(): WorkspaceSymbol[] {
		return this.entries().flatMap(entry => entry.symbols);
	}

	public quickFunctions(name?: string): WorkspaceSymbol[] {
		const normalized = name?.toUpperCase();
		return this.symbols().filter(symbol => symbol.kind === 'QuickFunction'
			&& (normalized === undefined || symbol.name.toUpperCase() === normalized));
	}

	public knownFunctionNames(): string[] {
		const names = new Map<string, string>();
		for (const symbol of this.quickFunctions()) names.set(symbol.name.toUpperCase(), symbol.name);
		return [...names.values()].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));
	}

	public uniqueQuickFunction(name: string): WorkspaceSymbol | undefined {
		const candidates = this.quickFunctions(name);
		return candidates.length === 1 ? candidates[0] : undefined;
	}

	public symbolAt(uri: string, position: Position): WorkspaceSymbol | undefined {
		return this.entry(uri)?.symbols.find(symbol => contains(symbol.definitionRange, position));
	}

	public symbolNameAt(uri: string, position: Position): string | undefined {
		const entry = this.entry(uri);
		const declaration = this.symbolAt(uri, position);
		if (declaration?.kind !== 'QuickFunction') return entry?.calls.find(reference => contains(reference.range, position))?.name;
		if (declaration !== undefined) return declaration.name;
		return entry?.calls.find(reference => contains(reference.range, position))?.name;
	}

	public references(name: string, includeDeclaration: boolean): WorkspaceReference[] {
		const normalized = name.toUpperCase();
		const declarations = includeDeclaration
			? this.quickFunctions(name).map(symbol => ({
				name: symbol.name,
				kind: 'declaration' as const,
				uri: symbol.uri,
				range: symbol.definitionRange,
			}))
			: [];
		const calls = this.entries().flatMap(entry => entry.calls
			.filter(reference => reference.name.toUpperCase() === normalized)
			.map(reference => ({ name: reference.name, kind: 'call' as const, uri: entry.uri, range: reference.range })));
		return [...declarations, ...calls].sort((left, right) => left.uri.localeCompare(right.uri, 'en')
			|| left.range.start.line - right.range.start.line
			|| left.range.start.character - right.range.start.character);
	}

	public diagnostics(uri: string): CoreDiagnostic[] {
		const entry = this.entry(uri);
		if (entry === undefined) return [];
		const diagnostics: CoreDiagnostic[] = [];
		for (const symbol of entry.symbols.filter(candidate => candidate.kind === 'QuickFunction')) {
			if (this.quickFunctions(symbol.name).length > 1) {
				diagnostics.push({
					code: 'duplicate-quickfunction',
					message: `QuickFunction '${symbol.name}' has multiple workspace definitions.`,
					severity: 'warning',
					range: symbol.definitionRange,
					source: 'intouch-metadata',
				});
			}
		}
		for (const call of entry.calls) {
			if (this.quickFunctions(call.name).length > 1) {
				diagnostics.push({
					code: 'ambiguous-quickfunction',
					message: `QuickFunction call '${call.name}' has multiple workspace definitions.`,
					severity: 'warning',
					range: call.range,
					source: 'intouch-metadata',
				});
			}
		}
		return diagnostics;
	}
}

/** Backward-compatible class name for callers migrating from the former name-only index. */
export { WorkspaceSymbolIndex as WorkspaceFunctionIndex };
