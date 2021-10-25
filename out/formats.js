"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forFormat = exports.BACKSLASH = exports.SQUOTE = exports.DQUOTE = exports.CRLF = exports.TAB = void 0;
// Character Constants
exports.TAB = "\t";
exports.CRLF = "\r\n";
exports.DQUOTE = '\"';
exports.SQUOTE = "\'";
exports.BACKSLASH = "\\";
const keywords = ["NULL", "EOF", "AS", "IF", "ENDIF", "ELSE", "WHILE", "FOR", "DIM", "THEN",
    "EXIT", "EACH", "STEP", "IN", "RETURN", "CALL", "MOD", "AND", "NOT", "IS",
    "OR", "XOR", "Abs", "TO", "SHL", "SHR", "discrete", "integer", "real", "message"];
function forFormat(text) {
    //let txt = runes(text);//Splitt text into single character
    let txt = text.split(''); //Splitt text into single character
    let buf = '';
    let i = 0;
    for (i = 0; i <= txt.length - 1; i++) {
        //check for keywords
        let j;
        let tt = '';
        for (j in keywords) {
            let k;
            for (k = 0; k <= keywords[j].length - 1; k++) {
                tt += text[i + k];
            }
            if (tt.toLowerCase() == keywords[j].toLowerCase() && k == keywords[j].length - 1) {
                tt = tt.toUpperCase();
                i += keywords[j].length;
                buf += tt;
            }
        }
        buf += txt[i];
    }
    console.log(buf);
    return text;
}
exports.forFormat = forFormat;
//# sourceMappingURL=formats.js.map