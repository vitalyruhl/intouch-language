import { DATATYPE_SET } from './languageData';
import { Range, SourceSpan, sourceRange } from './source';
import { Token, TokenKind } from './token';
import { tokenize } from './tokenizer';

export type BlockKind = 'if' | 'for' | 'while';
export type StatementKind =
	| 'dim'
	| 'assignment'
	| 'call'
	| 'direct-call'
	| 'command'
	| 'if'
	| 'else'
	| 'endif'
	| 'for'
	| 'next'
	| 'while'
	| 'exit-for'
	| 'return'
	| 'unknown';
export type DiagnosticSeverity = 'error' | 'warning' | 'information' | 'hint';

export interface CoreDiagnostic {
	code: string;
	message: string;
	severity: DiagnosticSeverity;
	range: Range;
	source?: string;
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

interface ParsedStatement {
	kind: StatementKind;
	first: Token;
	last: Token;
	names?: Token[];
	datatype?: Token;
	name?: Token;
	open?: BlockKind;
	middle?: boolean;
	close?: 'endif' | 'next';
	recoveredLoop?: boolean;
}

interface ExpressionIssue {
	code: 'missing-call-arguments' | 'missing-call-target' | 'missing-expression' | 'unexpected-token' | 'unclosed-delimiter';
	message: string;
	token?: Token;
}

const BINARY_PRECEDENCE = new Map<string, number>([
	['OR', 1],
	['XOR', 1],
	['|', 1],
	['AND', 2],
	['==', 3],
	['<>', 3],
	['<', 3],
	['<=', 3],
	['>', 3],
	['>=', 3],
	['IS', 3],
	['SHL', 4],
	['SHR', 4],
	['+', 5],
	['-', 5],
	['*', 6],
	['/', 6],
	['%', 6],
	['MOD', 6],
]);

const UNARY_OPERATORS = new Set(['+', '-', 'NOT', '!', '~']);
const LITERAL_KEYWORDS = new Set(['TRUE', 'FALSE', 'NULL', 'EOF']);
const CONTROL_KEYWORDS = new Set([
	'DIM', 'AS', 'CALL', 'IF', 'THEN', 'ELSE', 'ENDIF', 'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'EXIT', 'RETURN',
]);
const COMMAND_STATEMENTS = new Set(['ACTIVATEAPP', 'HIDE', 'PLAYSOUND', 'SENDKEYS', 'SHOW', 'STARTAPP']);

function isTrivia(token: Token): boolean {
	return token.kind === TokenKind.Whitespace
		|| token.kind === TokenKind.Newline
		|| token.kind === TokenKind.Comment
		|| token.kind === TokenKind.EOF;
}

function word(token: Token | undefined): string | undefined {
	return token === undefined ? undefined : token.lexeme.toUpperCase();
}

function keyword(token: Token | undefined): string | undefined {
	return token?.kind === TokenKind.Keyword ? word(token) : undefined;
}

function tokenNodeRange(source: string, first: Token, last: Token = first): { span: SourceSpan; range: Range } {
	return sourceRange(source, { start: first.span.start, end: last.span.end });
}

function zeroWidthRange(source: string, tokens: readonly Token[]): Range {
	const offset = tokens.length === 0 ? 0 : tokens[tokens.length - 1].span.end;
	return sourceRange(source, { start: offset, end: offset }).range;
}

function diagnostic(code: string, message: string, token: Token): CoreDiagnostic {
	return { code, message, severity: 'error', range: token.range };
}

function endDiagnostic(source: string, code: string, message: string, tokens: readonly Token[]): CoreDiagnostic {
	return { code, message, severity: 'error', range: zeroWidthRange(source, tokens) };
}

function lineTokens(tokens: readonly Token[], line: number): Token[] {
	return tokens.filter(token => token.range.start.line === line && !isTrivia(token));
}

function spanningCommentAt(tokens: readonly Token[], line: number): boolean {
	return tokens.some(token => token.kind === TokenKind.Comment
		&& token.range.end.line > token.range.start.line
		&& token.range.start.line <= line
		&& token.range.end.line >= line);
}

function tokenValue(token: Token | undefined): string | undefined {
	return token === undefined ? undefined : token.kind === TokenKind.Keyword ? word(token) : token.lexeme;
}

class ExpressionParser {
	private position = 0;
	private issue: ExpressionIssue | undefined;

