import { CoreDiagnostic, QuickScriptDocument, parseQuickScript } from './parser';
import { KNOWN_FUNCTIONS } from './generatedFunctionCatalog';
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

export interface AnalyzeOptions {
	/** Additional QuickFunctions resolved by the language-server workspace index. */
	knownFunctionNames?: Iterable<string>;
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

function nextSignificant(tokens: readonly Token[], index: number): Token | undefined {
	for (let current = index + 1; current < tokens.length; current += 1) {
		if (![TokenKind.Whitespace, TokenKind.Newline, TokenKind.Comment].includes(tokens[current].kind)) {
			return tokens[current];
		}
	}
	return undefined;
}

/** Extract documented QuickFunction names from established Script metadata blocks. */
export function quickFunctionNames(source: string): string[] {
	const names = new Map<string, string>();
	const metadata = /\bType\s*:\s*QuickFunction\b[\s\S]{0,1000}?\bName\s*:\s*([A-Za-z_$][A-Za-z0-9_$-]*)\b/gi;
	for (const match of source.matchAll(metadata)) {
		const name = match[1];
		names.set(name.toUpperCase(), name);
	}
	return [...names.values()];
}

/** Build document-local QuickScript declarations, uses, scopes, and semantic diagnostics. */
export function analyzeQuickScript(source: string, options: AnalyzeOptions = {}): SemanticModel {
	const document = parseQuickScript(source);
	const diagnostics = [...document.diagnostics];
	const symbols: QuickSymbol[] = [];
	const declarationsByName = new Map<string, QuickSymbol>();
	const knownCallableNames = new Set(KNOWN_FUNCTIONS.map(item => item.name.toUpperCase()));
	for (const name of quickFunctionNames(source)) {
		knownCallableNames.add(name.toUpperCase());
	}
	for (const name of options.knownFunctionNames ?? []) {
		knownCallableNames.add(name.toUpperCase());
	}

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
		const next = nextSignificant(document.tokens, index);
		const isFunctionCall = callName !== undefined || next?.lexeme === '(';
		if (isFunctionCall && !knownCallableNames.has(token.lexeme.toUpperCase())) {
			diagnostics.push({
				code: 'unknown-function',
				message: `Unknown QuickScript function '${token.lexeme}'.`,
				severity: 'warning',
				range: token.range,
			});
		}
		if (resolved !== undefined || callName !== undefined) {
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
