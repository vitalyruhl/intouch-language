import { DATATYPE_SET } from './languageData';
import { Range, SourceSpan, sourceRange } from './source';
import { Token, TokenKind } from './token';
import { tokenize } from './tokenizer';

export type BlockKind = 'if' | 'for' | 'while';
export type StatementKind = 'dim' | 'call' | 'if' | 'else' | 'endif' | 'for' | 'next' | 'while' | 'unknown';
export type DiagnosticSeverity = 'error' | 'warning';

export interface CoreDiagnostic {
	code: string;
	message: string;
	severity: DiagnosticSeverity;
	range: Range;
}

export interface StatementNode {
	kind: StatementKind;
	range: Range;
	span: SourceSpan;
	name?: string;
	nameRange?: Range;
	datatype?: string;
	datatypeRange?: Range;
	parentBlockId?: number;
}

export interface BlockNode {
	id: number;
	kind: BlockKind;
	parentId?: number;
	childIds: number[];
	range: Range;
	span: SourceSpan;
	bodyRange: Range;
	bodySpan: SourceSpan;
	opener: Range;
	middle?: Range;
	closer?: Range;
}

export interface LineStructure {
	line: number;
	indentDepth: number;
	preserveIndent: boolean;
}

export interface QuickScriptDocument {
	source: string;
	tokens: Token[];
	statements: StatementNode[];
	blocks: BlockNode[];
	diagnostics: CoreDiagnostic[];
	lines: LineStructure[];
	range: Range;
	span: SourceSpan;
}

interface OpenBlock {
	block: BlockNode;
	opener: Token;
	hasElse: boolean;
}

function isTrivia(token: Token): boolean {
	return token.kind === TokenKind.Whitespace || token.kind === TokenKind.Newline || token.kind === TokenKind.Comment || token.kind === TokenKind.EOF;
}

function keyword(token: Token | undefined): string | undefined {
	return token?.kind === TokenKind.Keyword ? token.lexeme.toUpperCase() : undefined;
}

function tokenNodeRange(source: string, first: Token, last: Token = first): { span: SourceSpan; range: Range } {
	return sourceRange(source, { start: first.span.start, end: last.span.end });
}

function diagnostic(code: string, message: string, token: Token): CoreDiagnostic {
	return { code, message, severity: 'error', range: token.range };
}

function statementKind(value: string): StatementKind {
	switch (value) {
		case 'DIM': return 'dim';
		case 'CALL': return 'call';
		case 'IF': return 'if';
		case 'ELSE': return 'else';
		case 'ENDIF': return 'endif';
		case 'FOR': return 'for';
		case 'NEXT': return 'next';
		case 'WHILE': return 'while';
		default: return 'unknown';
	}
}

function lineTokens(tokens: readonly Token[], line: number): Token[] {
	return tokens.filter(token => token.range.start.line === line && !isTrivia(token));
}