	public constructor(private readonly tokens: readonly Token[]) {}

	public parse(): ExpressionIssue | undefined {
		if (this.tokens.length === 0) {
			return { code: 'missing-expression', message: 'Expected a QuickScript expression.' };
		}
		this.parseBinary(1);
		if (this.issue !== undefined) return this.issue;
		if (this.position < this.tokens.length) {
			return {
				code: 'unexpected-token',
				message: `Unexpected token '${this.tokens[this.position].lexeme}' in expression.`,
				token: this.tokens[this.position],
			};
		}
		return undefined;
	}

	private parseBinary(minimumPrecedence: number): void {
		this.parseUnary();
		while (this.issue === undefined) {
			const precedence = BINARY_PRECEDENCE.get(tokenValue(this.tokens[this.position]) ?? '');
			if (precedence === undefined || precedence < minimumPrecedence) return;
			this.position += 1;
			if (this.position >= this.tokens.length) {
				this.issue = { code: 'missing-expression', message: 'Expected an expression after the operator.' };
				return;
			}
			this.parseBinary(precedence + 1);
		}
	}

	private parseUnary(): void {
		while (UNARY_OPERATORS.has(tokenValue(this.tokens[this.position]) ?? '')) this.position += 1;
		this.parsePostfix();
	}

	private parsePostfix(): void {
		this.parsePrimary();
		while (this.issue === undefined && this.position < this.tokens.length) {
			const value = this.tokens[this.position].lexeme;
			if (value === '(') {
				const opening = this.tokens[this.position];
				this.parseArguments(opening);
				continue;
			}
			if (value === '[') {
				const opening = this.tokens[this.position];
				this.position += 1;
				this.parseBinary(1);
				this.expectClosing(']', opening);
				continue;
			}
			if (value === '.' || value === '->' || value === ':') {
				this.position += 1;
				if (!this.isMemberName(this.tokens[this.position])) {
					this.issue = { code: 'missing-expression', message: `Expected an identifier after '${value}'.`, token: this.tokens[this.position] };
					return;
				}
				this.position += 1;
				continue;
			}
			return;
		}
	}

	private parsePrimary(): void {
		const token = this.tokens[this.position];
		if (token === undefined) {
			this.issue = { code: 'missing-expression', message: 'Expected a QuickScript expression.' };
			return;
		}
		if (word(token) === 'CALL') {
			this.parseCallExpression(token);
			return;
		}
		if (token.lexeme === '(') {
			this.position += 1;
			this.parseBinary(1);
			this.expectClosing(')', token);
			return;
		}
		if (token.kind === TokenKind.Identifier || token.kind === TokenKind.Number || token.kind === TokenKind.String
			|| this.isCallableKeyword(token) || LITERAL_KEYWORDS.has(word(token) ?? '')) {
			this.position += 1;
			return;
		}
		this.issue = { code: 'unexpected-token', message: `Unexpected token '${token.lexeme}' in expression.`, token };
	}

	private parseCallExpression(call: Token): void {
		this.position += 1;
		const target = this.tokens[this.position];
		if (!this.isName(target)) {
			this.issue = {
				code: 'missing-call-target',
				message: 'CALL requires a callable name.',
				token: target ?? call,
			};
			return;
		}
		this.position += 1;
		while (['.', '->', ':'].includes(this.tokens[this.position]?.lexeme ?? '')) {
			const separator = this.tokens[this.position];
			this.position += 1;
			if (!this.isName(this.tokens[this.position])) {
				this.issue = {
					code: 'missing-expression',
					message: `Expected an identifier after '${separator.lexeme}'.`,
					token: this.tokens[this.position],
				};
				return;
			}
			this.position += 1;
		}
		const opening = this.tokens[this.position];
		if (opening?.lexeme !== '(') {
			this.issue = {
				code: 'missing-call-arguments',
				message: "CALL requires '(' after the callable name.",
				token: opening,
			};
			return;
		}
		this.parseArguments(opening);
	}

