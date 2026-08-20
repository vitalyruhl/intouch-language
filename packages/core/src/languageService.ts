import { KNOWN_FUNCTIONS } from './generatedFunctionCatalog';
import { DATATYPES, KEYWORDS } from './languageData';
import { SemanticModel } from './semantics';
import { Position, Range } from './source';
import { TokenKind } from './token';

export type CompletionKind = 'keyword' | 'datatype' | 'function' | 'variable' | 'call-target';

export interface CompletionEntry {
	label: string;
	kind: CompletionKind;
	detail: string;
}

export interface HoverEntry {
	label: string;
	detail: string;
	range: Range;
}

export interface DocumentSymbolEntry {
	name: string;
	kind: 'variable' | 'if' | 'for' | 'while';
	range: Range;
	selectionRange: Range;
	children: DocumentSymbolEntry[];
}

function contains(range: Range, position: Position): boolean {
	return (position.line > range.start.line || (position.line === range.start.line && position.character >= range.start.character))
		&& (position.line < range.end.line || (position.line === range.end.line && position.character < range.end.character));
}

/** Return deterministic completion data from canonical language data and the current document. */
export function completions(model: SemanticModel): CompletionEntry[] {
	const entries = new Map<string, CompletionEntry>();
	const add = (entry: CompletionEntry): void => {
		const key = entry.label.toUpperCase();
		if (!entries.has(key)) {
			entries.set(key, entry);
		}
	};
	for (const label of KEYWORDS) add({ label, kind: 'keyword', detail: 'QuickScript keyword' });
	for (const label of DATATYPES) add({ label, kind: 'datatype', detail: 'QuickScript datatype' });
	for (const item of KNOWN_FUNCTIONS) add({ label: item.name, kind: 'function', detail: item.sourceComment || item.category });
	for (const symbol of model.symbols) add({ label: symbol.name, kind: 'variable', detail: symbol.datatype ? `Local ${symbol.datatype} variable` : 'Local variable' });
	for (const statement of model.document.statements.filter(candidate => candidate.kind === 'call' && candidate.name !== undefined)) {
		add({ label: statement.name!, kind: 'call-target', detail: 'Document call target' });
	}
	return [...entries.values()].sort((left, right) => left.label.localeCompare(right.label, 'en', { sensitivity: 'base' }));
}

/** Return sourced hover facts only; unknown identifiers intentionally have no hover. */
export function hoverAt(model: SemanticModel, position: Position): HoverEntry | undefined {
	const token = model.document.tokens.find(candidate => contains(candidate.range, position));
	if (token === undefined) {
		return undefined;
	}
	if (token.kind === TokenKind.Keyword) {
		return { label: token.lexeme.toUpperCase(), detail: 'QuickScript keyword', range: token.range };
	}
	if (token.kind === TokenKind.Datatype) {
		return { label: token.lexeme.toUpperCase(), detail: 'QuickScript datatype', range: token.range };
	}
	const local = model.symbols.find(symbol => symbol.name.toUpperCase() === token.lexeme.toUpperCase());
	if (local !== undefined) {
		return { label: local.name, detail: local.datatype ? `Local ${local.datatype} variable` : 'Local variable', range: token.range };
	}
	const known = KNOWN_FUNCTIONS.find(item => item.name.toUpperCase() === token.lexeme.toUpperCase());
	if (known !== undefined) {
		return { label: known.name, detail: known.sourceComment || known.category, range: token.range };
	}
	if (/^(SYS_|MA_|SMEL_|HER_)/i.test(token.lexeme)) {
		return { label: token.lexeme, detail: 'Hermes system variable', range: token.range };
	}
	return undefined;
}

/** Build a hierarchical outline from local declarations and parser block relationships. */
export function documentSymbols(model: SemanticModel): DocumentSymbolEntry[] {
	const blocks = model.document.blocks.map(block => ({
		name: block.kind.toUpperCase(),
		kind: block.kind,
		range: block.range,
		selectionRange: block.opener,
		children: [] as DocumentSymbolEntry[],
	}));
	const roots: DocumentSymbolEntry[] = [];
	for (const block of model.document.blocks) {
		if (block.parentId === undefined) roots.push(blocks[block.id]);
		else blocks[block.parentId].children.push(blocks[block.id]);
	}
	return [
		...model.symbols.map(symbol => ({
			name: symbol.name,
			kind: 'variable' as const,
			range: symbol.range,
			selectionRange: symbol.selectionRange,
			children: [],
		})),
		...roots,
	];
}
