"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGEX = exports.KEYWORDS = exports.TRENNER = exports.NO_SPACE_ITEMS = exports.DOUBLE_OPERATORS = exports.SINGLE_OPERATORS = exports.FORMATS = exports.BACKSLASH = exports.SQUOTE = exports.DQUOTE = exports.CRLF = exports.LF = exports.CR = exports.TAB = void 0;
// Character Constants
exports.TAB = "\t";
exports.CR = "\r";
exports.LF = "\n";
exports.CRLF = "\r\n";
exports.DQUOTE = '\"';
exports.SQUOTE = "\'";
exports.BACKSLASH = "\\";
exports.FORMATS = [exports.TAB, exports.CR, exports.LF, exports.CRLF, exports.DQUOTE, exports.SQUOTE, exports.BACKSLASH];
exports.SINGLE_OPERATORS = ['=', '+', '-', '<', '>', '*', '/', '%', '!', '~', '|'];
// export const SINGLE_OPERATORS: string[] = ['=', '+', '<', '>', '*', '/', '%', '!', '~', '|'];//23.01.2022 remove - as single Operator, because it can be used in variables
// BUGFIX 2025-09-25: '=>" war fälschlich statt '>=' definiert und führte dazu,
// dass das Formatieren '>  =' erzeugte (Trennung von '>' und '='). Korrigiert zu '>='.
exports.DOUBLE_OPERATORS = ['==', '<>', '<=', '>='];
exports.NO_SPACE_ITEMS = ['(', ')', '[', ']', ';'];
exports.TRENNER = [';', ' '];
exports.KEYWORDS = [
    "NULL", "EOF", "AS", "IF", "ENDIF", "ELSE", "WHILE", "FOR", "next", "DIM", "THEN",
    "EXIT", "EACH", "STEP", "IN", "RETURN", "CALL", "MOD", "AND", "NOT", "IS",
    "OR", "XOR", "Abs", "TO", "SHL", "SHR", "discrete", "integer", "real", "message",
    // Added math / intrinsic style functions for uppercasing in formatter 2025-09-25
    "sqr", "sin", "cos", "tan", "atn", "exp", "log", "int", "frac", "round", "rnd", "sqrt"
];
/* Misk keywords from .json
  MOD|AND|NOT|IS|OR|XOR|Abs|TO|SHL|SHR
  IF|ENDIF|ELSE|WHILE|FOR|NEXT|DIM|THEN|EXIT|EACH|STEP|IN|RETURN|CALL
  NULL|EOF|AS|True|False
  discrete|integer|real|message
*/
const gm_TAB_NOT_IN_COMMENT = new RegExp(/(?![^{]*})\t/, 'gm');
const gm_MOR_1_WSP = new RegExp(/\s{1,}/, 'gm'); //more then one whitespace
const gm_MOR_2_WSP = new RegExp(/\s{2,}/, 'gm'); //more then two whitespace
const gm_MOR_2_WSP_NO_TAB = new RegExp(/\s{2,}(?<!\t)/, 'gm'); //more then one whitespace, but is not a tabulator
const g_CHECK_OPEN_COMMENT = new RegExp(/(}*{)/, 'g');
const g_CHECK_CLOSE_COMMENT = new RegExp(/(})/, 'g');
const gm_GET_NESTING = new RegExp(/^\s*/, 'g');
const gm_GET_STRING = new RegExp(/(["'])(?:(?=(\\?))\2.)*?\1/, 'gm');
const gm_GET_WSP_IN_STRING = new RegExp(/\s+(?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/, 'gm'); //https://stackoverflow.com/questions/36705436/regular-expression-to-select-all-whitespace-that-is-in-quotes
const gm_GET_ALL_WORDS = new RegExp(/(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\\"\,\.\<\>\/\?\s]+)/, 'gm');
const gm_GET_ALL_Numbers = new RegExp(/-?\d*\d/, 'gm');
exports.REGEX = {
    gm_TAB_NOT_IN_COMMENT,
    gm_MOR_1_WSP,
    gm_MOR_2_WSP,
    g_CHECK_OPEN_COMMENT,
    g_CHECK_CLOSE_COMMENT,
    gm_GET_NESTING,
    gm_GET_STRING,
    gm_GET_WSP_IN_STRING,
    gm_MOR_2_WSP_NO_TAB,
    gm_GET_ALL_WORDS,
    gm_GET_ALL_Numbers
};
//# sourceMappingURL=const.js.map