	private parseArguments(opening: Token): void {
		this.position += 1;
		if (this.tokens[this.position]?.lexeme !== ')') {
			while (this.issue === undefined) {
				this.parseBinary(1);
				if (this.tokens[this.position]?.lexeme !== ',') break;
				this.position += 1;
			}
		}
		this.expectClosing(')', opening);
	}

	private expectClosing(value: ')' | ']', opening: Token): void {
		if (this.issue !== undefined) return;
		if (this.tokens[this.position]?.lexeme !== value) {
			this.issue = {
				code: 'unclosed-delimiter',
				message: `Expected '${value}' to close '${opening.lexeme}'.`,
				token: this.tokens[this.position],
			};
			return;
		}
		this.position += 1;
	}

	private isName(token: Token | undefined): boolean {
		return token?.kind === TokenKind.Identifier || this.isCallableKeyword(token);
	}

	private isMemberName(token: Token | undefined): boolean {
		return token?.kind === TokenKind.Number || this.isName(token);
	}

	private isCallableKeyword(token: Token | undefined): boolean {
		return token?.kind === TokenKind.Keyword
			&& !CONTROL_KEYWORDS.has(word(token) ?? '')
			&& !BINARY_PRECEDENCE.has(word(token) ?? '')
			&& !UNARY_OPERATORS.has(word(token) ?? '');
	}
}

function expressionIssue(source: string, tokens: readonly Token[], issue: ExpressionIssue): CoreDiagnostic {
	return issue.token === undefined
		? endDiagnostic(source, issue.code, issue.message, tokens)
		: diagnostic(issue.code, issue.message, issue.token);
}

function validateExpression(source: string, tokens: readonly Token[], diagnostics: CoreDiagnostic[]): boolean {
	const issue = new ExpressionParser(tokens).parse();
	if (issue === undefined) return true;
	diagnostics.push(expressionIssue(source, tokens, issue));
	return false;
}

class StatementParser {
	private position = 0;
	private readonly statements: ParsedStatement[] = [];

	public constructor(
		private readonly source: string,
		private readonly tokens: readonly Token[],
		private readonly diagnostics: CoreDiagnostic[],
	) {}

	public parse(): ParsedStatement[] {
		while (this.position < this.tokens.length) {
			const start = this.position;
			this.parseStatement();
			if (this.position <= start) this.position += 1;
		}
		return this.statements;
	}

	private parseStatement(): void {
		switch (keyword(this.current())) {
			case 'DIM': this.parseDim(); return;
			case 'CALL': this.parseCall(); return;
			case 'IF': this.parseIf(); return;
			case 'ELSE': this.parseElse(); return;
			case 'ENDIF': this.parseCloser('endif'); return;
			case 'FOR': this.parseFor(); return;
			case 'NEXT': this.parseCloser('next'); return;
			case 'WHILE': this.parseWhile(); return;
			case 'EXIT': this.parseExit(); return;
			case 'RETURN': this.parseReturn(); return;
			default: this.parseIdentifierStatement();
		}
	}