/** Parse recoverable QuickScript structure from the canonical token stream. */
export function parseQuickScript(source: string): QuickScriptDocument {
	const tokens = tokenize(source);
	const lineCount = source.length === 0 ? 1 : source.split(/\r\n|\r|\n/).length;
	const statements: StatementNode[] = [];
	const blocks: BlockNode[] = [];
	const diagnostics: CoreDiagnostic[] = [];
	const lines: LineStructure[] = [];
	const stack: OpenBlock[] = [];
	let continuation: { baseDepth: number } | undefined;

	for (let line = 0; line < lineCount; line += 1) {
		const significant = lineTokens(tokens, line);
		const spanningComment = tokens.some(token => token.kind === TokenKind.Comment
			&& token.range.end.line > token.range.start.line
			&& token.range.start.line <= line && token.range.end.line >= line);
		let visualDepth = stack.length;
		let closesAtStart = false;
		const firstKeyword = significant.map(keyword).find(value => value !== undefined);
		if (firstKeyword === 'ELSE' || firstKeyword === 'ENDIF' || firstKeyword === 'NEXT') {
			visualDepth = Math.max(0, visualDepth - 1);
			closesAtStart = true;
		}
		if (continuation !== undefined) {
			visualDepth = continuation.baseDepth + 2;
		}
		lines.push({ line, indentDepth: visualDepth, preserveIndent: spanningComment });

		for (let index = 0; index < significant.length; index += 1) {
			const token = significant[index];
			const value = keyword(token);
			if (value === undefined) {
				continue;
			}

			if (['DIM', 'CALL', 'IF', 'ELSE', 'ENDIF', 'FOR', 'NEXT', 'WHILE'].includes(value)) {
				const startIndex = index;
				let last = token;
				for (let endIndex = startIndex + 1; endIndex < significant.length && significant[endIndex].lexeme !== ';'; endIndex += 1) {
					last = significant[endIndex];
					if (keyword(last) !== undefined && ['IF', 'ELSE', 'ENDIF', 'FOR', 'NEXT', 'WHILE', 'CALL', 'DIM'].includes(keyword(last)!)) {
						last = token;
						break;
					}
				}
				const located = tokenNodeRange(source, token, last);
				const node: StatementNode = {
					kind: statementKind(value),
					...located,
					parentBlockId: stack[stack.length - 1]?.block.id,
				};
				let pushed = false;
				if (value === 'DIM') {
					const asIndex = significant.findIndex((candidate, candidateIndex) => candidateIndex > startIndex && keyword(candidate) === 'AS');
					const datatype = asIndex >= 0 ? significant[asIndex + 1] : undefined;
					for (const name of significant.slice(startIndex + 1, asIndex >= 0 ? asIndex : undefined)) {
						if (name.kind === TokenKind.Identifier) {
							statements.push({
								...node,
								name: name.lexeme,
								nameRange: name.range,
								datatype: datatype?.lexeme,
								datatypeRange: datatype?.range,
							});
							pushed = true;
						}
					}
				} else if (value === 'CALL') {
					const target = significant[startIndex + 1];
					if (target?.kind === TokenKind.Identifier) {
						node.name = target.lexeme;
						node.nameRange = target.range;
					}
				}
				if (!pushed) {
					statements.push(node);
				}
			}

			const previousValue = keyword(significant[index - 1]);
			if ((value === 'FOR' || value === 'WHILE') && previousValue === 'EXIT') {
				continue;
			}
			if (value === 'IF' || value === 'FOR' || value === 'WHILE') {
				const parent = stack[stack.length - 1]?.block;
				const located = tokenNodeRange(source, token);
				const block: BlockNode = {
					id: blocks.length,
					kind: value.toLowerCase() as BlockKind,
					parentId: parent?.id,
					childIds: [],
					...located,
					bodyRange: { start: token.range.end, end: token.range.end },
					bodySpan: { start: token.span.end, end: token.span.end },
					opener: token.range,
				};
				blocks.push(block);
				parent?.childIds.push(block.id);
				stack.push({ block, opener: token, hasElse: false });
				continue;
			}
			if (value === 'ELSE') {
				const open = stack[stack.length - 1];
				if (open?.block.kind !== 'if') {
					diagnostics.push(diagnostic('invalid-nesting', 'ELSE has no matching IF.', token));
				} else if (open.hasElse) {
					diagnostics.push(diagnostic('duplicate-else', 'IF block has more than one ELSE.', token));
				} else {
					open.hasElse = true;
					open.block.middle = token.range;
				}
				continue;
			}
			if (value === 'ENDIF' || value === 'NEXT') {
				const expected = value === 'ENDIF' ? ['if'] : ['for', 'while'];
				const open = stack[stack.length - 1];
				if (open === undefined || !expected.includes(open.block.kind)) {
					diagnostics.push(diagnostic('invalid-nesting', `${value} has no matching ${value === 'ENDIF' ? 'IF' : 'FOR or WHILE'}.`, token));
				} else {
					stack.pop();
					open.block.closer = token.range;
					open.block.span.end = token.span.end;
					open.block.range.end = token.range.end;
					open.block.bodySpan.end = token.span.start;
					open.block.bodyRange.end = token.range.start;
				}
			}
		}

		const values = significant.map(keyword);
		if (continuation !== undefined && values.includes('THEN')) {
			continuation = undefined;
		} else if (!closesAtStart && values.includes('IF') && !values.includes('THEN')
			&& ['AND', 'OR', 'NOT'].includes(values[values.length - 1] ?? '')) {
			continuation = { baseDepth: Math.max(0, stack.length - 1) };
		}
	}

	for (const open of stack) {
		const closer = open.block.kind === 'if' ? 'ENDIF' : 'NEXT';
		diagnostics.push(diagnostic(`missing-${closer.toLowerCase()}`, `${open.block.kind.toUpperCase()} block is missing ${closer}.`, open.opener));
		open.block.span.end = source.length;
		open.block.range.end = sourceRange(source, { start: source.length, end: source.length }).range.end;
		open.block.bodySpan.end = source.length;
		open.block.bodyRange.end = open.block.range.end;
	}

	const diagnosedDatatypes = new Set<string>();
	for (const statement of statements.filter(candidate => candidate.kind === 'dim' && candidate.datatype !== undefined)) {
		if (!DATATYPE_SET.has(statement.datatype!.toUpperCase())) {
			const range = statement.datatypeRange ?? statement.range;
			const key = `${range.start.line}:${range.start.character}`;
			if (diagnosedDatatypes.has(key)) {
				continue;
			}
			diagnosedDatatypes.add(key);
			diagnostics.push({
				code: 'unknown-datatype',
				message: `Unknown datatype '${statement.datatype}'.`,
				severity: 'error',
				range,
			});
		}
	}

	const documentRange = sourceRange(source, { start: 0, end: source.length });
	return { source, tokens, statements, blocks, diagnostics, lines, ...documentRange };
}
