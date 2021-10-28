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


const gm_TAB_NOT_IN_COMMENT = new RegExp(/(?![^{]*})\t/, 'gm');
const gm_MOR_1_WSP = new RegExp(/\s{1,}/, 'gm');
const gm_MOR_2_WSP = new RegExp(/\s{2,}/, 'gm');
const gm_MOR_2_WSP_NO_TAB = new RegExp(/\s{2,}(?<!\t)/, 'gm');
const g_CHECK_OPEN_COMMENT = new RegExp(/(}*{)/, 'g');
const g_CHECK_CLOSE_COMMENT = new RegExp(/(})/, 'g');
const gm_GET_NESTING = new RegExp(/^\s*/, 'g');
const gm_GET_STRING = new RegExp(/(["'])(?:(?=(\\?))\2.)*?\1/, 'gm');
const gm_GET_WSP_IN_STRING = new RegExp(/\s+(?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/, 'gm');//https://stackoverflow.com/questions/36705436/regular-expression-to-select-all-whitespace-that-is-in-quotes
  
export const REGEX ={
    gm_TAB_NOT_IN_COMMENT,
    gm_MOR_1_WSP,
    gm_MOR_2_WSP,
    g_CHECK_OPEN_COMMENT,
    g_CHECK_CLOSE_COMMENT,
    gm_GET_NESTING,
    gm_GET_STRING,
    gm_GET_WSP_IN_STRING,
    gm_MOR_2_WSP_NO_TAB

};