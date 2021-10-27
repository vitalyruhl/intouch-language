// Character Constants
export const TAB = "\t";
export const CR = "\r";
export const LF = "\n";
export const CRLF = "\r\n";
export const DQUOTE = '\"';
export const SQUOTE = "\'";
export const BACKSLASH = "\\";


export const FORMATS: string[] = [TAB, CR, LF, CRLF, DQUOTE, SQUOTE, BACKSLASH];
export const SINGLE_OPERATORS: string[] = ['=', '+', '-', '<', '>', '*', '/', '%', '!', '~', '|'];
export const DOUBLE_OPERATORS: string[] = ['==', '<>', '<=', '=>'];
export const TRENNER: string[] = [';', ' '];


export const KEYWORDS: string[] = ["NULL", "EOF", "AS", "IF", "ENDIF", "ELSE", "WHILE", "FOR", "next" ,"DIM", "THEN",
    "EXIT", "EACH", "STEP", "IN", "RETURN", "CALL", "MOD", "AND", "NOT", "IS",
    "OR", "XOR", "Abs", "TO", "SHL", "SHR", "discrete", "integer", "real", "message"];


export const REGEX_gm_TAB_NOT_IN_COMMENT = new RegExp(/(?![^{]*})\t/, 'gm');
export const REGEX_gm_MOR_1_WSP = new RegExp(/\s{1,}/, 'gm');
export const REGEX_gm_MOR_2_WSP = new RegExp(/\s{2,}/, 'gm');
  
