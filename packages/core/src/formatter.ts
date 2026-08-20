import { Token, TokenKind } from './token';
import { tokenize } from './tokenizer';
import { CoreDiagnostic, parseQuickScript } from './parser';

export interface FormatOptions {
	lineEnding?: '\n' | '\r\n';
	indentSize?: number;
	insertSpaces?: boolean;
	removeEmptyLines?: boolean;
	removeEmptyLinesInComments?: boolean;
	allowedNumberOfEmptyLines?: number;
	blockCodeBegin?: string;
	blockCodeEnd?: string;
	blockCodeExclude?: string;
	regionBlockCodeBegin?: string;
	regionBlockCodeEnd?: string;
	regionBlockCodeExclude?: string;
}

export interface FormatResult {
	text: string;
	changed: boolean;
	diagnostics?: CoreDiagnostic[];
}

function isLineBoundary(token: Token | undefined): boolean {
	return token === undefined || token.kind === TokenKind.Newline || token.kind === TokenKind.EOF;
}

function previousSignificant(tokens: readonly Token[], index: number): Token | undefined {
	for (let current = index - 1; current >= 0; current -= 1) {
		if (tokens[current].kind !== TokenKind.Whitespace && tokens[current].kind !== TokenKind.Newline) {
			return tokens[current];
		}
	}
	return undefined;
}

function nextSignificant(tokens: readonly Token[], index: number): Token | undefined {
	for (let current = index + 1; current < tokens.length; current += 1) {
		if (tokens[current].kind !== TokenKind.Whitespace) {
			return tokens[current];
		}
	}
	return undefined;
}

function trimHorizontalWhitespace(output: string[]): void {
	if (output.length > 0 && /^[ \t\f\v]+$/.test(output[output.length - 1])) {
		output.pop();
	}
}

function appendSingleSpace(output: string[]): void {
	trimHorizontalWhitespace(output);
	const tail = output[output.length - 1];
	if (tail !== undefined && !tail.endsWith('\n') && !tail.endsWith('\r')) {
		output.push(' ');
	}
}

function isUnaryMinus(tokens: readonly Token[], index: number): boolean {
	if (tokens[index].lexeme !== '-' || nextSignificant(tokens, index)?.kind !== TokenKind.Number) {
		return false;
	}
	const previous = previousSignificant(tokens, index);
	return previous === undefined
		|| previous.kind === TokenKind.Operator
		|| (previous.kind === TokenKind.Punctuation && ['(', '[', ',', ';', ':'].includes(previous.lexeme));
}

function normalizeLineTails(text: string, lineEnding: '\n' | '\r\n'): string {
	const lines = text.split(/\r\n|\r|\n/).map(line => line.replace(/[ \t\f\v]+$/g, ''));
	return lines.join(lineEnding);
}

/**
 * Apply lexical QuickScript formatting without editor or file-system dependencies.
 * String and comment lexemes are emitted unchanged; all classification comes from the tokenizer.
 */
