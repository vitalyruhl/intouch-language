/**
 * Lexical language data shared by the new core.
 *
 * Built-in and project-specific function names intentionally remain in the TextMate grammar
 * until that larger inventory can be migrated without creating a partial third source of truth.
 */
export const KEYWORDS = [
	'ABS',
	'AND',
	'AS',
	'ATN',
	'CALL',
	'COS',
	'DIM',
	'EACH',
	'ELSE',
	'ENDIF',
	'EOF',
	'EXIT',
	'EXP',
	'FALSE',
	'FOR',
	'FRAC',
	'IF',
	'IN',
	'INT',
	'IS',
	'LOG',
	'MOD',
	'NEXT',
	'NOT',
	'NULL',
	'OR',
	'RETURN',
	'RND',
	'ROUND',
	'SHL',
	'SHR',
	'SIN',
	'SQR',
	'SQRT',
	'STEP',
	'TAN',
	'THEN',
	'TO',
	'TRUE',
	'WHILE',
	'XOR',
] as const;

export const DATATYPES = ['DISCRETE', 'INTEGER', 'MESSAGE', 'REAL'] as const;

/** Operators are ordered longest-first for deterministic matching. */
export const OPERATORS = [
	'==',
	'<>',
	'<=',
	'>=',
	'->',
	'=',
	'+',
	'-',
	'<',
	'>',
	'*',
	'/',
	'%',
	'!',
	'~',
	'|',
] as const;

export const PUNCTUATION = ['(', ')', '[', ']', ';', ',', ':', '.'] as const;

export const KEYWORD_SET: ReadonlySet<string> = new Set(KEYWORDS);
export const DATATYPE_SET: ReadonlySet<string> = new Set(DATATYPES);