	private parseDim(): void {
		const first = this.consume();
		const names: Token[] = [];
		let expectName = true;
		while (this.position < this.tokens.length && keyword(this.current()) !== 'AS' && this.current()?.lexeme !== ';') {
			const token = this.consume();
			if (expectName && token.kind === TokenKind.Identifier) {
				names.push(token);
				expectName = false;
			} else if (!expectName && token.lexeme === ',') {
				expectName = true;
			} else {
				this.diagnostics.push(diagnostic('unexpected-token', `Unexpected token '${token.lexeme}' in DIM declaration.`, token));
			}
		}
		if (names.length === 0 || expectName) {
			this.diagnostics.push(endDiagnostic(this.source, 'missing-identifier', 'DIM requires a variable name.', this.tokens.slice(0, this.position)));
		}
		let datatype: Token | undefined;
		if (keyword(this.current()) !== 'AS') {
			this.diagnostics.push(endDiagnostic(this.source, 'missing-as', "DIM requires 'AS' before the datatype.", this.tokens.slice(0, this.position)));
		} else {
			this.consume();
			datatype = this.current();
			if (datatype === undefined || datatype.lexeme === ';') {
				this.diagnostics.push(endDiagnostic(this.source, 'missing-datatype', 'DIM requires a datatype after AS.', this.tokens.slice(0, this.position)));
			} else {
				this.consume();
			}
		}
		const last = this.consumeTerminator('DIM statement', datatype ?? names[names.length - 1] ?? first);
		this.statements.push({ kind: 'dim', first, last, names, datatype });
	}

	private parseCall(): void {
		const first = this.consume();
		const name = this.current();
		const end = this.statementBoundary(this.position);
		const expression = this.tokens.slice(this.position, end);
		const valid = validateExpression(this.source, expression, this.diagnostics);
		if (name === undefined || (name.kind !== TokenKind.Identifier && name.kind !== TokenKind.Keyword)) {
			this.diagnostics.push(endDiagnostic(this.source, 'missing-call-target', 'CALL requires a callable name.', [first]));
		} else if (valid && !expression.some(token => token.lexeme === '(')) {
			this.diagnostics.push(diagnostic('missing-call-arguments', "CALL requires '(' after the callable name.", name));
		}
		this.position = end;
		const last = this.consumeTerminator('CALL statement', expression[expression.length - 1] ?? first);
		this.statements.push({ kind: 'call', first, last, name });
	}

	private parseIf(): void {
		const first = this.consume();
		const thenIndex = this.findTopLevelKeyword(this.position, new Set(['THEN']));
		let last = first;
		if (thenIndex < 0) {
			const expression = this.tokens.slice(this.position);
			this.diagnostics.push(endDiagnostic(this.source, 'missing-then', "IF requires 'THEN' after its condition.", expression.length > 0 ? expression : [first]));
			this.position = this.tokens.length;
			last = expression[expression.length - 1] ?? first;
		} else {
			validateExpression(this.source, this.tokens.slice(this.position, thenIndex), this.diagnostics);
			this.position = thenIndex;
			last = this.consume();
			if (this.current()?.lexeme === ';') {
				this.diagnostics.push(diagnostic('unexpected-semicolon', 'IF header must not be terminated after THEN.', this.current()!));
				this.consume();
			}
		}
		this.statements.push({ kind: 'if', first, last, open: 'if' });
	}

	private parseElse(): void {
		const first = this.consume();
		if (this.current()?.lexeme === ';') {
			this.diagnostics.push(diagnostic('unexpected-semicolon', 'ELSE must not be terminated with a semicolon.', this.current()!));
			this.consume();
		}
		this.statements.push({ kind: 'else', first, last: first, middle: true });
	}