export function formatQuickScriptLexically(source: string, options: FormatOptions = {}): FormatResult {
	const lineEnding = options.lineEnding ?? '\r\n';
	const normalizedSource = source.replace(/\r\n|\r|\n/g, lineEnding);
	const tokens = tokenize(normalizedSource);

	// Match the legacy safety behavior for incomplete strings and unmatched closing comments.
	if (tokens.some(token => token.kind === TokenKind.String && !token.lexeme.endsWith('"'))
		|| tokens.some(token => token.kind === TokenKind.Unknown && token.lexeme === '}')) {
		return { text: normalizedSource, changed: normalizedSource !== source };
	}

	const output: string[] = [];
	let skipWhitespace = false;
	let preserveStandaloneDirectiveContent = false;
	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (token.kind === TokenKind.EOF) {
			break;
		}
		const standaloneDirective = token.kind === TokenKind.Comment ? token.lexeme.trim() : undefined;
		const closesStandaloneDirective = standaloneDirective !== undefined
			&& (matchesDirective(standaloneDirective, options.blockCodeEnd ?? '{<')
				|| matchesDirective(standaloneDirective, options.regionBlockCodeEnd ?? '{endregion'));
		if (closesStandaloneDirective) {
			preserveStandaloneDirectiveContent = false;
		}
		if (preserveStandaloneDirectiveContent) {
			output.push(token.lexeme);
			continue;
		}
		if (token.kind === TokenKind.Newline) {
			trimHorizontalWhitespace(output);
			output.push(lineEnding);
			skipWhitespace = false;
			continue;
		}
		if (token.kind === TokenKind.Whitespace) {
			if (!skipWhitespace) {
				output.push(token.lexeme);
			}
			skipWhitespace = false;
			continue;
		}
		skipWhitespace = false;

		const next = nextSignificant(tokens, index);
		if (token.kind === TokenKind.Keyword || token.kind === TokenKind.Datatype) {
			output.push(token.lexeme.toUpperCase());
			continue;
		}

		if (token.kind === TokenKind.Operator) {
			if (isUnaryMinus(tokens, index)) {
				output.push('-');
				skipWhitespace = true;
				continue;
			}
			appendSingleSpace(output);
			output.push(token.lexeme);
			if (!isLineBoundary(next)) {
				output.push(' ');
			}
			skipWhitespace = true;
			continue;
		}

		if (token.kind === TokenKind.Punctuation) {
			if (token.lexeme === '(' || token.lexeme === '[') {
				const previous = previousSignificant(tokens, index);
				trimHorizontalWhitespace(output);
				if (token.lexeme === '(' && previous?.kind === TokenKind.Keyword && previous.lexeme.toUpperCase() === 'IF') {
					appendSingleSpace(output);
				}
				output.push(token.lexeme);
				skipWhitespace = true;
				continue;
			}
			if (token.lexeme === ')' || token.lexeme === ']') {
				trimHorizontalWhitespace(output);
				output.push(token.lexeme);
				if (next !== undefined && (next.kind === TokenKind.Identifier || next.kind === TokenKind.Keyword || next.kind === TokenKind.Datatype)) {
					output.push(' ');
					skipWhitespace = true;
				}
				continue;
			}
			if (token.lexeme === ',' || token.lexeme === ';') {
				trimHorizontalWhitespace(output);
				output.push(token.lexeme);
				if (!isLineBoundary(next) && !(token.lexeme === ',' && next?.lexeme === ')')) {
					output.push(' ');
				}
				skipWhitespace = true;
				continue;
			}
		}

		if (token.kind === TokenKind.Comment) {
			const previous = previousSignificant(tokens, index);
			if (previous?.kind === TokenKind.Keyword && previous.lexeme.toUpperCase() === 'THEN') {
				appendSingleSpace(output);
			}
			output.push(token.lexeme);
			const opensStandaloneDirective = standaloneDirective !== undefined
				&& !standaloneDirective.endsWith('}')
				&& (matchesDirective(standaloneDirective, options.blockCodeBegin ?? '{>')
					|| matchesDirective(standaloneDirective, options.regionBlockCodeBegin ?? '{region'));
			if (opensStandaloneDirective) {
				preserveStandaloneDirectiveContent = true;
			}
			if (next !== undefined && (next.kind === TokenKind.Identifier || next.kind === TokenKind.Keyword || next.kind === TokenKind.Datatype)) {
				output.push(' ');
				skipWhitespace = true;
			}
			continue;
		}

		output.push(token.lexeme);
	}

	const text = normalizeLineTails(output.join(''), lineEnding);
	return { text, changed: text !== source };
}

function normalizedIndent(options: FormatOptions): string {
	const size = Number.isInteger(options.indentSize) && options.indentSize! >= 1 && options.indentSize! <= 10
		? options.indentSize!
		: 4;
	return options.insertSpaces === false ? '\t' : ' '.repeat(size);
}

function normalizeStructuredLine(line: string): string {
	const tokens = tokenize(line);
	const output: string[] = [];
	for (const token of tokens) {
		if (token.kind === TokenKind.EOF || token.kind === TokenKind.Newline) {
			continue;
		}
		if (token.kind === TokenKind.Whitespace) {
			if (output.length > 0 && output[output.length - 1] !== ' ') {
				output.push(' ');
			}
		} else {
			output.push(token.lexeme);
		}
	}
	return output.join('').replace(/[ \t]+$/g, '');
}

function matchesDirective(line: string, marker: string | undefined): boolean {
	return marker !== undefined && marker.length > 0 && line.toLowerCase().startsWith(marker.toLowerCase());
}

interface MultilineCommentShift {
	endLine: number;
	originalIndent: string;
	targetIndent: string;
}

function isFormatterDirective(line: string, options: FormatOptions): boolean {
	return matchesDirective(line, options.blockCodeBegin ?? '{>')
		|| matchesDirective(line, options.blockCodeEnd ?? '{<')
		|| matchesDirective(line, options.blockCodeExclude ?? '{#')
		|| matchesDirective(line, options.regionBlockCodeBegin ?? '{region')
		|| matchesDirective(line, options.regionBlockCodeEnd ?? '{endregion')
		|| matchesDirective(line, options.regionBlockCodeExclude ?? '{#');
}

