import { DATATYPE_SET, KEYWORD_SET, OPERATORS, PUNCTUATION } from './languageData';
import { Position } from './source';
import { Token, TokenKind } from './token';

function isIdentifierStart(character: string | undefined): boolean {
	return character !== undefined && /[A-Za-z_$#]/.test(character);
}

function isIdentifierPart(character: string | undefined): boolean {
	return character !== undefined && /[A-Za-z0-9_$#-]/.test(character);
}

function isDigit(character: string | undefined): boolean {
	return character !== undefined && /[0-9]/.test(character);
}

function classifyWord(word: string): TokenKind {
	const normalized = word.toUpperCase();
	if (DATATYPE_SET.has(normalized)) {
		return TokenKind.Datatype;
	}
	if (KEYWORD_SET.has(normalized)) {
		return TokenKind.Keyword;
	}
	return TokenKind.Identifier;
}

/** Tokenize QuickScript source without file I/O or editor dependencies. */
export function tokenize(source: string): Token[] {
	const tokens: Token[] = [];
	let offset = 0;
	let line = 0;
	let character = 0;

	const currentPosition = (): Position => ({ line, character });

	const advanceTo = (end: number): void => {
		while (offset < end) {
			if (source[offset] === '\r' && source[offset + 1] === '\n' && offset + 1 < end) {
				offset += 2;
				line += 1;
				character = 0;
			} else if (source[offset] === '\r' || source[offset] === '\n') {
				offset += 1;
				line += 1;
				character = 0;
			} else {
				offset += 1;
				character += 1;
			}
		}
	};

	const emit = (kind: TokenKind, end: number): void => {
		const start = offset;
		const startPosition = currentPosition();
		advanceTo(end);
		tokens.push({
			kind,
			lexeme: source.slice(start, end),
			span: { start, end },
			range: { start: startPosition, end: currentPosition() },
		});
	};

	while (offset < source.length) {
		const current = source[offset];

		if (current === '\r' || current === '\n') {
			emit(TokenKind.Newline, current === '\r' && source[offset + 1] === '\n' ? offset + 2 : offset + 1);
			continue;
		}

		if (/[ \t\f\v]/.test(current)) {
			let end = offset + 1;
			while (end < source.length && /[ \t\f\v]/.test(source[end])) {
				end += 1;
			}
			emit(TokenKind.Whitespace, end);
			continue;
		}

		if (current === '"') {
			let end = offset + 1;
			while (end < source.length && source[end] !== '\r' && source[end] !== '\n') {
				if (source[end] === '\\' && end + 1 < source.length && source[end + 1] !== '\r' && source[end + 1] !== '\n') {
					end += 2;
				} else if (source[end] === '"') {
					end += 1;
					break;
				} else {
					end += 1;
				}
			}
			emit(TokenKind.String, end);
			continue;
		}

		if (current === '{') {
			const closingBrace = source.indexOf('}', offset + 1);
			emit(TokenKind.Comment, closingBrace === -1 ? source.length : closingBrace + 1);
			continue;
		}

		if (current === "'") {
			let end = offset + 1;
			while (end < source.length && source[end] !== '\r' && source[end] !== '\n') {
				end += 1;
			}
			emit(TokenKind.Comment, end);
			continue;
		}

		if (isDigit(current)) {
			let end = offset + 1;
			while (isDigit(source[end])) {
				end += 1;
			}
			if (source[end] === '.' && isDigit(source[end + 1])) {
				end += 1;
				while (isDigit(source[end])) {
					end += 1;
				}
			}
			emit(TokenKind.Number, end);
			continue;
		}

		if (isIdentifierStart(current)) {
			let end = offset + 1;
			while (isIdentifierPart(source[end])) {
				if (source[end] === '-' && source[end + 1] === '>') {
					break;
				}
				end += 1;
			}
			emit(classifyWord(source.slice(offset, end)), end);
			continue;
		}

		const operator = OPERATORS.find(candidate => source.startsWith(candidate, offset));
		if (operator !== undefined) {
			emit(TokenKind.Operator, offset + operator.length);
			continue;
		}

		if ((PUNCTUATION as readonly string[]).includes(current)) {
			emit(TokenKind.Punctuation, offset + 1);
			continue;
		}

		const codePoint = source.codePointAt(offset);
		emit(TokenKind.Unknown, offset + (codePoint !== undefined && codePoint > 0xffff ? 2 : 1));
	}

	const position = currentPosition();
	tokens.push({
		kind: TokenKind.EOF,
		lexeme: '',
		span: { start: offset, end: offset },
		range: { start: position, end: { ...position } },
	});
	return tokens;
}