	private parseFor(): void {
		const first = this.consume();
		const target = this.current();
		if (target?.kind !== TokenKind.Identifier) {
			this.diagnostics.push(target === undefined
				? endDiagnostic(this.source, 'missing-loop-variable', 'FOR requires a loop variable.', [first])
				: diagnostic('missing-loop-variable', 'FOR requires a loop variable.', target));
		} else {
			this.consume();
		}
		if (this.current()?.lexeme !== '=') {
			const conflicting = this.current();
			this.diagnostics.push(conflicting === undefined
				? endDiagnostic(this.source, 'expected-equals', "Expected '=' after FOR loop variable.", target === undefined ? [first] : [first, target])
				: diagnostic('expected-equals', "Expected '=' after FOR loop variable.", conflicting));
			if (conflicting?.lexeme === '==') this.consume();
		} else {
			this.consume();
		}

		const toIndex = this.findTopLevelKeyword(this.position, new Set(['TO']));
		let last = target ?? first;
		if (toIndex < 0) {
			const end = this.headerEnd(this.position);
			const expression = this.tokens.slice(this.position, end);
			this.diagnostics.push(endDiagnostic(this.source, 'missing-to', "FOR requires 'TO' after the initial expression.", expression.length > 0 ? expression : [first]));
			this.position = end;
			last = expression[expression.length - 1] ?? last;
		} else {
			validateExpression(this.source, this.tokens.slice(this.position, toIndex), this.diagnostics);
			this.position = toIndex + 1;
			const stepIndex = this.findTopLevelKeyword(this.position, new Set(['STEP']));
			const end = this.headerEnd(this.position);
			const limitEnd = stepIndex >= 0 && stepIndex < end ? stepIndex : end;
			const limit = this.tokens.slice(this.position, limitEnd);
			validateExpression(this.source, limit, this.diagnostics);
			last = limit[limit.length - 1] ?? this.tokens[toIndex];
			if (stepIndex >= 0 && stepIndex < end) {
				const step = this.tokens.slice(stepIndex + 1, end);
				validateExpression(this.source, step, this.diagnostics);
				last = step[step.length - 1] ?? this.tokens[stepIndex];
			}
			this.position = end;
		}
		if (this.current()?.lexeme === ';') {
			this.diagnostics.push(diagnostic('unexpected-semicolon', 'FOR header must not be terminated with a semicolon.', this.current()!));
			this.consume();
		}
		this.statements.push({ kind: 'for', first, last, open: 'for' });
	}

	private parseWhile(): void {
		const first = this.consume();
		const end = this.headerEnd(this.position);
		const expression = this.tokens.slice(this.position, end);
		validateExpression(this.source, expression, this.diagnostics);
		this.position = end;
		const last = expression[expression.length - 1] ?? first;
		if (this.current()?.lexeme === ';') {
			this.diagnostics.push(diagnostic('unexpected-semicolon', 'WHILE header must not be terminated with a semicolon.', this.current()!));
			this.consume();
		}
		this.statements.push({ kind: 'while', first, last, open: 'while' });
	}

	private parseCloser(close: 'endif' | 'next'): void {
		const first = this.consume();
		const label = close === 'endif' ? 'ENDIF' : 'NEXT';
		const last = this.consumeTerminator(`${label} statement`, first);
		this.statements.push({ kind: close, first, last, close });
	}

	private parseExit(): void {
		const first = this.consume();
		let last = first;
		if (keyword(this.current()) !== 'FOR') {
			this.diagnostics.push(this.current() === undefined
				? endDiagnostic(this.source, 'missing-exit-target', "EXIT requires 'FOR'.", [first])
				: diagnostic('missing-exit-target', "EXIT requires 'FOR'.", this.current()!));
		} else {
			last = this.consume();
		}
		last = this.consumeTerminator('EXIT FOR statement', last);
		this.statements.push({ kind: 'exit-for', first, last });
	}

	private parseReturn(): void {
		const first = this.consume();
		const end = this.statementBoundary(this.position);
		const expression = this.tokens.slice(this.position, end);
		if (expression.length > 0) validateExpression(this.source, expression, this.diagnostics);
		this.position = end;
		const last = this.consumeTerminator('RETURN statement', expression[expression.length - 1] ?? first);
		this.statements.push({ kind: 'return', first, last });
	}

