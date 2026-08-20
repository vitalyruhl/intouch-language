import { CoreDiagnostic, QuickScriptDocument, parseQuickScript } from './parser';
import { MetadataExtractionOptions, QuickScriptDocumentMetadata, extractDocumentMetadata } from './documentMetadata';
import { KNOWN_FUNCTIONS } from './generatedFunctionCatalog';
import { Position, Range, offsetAt, sourceRange } from './source';
import { Token, TokenKind } from './token';

export type SymbolKind = 'variable' | 'call-target';
export type ReferenceKind = 'declaration' | 'read' | 'write' | 'call' | 'trigger';
export type SemanticIdentifierKind = 'function' | 'parameter' | 'local' | 'global' | 'member';

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

export interface SemanticIdentifier {
	name: string;
	kind: SemanticIdentifierKind;
	range: Range;
}

export interface QuickFunctionDeclaration {
	name: string;
	nameRange: Range;
	parameters: SemanticIdentifier[];
	metadata: QuickScriptDocumentMetadata;
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
	identifiers: SemanticIdentifier[];
	quickFunctions: QuickFunctionDeclaration[];
	metadata: QuickScriptDocumentMetadata;
	diagnostics: CoreDiagnostic[];
}

export interface AnalyzeOptions {
	/** Additional QuickFunctions resolved by the language-server workspace index. */
	knownFunctionNames?: Iterable<string>;
	/** Optional filename used only after structured metadata sources are exhausted. */
	fileName?: string;
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

function quickFunctionDeclarationFromMetadata(source: string, metadata: QuickScriptDocumentMetadata): QuickFunctionDeclaration[] {
	if (metadata.scriptType !== 'QuickFunction' || metadata.name === undefined) return [];
	return [{
		name: metadata.name,
		nameRange: metadata.nameRange ?? sourceRange(source, { start: 0, end: 0 }).range,
		parameters: metadata.parameters.map(parameter => ({
			name: parameter.name,
			kind: 'parameter',
			range: parameter.nameRange,
		})),
		metadata,
	}];
}

/** Extract QuickFunction declarations only from canonical comment tokens. */
export function quickFunctionDeclarations(source: string, options: MetadataExtractionOptions = {}): QuickFunctionDeclaration[] {
	return quickFunctionDeclarationFromMetadata(source, extractDocumentMetadata(source, options));
}

/** Extract documented QuickFunction names from established Script metadata blocks. */
export function quickFunctionNames(source: string): string[] {
	const names = new Map<string, string>();
	for (const declaration of quickFunctionDeclarations(source)) names.set(declaration.name.toUpperCase(), declaration.name);
	return [...names.values()];
}

/** Build document-local QuickScript declarations, uses, scopes, and semantic diagnostics. */
export function analyzeQuickScript(source: string, options: AnalyzeOptions = {}): SemanticModel {
	const document = parseQuickScript(source);
	const metadata = extractDocumentMetadata(source, { fileName: options.fileName, tokens: document.tokens });
	const diagnostics = [...document.diagnostics, ...metadata.diagnostics];
	const symbols: QuickSymbol[] = [];
	const quickFunctions = quickFunctionDeclarationFromMetadata(source, metadata);
	const declarationsByName = new Map<string, QuickSymbol>();
	const knownCallableNames = new Set(KNOWN_FUNCTIONS.map(item => item.name.toUpperCase()));
	for (const declaration of quickFunctions) {
		knownCallableNames.add(declaration.name.toUpperCase());
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
	const statementCallTargets = new Set<number>();
	for (const call of document.statements.filter(statement => statement.kind === 'call' && statement.name !== undefined && statement.nameRange !== undefined)) {
		statementCallTargets.add(offsetAt(source, call.nameRange!.start));
	}

	const references: QuickReference[] = metadata.trigger === undefined || metadata.triggerRange === undefined ? [] : [{
		name: metadata.trigger,
		kind: 'trigger',
		range: metadata.triggerRange,
	}];
	const identifiers: SemanticIdentifier[] = quickFunctions.flatMap(declaration => [
		{ name: declaration.name, kind: 'function' as const, range: declaration.nameRange },
		...declaration.parameters,
	]);
	if (metadata.trigger !== undefined && metadata.triggerRange !== undefined) {
		identifiers.push({ name: metadata.trigger, kind: 'global', range: metadata.triggerRange });
	}
	for (const symbol of symbols) identifiers.push({ name: symbol.name, kind: 'local', range: symbol.selectionRange });
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
			identifiers.push({ name: token.lexeme, kind: 'member', range: token.range });
			continue;
		}
		const resolved = declarationsByName.get(token.lexeme.toUpperCase());
		const next = nextSignificant(document.tokens, index);
		const isFunctionCall = statementCallTargets.has(token.span.start) || next?.lexeme === '(';
		identifiers.push({
			name: token.lexeme,
			kind: isFunctionCall ? 'function' : resolved === undefined ? 'global' : 'local',
			range: token.range,
		});
		if (isFunctionCall && !knownCallableNames.has(token.lexeme.toUpperCase())) {
			diagnostics.push({
				code: 'unknown-function',
				message: `Unknown QuickScript function '${token.lexeme}'.`,
				severity: 'warning',
				range: token.range,
			});
		}
		if (resolved !== undefined || isFunctionCall) {
			const kind: ReferenceKind = isFunctionCall ? 'call' : next?.lexeme === '=' ? 'write' : 'read';
			references.push({ name: token.lexeme, kind, range: token.range, declarationId: resolved?.id });
		}
	}

	return {
		document,
		scopes: [{ id: 0, kind: 'document', range: document.range, symbolIds: symbols.map(symbol => symbol.id) }],
		symbols,
		references,
		identifiers,
		quickFunctions,
		metadata,
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
