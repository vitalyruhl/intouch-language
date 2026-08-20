import { CoreDiagnostic, QuickScriptDocument, parseQuickScript } from './parser';
import { Position, Range, offsetAt } from './source';
import { Token, TokenKind } from './token';

export type SymbolKind = 'variable' | 'call-target';
export type ReferenceKind = 'declaration' | 'read' | 'write' | 'call';

export interface QuickSymbol {
	id: number;
	name: string;
	kind: SymbolKind;
	range: Range;
	selectionRange: Range;
	datatype?: string;
	scopeId: number;
}

export interface QuickReference {
	name: string;
	kind: ReferenceKind;
	range: Range;
	declarationId?: number;
}

export interface Scope {
	id: number;
	kind: 'document';
	range: Range;
	symbolIds: number[];
}

export interface SemanticModel {
	document: QuickScriptDocument;
	scopes: Scope[];
	symbols: QuickSymbol[];
	references: QuickReference[];
	diagnostics: CoreDiagnostic[];
}

function contains(range: Range, position: Position): boolean {
	return (position.line > range.start.line || (position.line === range.start.line && position.character >= range.start.character))
		&& (position.line < range.end.line || (position.line === range.end.line && position.character < range.end.character));
}

function precedingSignificant(tokens: readonly Token[], index: number): Token | undefined {
	for (let current = index - 1; current >= 0; current -= 1) {
		if (![TokenKind.Whitespace, TokenKind.Newline, TokenKind.Comment].includes(tokens[current].kind)) {
			return tokens[current];
		}
	}
	return undefined;
}

/** Build document-local QuickScript declarations, uses, scopes, and semantic diagnostics. */
export function analyzeQuickScript(source: string): SemanticModel {
	const document = parseQuickScript(source);
	const diagnostics = [...document.diagnostics];
	const symbols: QuickSymbol[] = [];
	const declarationsByName = new Map<string, QuickSymbol>();

	for (const declaration of document.statements.filter(statement => statement.kind === 'dim' && statement.name !== undefined && statement.nameRange !== undefined)) {
		const normalized = declaration.name!.toUpperCase();
		const existing = declarationsByName.get(normalized);
		if (existing !== undefined) {
			diagnostics.push({
				code: 'duplicate-local',
				message: `Local variable '${declaration.name}' is already declared.`,
				severity: 'error',
				range: declaration.nameRange!,
			});
			continue;
		}
		const symbol: QuickSymbol = {
			id: symbols.length,
			name: declaration.name!,
			kind: 'variable',
			range: declaration.range,
			selectionRange: declaration.nameRange!,
			datatype: declaration.datatype,
			scopeId: 0,
		};
		symbols.push(symbol);
		declarationsByName.set(normalized, symbol);
	}

	const declarationOffsets = new Map<number, QuickSymbol>();
	for (const symbol of symbols) {
		declarationOffsets.set(offsetAt(source, symbol.selectionRange.start), symbol);
	}
	const callRanges = new Map<number, string>();
	for (const call of document.statements.filter(statement => statement.kind === 'call' && statement.name !== undefined && statement.nameRange !== undefined)) {
		callRanges.set(offsetAt(source, call.nameRange!.start), call.name!);
	}

	const references: QuickReference[] = [];
	for (let index = 0; index < document.tokens.length; index += 1) {
		const token = document.tokens[index];
		if (token.kind !== TokenKind.Identifier) {
			continue;
		}
		const declaration = declarationOffsets.get(token.span.start);
		if (declaration !== undefined) {
			references.push({ name: token.lexeme, kind: 'declaration', range: token.range, declarationId: declaration.id });
			continue;
		}
		const previous = precedingSignificant(document.tokens, index);
		if (previous?.lexeme === '.' || previous?.lexeme === '->') {
			continue;
		}
		const resolved = declarationsByName.get(token.lexeme.toUpperCase());
		const callName = callRanges.get(token.span.start);
		if (resolved !== undefined || callName !== undefined) {
			const next = document.tokens.slice(index + 1).find(candidate => ![TokenKind.Whitespace, TokenKind.Newline, TokenKind.Comment].includes(candidate.kind));
			const kind: ReferenceKind = callName !== undefined ? 'call' : next?.lexeme === '=' ? 'write' : 'read';
			references.push({ name: token.lexeme, kind, range: token.range, declarationId: resolved?.id });
		}
	}

	return {
		document,
		scopes: [{ id: 0, kind: 'document', range: document.range, symbolIds: symbols.map(symbol => symbol.id) }],
		symbols,
		references,
		diagnostics,
	};
}

export function definitionAt(model: SemanticModel, position: Position): Range | undefined {
	const reference = model.references.find(candidate => contains(candidate.range, position));
	return reference?.declarationId === undefined ? undefined : model.symbols[reference.declarationId]?.selectionRange;
}

export function referencesAt(model: SemanticModel, position: Position, includeDeclaration = true): Range[] {
	const occurrence = model.references.find(candidate => contains(candidate.range, position));
	if (occurrence?.declarationId === undefined) {
		return [];
	}
	return model.references
		.filter(candidate => candidate.declarationId === occurrence.declarationId && (includeDeclaration || candidate.kind !== 'declaration'))
		.map(candidate => candidate.range);
}