	private parseIdentifierStatement(): void {
		const first = this.current()!;
		const end = this.statementBoundary(this.position);
		const body = this.tokens.slice(this.position, end);
		const assignmentIndex = this.findTopLevelLexeme(this.position, '=');
		const assignmentInBody = assignmentIndex >= this.position && assignmentIndex < end;
		const isDirectCall = this.looksLikeDirectCall(body);
		let kind: StatementKind = 'unknown';

		if (COMMAND_STATEMENTS.has(word(first) ?? '') && body[1]?.lexeme !== '(') {
			validateExpression(this.source, body.slice(1), this.diagnostics);
			kind = 'command';
		} else if (assignmentInBody) {
			const target = this.tokens.slice(this.position, assignmentIndex);
			if (!this.isAssignable(target)) {
				this.diagnostics.push(diagnostic('invalid-statement', `Unknown or invalid QuickScript statement '${first.lexeme}'.`, first));
			} else {
				kind = 'assignment';
			}
			validateExpression(this.source, this.tokens.slice(assignmentIndex + 1, end), this.diagnostics);
		} else if (isDirectCall) {
			validateExpression(this.source, body, this.diagnostics);
			kind = 'direct-call';
		} else {
			const validExpression = validateExpression(this.source, body, []);
			this.diagnostics.push(diagnostic(
				validExpression ? 'expected-assignment' : 'invalid-statement',
				validExpression ? 'Expected assignment or valid QuickScript statement.' : `Unknown or invalid QuickScript statement '${first.lexeme}'.`,
				first,
			));
		}

		this.position = end;
		const requiresTerminator = kind !== 'unknown' || this.current()?.lexeme === ';';
		const last = requiresTerminator
			? this.consumeTerminator(
				kind === 'assignment' ? 'Assignment' : kind === 'direct-call' ? 'Function call' : kind === 'command' ? 'Command statement' : 'Statement',
				body[body.length - 1] ?? first,
			)
			: body[body.length - 1] ?? first;
		const recoveredLoop = kind === 'unknown'
			&& body.some(token => token.lexeme === '=')
			&& body.some(token => keyword(token) === 'TO');
		this.statements.push({ kind, first, last, name: kind === 'direct-call' ? first : undefined, recoveredLoop });
	}

	private statementBoundary(start: number): number {
		let depth = 0;
		for (let index = start; index < this.tokens.length; index += 1) {
			const token = this.tokens[index];
			if (token.lexeme === '(' || token.lexeme === '[') depth += 1;
			if (token.lexeme === ')' || token.lexeme === ']') depth = Math.max(0, depth - 1);
			if (token.lexeme === ';' || (depth === 0 && ['ELSE', 'ENDIF', 'NEXT'].includes(keyword(token) ?? ''))) return index;
		}
		return this.tokens.length;
	}

	private headerEnd(start: number): number {
		let depth = 0;
		for (let index = start; index < this.tokens.length; index += 1) {
			const token = this.tokens[index];
			if (token.lexeme === '(' || token.lexeme === '[') depth += 1;
			if (token.lexeme === ')' || token.lexeme === ']') depth = Math.max(0, depth - 1);
			if (depth === 0 && token.lexeme === ';') return index;
		}
		return this.tokens.length;
	}

	private findTopLevelKeyword(start: number, values: ReadonlySet<string>): number {
		let depth = 0;
		for (let index = start; index < this.tokens.length; index += 1) {
			const token = this.tokens[index];
			if (token.lexeme === '(' || token.lexeme === '[') depth += 1;
			if (token.lexeme === ')' || token.lexeme === ']') depth = Math.max(0, depth - 1);
			if (depth === 0 && values.has(keyword(token) ?? '')) return index;
		}
		return -1;
	}

	private findTopLevelLexeme(start: number, value: string): number {
		let depth = 0;
		for (let index = start; index < this.tokens.length; index += 1) {
			const token = this.tokens[index];
			if (token.lexeme === '(' || token.lexeme === '[') depth += 1;
			if (token.lexeme === ')' || token.lexeme === ']') depth = Math.max(0, depth - 1);
			if (depth === 0 && token.lexeme === value) return index;
		}
		return -1;
	}

