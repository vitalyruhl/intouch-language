"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYWORDS = exports.TRENNER = exports.DOUBLE_OPERATORS = exports.SINGLE_OPERATORS = exports.FORMATS = exports.BACKSLASH = exports.SQUOTE = exports.DQUOTE = exports.CRLF = exports.LF = exports.CR = exports.TAB = void 0;
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
exports.DOUBLE_OPERATORS = ['==', '<>', '<=', '=>'];
exports.TRENNER = [';', ' '];
exports.KEYWORDS = ["NULL", "EOF", "AS", "IF", "ENDIF", "ELSE", "WHILE", "FOR", "next", "DIM", "THEN",
    "EXIT", "EACH", "STEP", "IN", "RETURN", "CALL", "MOD", "AND", "NOT", "IS",
    "OR", "XOR", "Abs", "TO", "SHL", "SHR", "discrete", "integer", "real", "message"];
//# sourceMappingURL=const.js.map