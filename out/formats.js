"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forFormat = exports.TRENNER = exports.DOUBLE_OPERATORS = exports.SINGLE_OPERATORS = exports.FORMATS = exports.BACKSLASH = exports.SQUOTE = exports.DQUOTE = exports.CRLF = exports.LF = exports.CR = exports.TAB = void 0;
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
const functions_1 = require("./functions");
const KEYWORDS = ["NULL", "EOF", "AS", "IF", "ENDIF", "ELSE", "WHILE", "FOR", "DIM", "THEN",
    "EXIT", "EACH", "STEP", "IN", "RETURN", "CALL", "MOD", "AND", "NOT", "IS",
    "OR", "XOR", "Abs", "TO", "SHL", "SHR", "discrete", "integer", "real", "message"];
function forFormat(text, config) {
    //let txt = runes(text);//Splitt text into single character
    let txt = text.split(''); //Splitt text into single character
    let buf = '';
    let i = 0;
    let modified = 0;
    let inComment = false;
    let inString = false;
    let LineCount = 1;
    let ColumnCount = 0;
    let NestingCount = 0;
    for (i = 0; i <= txt.length - 1; i++) {
        //Columncount
        ColumnCount++;
        if (modified > 0) {
            modified--;
        }
        else {
            //check for String-End (check before begin!)
            if (inString && (txt[i] === '"')) {
                if (!(txt[i - 1] === '\\')) { //check for escaped quot
                    inString = false;
                    //log("info", `Info @ Line ${LineCount} at Column ${ColumnCount} -> closed string detected!`);
                }
            }
            else if (!inComment) { //check for String-Begin, but not the same char as close!
                if (txt[i] === '"') {
                    inString = true;
                    //log("info", `Info @ Line ${LineCount} at Column ${ColumnCount} -> Open string detected!`);
                }
            }
            //Linecount 
            if (txt[i] === exports.LF) { //txt[i] === CRLF || txt[i] === CR || txt[i] === LF
                if (inString) { //check for String error, because there is no way to declara string over multiple Line!
                    (0, functions_1.log)("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> no closed string detected!`);
                    (0, functions_1.log)("Error", buf);
                    return text; //return unformatet text
                }
                LineCount++;
                ColumnCount = 0;
            }
            //check for comment-error
            if (!inComment && (txt[i] === '}')) {
                (0, functions_1.log)("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> closed comment bracket witout Open comment bracket!`);
                (0, functions_1.log)("Error", buf);
                return text; //return unformatet text
            }
            else if (txt[i] === '{') { //check for Comment-Begin
                inComment = true;
            }
            else if (inComment && (txt[i] === '}')) { //check for Comment-End
                inComment = false;
            }
            //formatting session
            if (!inString) {
                //check for consistense whitespace and remove them
                if (!(modified > 0) && !inComment) {
                    if (text[i] === ' ' && text[i + 1] === ' ') {
                        modified++;
                    }
                }
                if (!(modified > 0) && (!inComment || config.KeywordUppercaseAlsoInComment)) {
                    let j;
                    let wbf = ''; //word-bindery-test-char-before
                    let wba = ''; //word-bindery-test-char-after
                    //check for KEYWORDS
                    for (j in KEYWORDS) {
                        let k;
                        let tt = '';
                        wbf = text[i - 1];
                        for (k = 0; k <= KEYWORDS[j].length - 1; k++) {
                            tt += text[i + k];
                            wba = text[i + k + 1];
                        }
                        if (tt.toLowerCase() === KEYWORDS[j].toLowerCase()) {
                            if (CheckCRLForWhitespace(wbf) && CheckCRLForWhitespace(wba)) { //check Word-Binary
                                tt = KEYWORDS[j].toUpperCase() + wba;
                                buf += tt;
                                modified = tt.length - 1;
                            }
                        }
                    }
                    //check for Double
                    if (!(modified > 0)) {
                        for (j in exports.DOUBLE_OPERATORS) { //check double operators first
                            let k;
                            let tt = '';
                            wbf = text[i - 1];
                            for (k = 0; k <= exports.DOUBLE_OPERATORS[j].length - 1; k++) {
                                tt += text[i + k];
                                wba = text[i + k + 1];
                            }
                            if (tt === exports.DOUBLE_OPERATORS[j]) {
                                if (text[i - 1] !== ' ') {
                                    buf += ' ';
                                }
                                buf += exports.DOUBLE_OPERATORS[j];
                                if (text[i + 2] !== ' ') {
                                    buf += ' ';
                                }
                                modified = 1;
                                break;
                            }
                        }
                    }
                    //check for single operators
                    if (!(modified > 0) && false) {
                        for (j in exports.SINGLE_OPERATORS) { //check double operators first
                            if (text[i] === exports.SINGLE_OPERATORS[j]) {
                                if (text[i - 1] !== ' ') {
                                    buf += ' ';
                                }
                                buf += text[i];
                                if (text[i + 1] !== ' ') {
                                    buf += ' ';
                                }
                                modified = 1;
                                //console.log('Operator:[', text[i], ']modified:', modified);
                                break;
                            }
                        }
                    }
                }
            } //formatin session
            if (!(modified > 0)) { //insert only when on this session not modified!
                buf += txt[i];
            }
        } //not modified
    } //for
    //console.log(buf);
    return buf;
} //function
exports.forFormat = forFormat;
function CheckCRLForWhitespace(s) {
    let checks = [];
    let check = [];
    let test = false;
    checks = exports.FORMATS.concat(exports.SINGLE_OPERATORS);
    checks = checks.concat(exports.DOUBLE_OPERATORS);
    checks = checks.concat(exports.TRENNER);
    check = checks.map(item => {
        if (s === item) {
            return true;
        }
        return false;
    });
    test = test || check.some(it => it === true);
    //console.log('check', s, test);
    return test;
}
//# sourceMappingURL=formats.js.map