	private isAssignable(tokens: readonly Token[]): boolean {
		if (tokens.length === 0 || tokens[0].kind !== TokenKind.Identifier) return false;
		let index = 1;
		while (index < tokens.length) {
			if (['.', '->', ':'].includes(tokens[index].lexeme)
				&& [TokenKind.Identifier, TokenKind.Number].includes(tokens[index + 1]?.kind)) {
				index += 2;
				continue;
			}
			if (tokens[index].lexeme === '[') {
				const closing = tokens.findIndex((token, candidate) => candidate > index && token.lexeme === ']');
				if (closing < 0 || !validateExpression(this.source, tokens.slice(index + 1, closing), [])) return false;
				index = closing + 1;
				continue;
			}
			return false;
		}
		return true;
	}

	private looksLikeDirectCall(tokens: readonly Token[]): boolean {
		if (tokens.length < 3 || (tokens[0].kind !== TokenKind.Identifier && tokens[0].kind !== TokenKind.Keyword)) return false;
		return tokens.some(token => token.lexeme === '(');
	}

	private consumeTerminator(label: string, fallback: Token): Token {
		if (this.current()?.lexeme === ';') return this.consume();
		this.diagnostics.push(endDiagnostic(this.source, 'missing-semicolon', `${label} is missing the required semicolon.`, [fallback]));
		return fallback;
	}

	private current(): Token | undefined {
		return this.tokens[this.position];
	}

