import { Range, SourceSpan } from './source';

export enum TokenKind {
	Identifier = 'Identifier',
	Keyword = 'Keyword',
	Datatype = 'Datatype',
	Number = 'Number',
	String = 'String',
	Operator = 'Operator',
	Punctuation = 'Punctuation',
	Comment = 'Comment',
	Whitespace = 'Whitespace',
	Newline = 'Newline',
	Unknown = 'Unknown',
	EOF = 'EOF',
}

/** A token whose lexeme and half-open locations refer to the original source. */
export interface Token {
	kind: TokenKind;
	lexeme: string;
	span: SourceSpan;
	range: Range;
}