function multilineCommentStarts(source: string, options: FormatOptions): Map<number, Token> {
	const starts = new Map<number, Token>();
	for (const token of tokenize(source)) {
		if (token.kind !== TokenKind.Comment || token.range.end.line <= token.range.start.line) continue;
		const lineStart = source.lastIndexOf('\n', token.span.start - 1) + 1;
		const beforeComment = source.slice(lineStart, token.span.start);
		const trimmed = token.lexeme.trimStart();
		if (/^[ \t]*$/.test(beforeComment) && trimmed.startsWith('{') && !isFormatterDirective(trimmed, options)) {
			starts.set(token.range.start.line, token);
		}
	}
	return starts;
}

function shiftCommentLine(line: string, shift: MultilineCommentShift): string {
	if (line.startsWith(shift.originalIndent)) {
		return shift.targetIndent + line.slice(shift.originalIndent.length);
	}
	const leading = line.match(/^[ \t]*/)?.[0] ?? '';
	const delta = shift.targetIndent.length - shift.originalIndent.length;
	if (delta < 0) return line.slice(Math.min(-delta, leading.length));
	if (delta > 0) return shift.targetIndent.slice(0, delta) + line;
	return line;
}

/** Apply parser-driven indentation to lexically normalized QuickScript. */
export function formatQuickScriptStructure(source: string, options: FormatOptions = {}): FormatResult {
	const lineEnding = options.lineEnding ?? '\r\n';
	const normalizedSource = source.replace(/\r\n|\r|\n/g, lineEnding);
	const document = parseQuickScript(normalizedSource);
	const sourceLines = normalizedSource.split(lineEnding);
	const commentStarts = multilineCommentStarts(normalizedSource, options);
	const output: string[] = [];
	const indent = normalizedIndent(options);
	let directiveDepth = 0;
	let blankCount = 0;
	let commentShift: MultilineCommentShift | undefined;
	const maximumBlankLines = options.removeEmptyLines === false
		? Number.POSITIVE_INFINITY
		: Math.max(0, options.allowedNumberOfEmptyLines ?? 1);

	for (let lineNumber = 0; lineNumber < sourceLines.length; lineNumber += 1) {
		const original = sourceLines[lineNumber].replace(/[ \t]+$/g, '');
		const structure = document.lines[lineNumber];
		if (commentShift !== undefined && lineNumber <= commentShift.endLine) {
			if (original.trim().length === 0) {
				if (options.removeEmptyLinesInComments !== true) {
					blankCount = 0;
					output.push(shiftCommentLine(original, commentShift));
				} else {
					blankCount += 1;
					if (blankCount <= maximumBlankLines) output.push('');
				}
			} else {
				blankCount = 0;
				output.push(shiftCommentLine(original, commentShift));
			}
			if (lineNumber === commentShift.endLine) commentShift = undefined;
			continue;
		}
		if (original.trim().length === 0) {
			if (structure?.preserveIndent && options.removeEmptyLinesInComments !== true) {
				blankCount = 0;
				output.push(original);
				continue;
			}
			blankCount += 1;
			if (blankCount <= maximumBlankLines || lineNumber === sourceLines.length - 1) {
				output.push('');
			}
			continue;
		}
		blankCount = 0;

		const trimmed = original.trimStart();
		const closesDirective = matchesDirective(trimmed, options.blockCodeEnd ?? '{<')
			|| matchesDirective(trimmed, options.regionBlockCodeEnd ?? '{endregion');
		const excludesDirective = matchesDirective(trimmed, options.blockCodeExclude ?? '{#')
			|| matchesDirective(trimmed, options.regionBlockCodeExclude ?? '{#');
		if (closesDirective) {
			directiveDepth = Math.max(0, directiveDepth - 1);
		}

		const back = excludesDirective ? 1 : 0;
		const depth = Math.max(0, (structure?.indentDepth ?? 0) + directiveDepth - back);
		const multilineComment = commentStarts.get(lineNumber);
		if (multilineComment !== undefined) {
			const originalIndent = original.match(/^[ \t]*/)?.[0] ?? '';
			const targetIndent = indent.repeat(depth);
			output.push(targetIndent + original.slice(originalIndent.length));
			commentShift = { endLine: multilineComment.range.end.line, originalIndent, targetIndent };
		} else if (structure?.preserveIndent) {
			output.push(original);
		} else {
			output.push(indent.repeat(depth) + normalizeStructuredLine(trimmed));
		}

		const opensDirective = matchesDirective(trimmed, options.blockCodeBegin ?? '{>')
			|| matchesDirective(trimmed, options.regionBlockCodeBegin ?? '{region');
		if (opensDirective) {
			directiveDepth += 1;
		}
	}

	const text = output.join(lineEnding);
	return { text, changed: text !== source, diagnostics: document.diagnostics };
}

/** Format QuickScript through the canonical tokenizer and structure parser. */
export function formatQuickScript(source: string, options: FormatOptions = {}): FormatResult {
	const lexical = formatQuickScriptLexically(source, options);
	return formatQuickScriptStructure(lexical.text, options);
}