	private consume(): Token {
		const token = this.tokens[this.position];
		this.position += 1;
		return token;
	}
}

function delimiterContinuationEnd(tokensByLine: readonly Token[][], startLine: number): number {
	let depth = 0;
	for (let line = startLine; line < tokensByLine.length; line += 1) {
		for (const token of tokensByLine[line]) {
			if (token.lexeme === '(' || token.lexeme === '[') depth += 1;
			if (token.lexeme === ')' || token.lexeme === ']') depth = Math.max(0, depth - 1);
		}
		if (depth === 0 || tokensByLine[line].some(token => token.lexeme === ';')) return line;
	}
	return tokensByLine.length - 1;
}

function continuationEnd(tokensByLine: readonly Token[][], startLine: number): number {
	const delimiterEnd = delimiterContinuationEnd(tokensByLine, startLine);
	if (delimiterEnd > startLine) return delimiterEnd;
	const first = tokensByLine[startLine];
	const startsIf = keyword(first[0]) === 'IF';
	const startsElseIf = keyword(first[0]) === 'ELSE' && keyword(first[1]) === 'IF';
	if ((!startsIf && !startsElseIf) || first.some(token => keyword(token) === 'THEN')) return startLine;
	const bareIf = startsIf && first.length === 1;
	const trailingContinuation = ['AND', 'OR', 'NOT'].includes(keyword(first[first.length - 1]) ?? '');
	const leadingContinuation = ['AND', 'OR'].includes(keyword(tokensByLine[startLine + 1]?.[0]) ?? '');
	if (!bareIf && !trailingContinuation && !leadingContinuation) return startLine;
	for (let line = startLine + 1; line < tokensByLine.length; line += 1) {
		if (tokensByLine[line].some(token => keyword(token) === 'THEN')) return line;
	}
	return startLine;
}

/** Parse recoverable QuickScript grammar and structure from the canonical token stream. */
export function parseQuickScript(source: string): QuickScriptDocument {
	const tokens = tokenize(source);
	const lineCount = source.length === 0 ? 1 : source.split(/\r\n|\r|\n/).length;
	const tokensByLine = Array.from({ length: lineCount }, (_, line) => lineTokens(tokens, line));
	const statements: StatementNode[] = [];
	const blocks: BlockNode[] = [];
	const diagnostics: CoreDiagnostic[] = [];
	const lines: LineStructure[] = new Array(lineCount);
	const stack: OpenBlock[] = [];
	const recoveredForStackDepths: number[] = [];

	for (let line = 0; line < lineCount; line += 1) {
		const physicalTokens = tokensByLine[line];
		const endLine = continuationEnd(tokensByLine, line);
		const significant = endLine === line ? physicalTokens : tokensByLine.slice(line, endLine + 1).flat();
		let visualDepth = stack.length + recoveredForStackDepths.length;
		const firstValue = keyword(significant[0]);
		if (firstValue === 'ELSE' || firstValue === 'ENDIF' || firstValue === 'NEXT') visualDepth = Math.max(0, visualDepth - 1);
		lines[line] = { line, indentDepth: visualDepth, preserveIndent: spanningCommentAt(tokens, line) };
		for (let continuationLine = line + 1; continuationLine <= endLine; continuationLine += 1) {
			lines[continuationLine] = {
				line: continuationLine,
				indentDepth: visualDepth + 2,
				preserveIndent: spanningCommentAt(tokens, continuationLine),
			};
		}

		const parsed = significant.length === 0 ? [] : new StatementParser(source, significant, diagnostics).parse();
		for (const statement of parsed) {
			const parentBlockId = stack[stack.length - 1]?.block.id;
			const located = tokenNodeRange(source, statement.first, statement.last);
			if (statement.kind === 'dim' && statement.names !== undefined) {
				for (const name of statement.names) {
					statements.push({
						kind: 'dim',
						...located,
						name: name.lexeme,
						nameRange: name.range,
						datatype: statement.datatype?.lexeme,
						datatypeRange: statement.datatype?.range,
						parentBlockId,
					});
				}
			} else {
				statements.push({
					kind: statement.kind,
					...located,
					name: statement.name?.lexeme,
					nameRange: statement.name?.range,
					parentBlockId,
				});
			}

			if (statement.recoveredLoop) recoveredForStackDepths.push(stack.length);
			if (statement.open !== undefined) {
				const parent = stack[stack.length - 1]?.block;
				const blockLocated = tokenNodeRange(source, statement.first, statement.last);
				const block: BlockNode = {
					id: blocks.length,
					kind: statement.open,
					parentId: parent?.id,
					childIds: [],
					...blockLocated,
					bodyRange: { start: statement.last.range.end, end: statement.last.range.end },
					bodySpan: { start: statement.last.span.end, end: statement.last.span.end },
					opener: statement.first.range,
				};
				blocks.push(block);
				parent?.childIds.push(block.id);
				stack.push({ block, opener: statement.first, hasElse: false });
				continue;
			}
			if (statement.middle) {
				const open = stack[stack.length - 1];
				if (open?.block.kind !== 'if') diagnostics.push(diagnostic('invalid-nesting', 'ELSE has no matching IF.', statement.first));
				else if (open.hasElse) diagnostics.push(diagnostic('duplicate-else', 'IF block has more than one ELSE.', statement.first));
				else {
					open.hasElse = true;
					open.block.middle = statement.first.range;
				}
				continue;
			}
			if (statement.close !== undefined) {
				const recoveredDepth = recoveredForStackDepths[recoveredForStackDepths.length - 1];
				if (statement.close === 'next' && recoveredDepth === stack.length) {
					recoveredForStackDepths.pop();
					continue;
				}
				const expected = statement.close === 'endif' ? ['if'] : ['for', 'while'];
				const open = stack[stack.length - 1];
				if (open === undefined || !expected.includes(open.block.kind)) {
					const label = statement.close === 'endif' ? 'ENDIF' : 'NEXT';
					diagnostics.push(diagnostic('invalid-nesting', `${label} has no matching ${statement.close === 'endif' ? 'IF' : 'FOR or WHILE'}.`, statement.first));
				} else {
					stack.pop();
					open.block.closer = statement.first.range;
					open.block.span.end = statement.last.span.end;
					open.block.range.end = statement.last.range.end;
					open.block.bodySpan.end = statement.first.span.start;
					open.block.bodyRange.end = statement.first.range.start;
				}
			}
		}
		line = endLine;
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
			if (diagnosedDatatypes.has(key)) continue;
			diagnosedDatatypes.add(key);
			diagnostics.push({ code: 'unknown-datatype', message: `Unknown datatype '${statement.datatype}'.`, severity: 'error', range });
		}
	}

	const documentRange = sourceRange(source, { start: 0, end: source.length });
	return { source, tokens, statements, blocks, diagnostics, lines, ...documentRange };
}
