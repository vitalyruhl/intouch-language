"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forFormat = exports.formatNestings = void 0;
const const_1 = require("./const");
const const_2 = require("./const");
const functions_1 = require("./functions");
const nestingdef_1 = require("./nestingdef");
function formatNestings(text, config) {
    let a = nestingdef_1.NESTINGS;
    let buf = '';
    // todo: split in lines
    // todo: split lines in comment, string, code
    // todo: remove all whitespaces from code only
    // todo: format nestings
    // todo: combine all into new text and return it
    buf = text;
    (0, functions_1.log)("error", "format nestings is not implemented yet");
    return buf;
}
exports.formatNestings = formatNestings;
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
    for (i = 0; i <= txt.length - 1; i++) {
        //Columncount
        ColumnCount++;
        if (modified > 0) {
            modified--;
        }
        else {
            modified = 0;
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
            if (txt[i] === const_1.LF) { //txt[i] === CRLF || txt[i] === CR || txt[i] === LF
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
                if (!(modified > 0) && (!inComment || config.KeywordUppercaseAlsoInComment)) {
                    let j;
                    let wbf = ''; //word-bindery-test-char-before
                    let wba = ''; //word-bindery-test-char-after
                    //check for KEYWORDS
                    for (j in const_2.KEYWORDS) {
                        let k;
                        let tt = '';
                        wbf = text[i - 1];
                        for (k = 0; k <= const_2.KEYWORDS[j].length - 1; k++) {
                            tt += text[i + k];
                            wba = text[i + k + 1];
                        }
                        if (tt.toLowerCase() === const_2.KEYWORDS[j].toLowerCase()) {
                            if (CheckCRLForWhitespace(wbf) && CheckCRLForWhitespace(wba)) { //check Word-Binary
                                tt = const_2.KEYWORDS[j].toUpperCase() + wba;
                                buf += tt;
                                modified = tt.length - 1;
                            }
                        }
                    }
                    //check for Double
                    if (!(modified > 0)) {
                        for (j in const_2.DOUBLE_OPERATORS) { //check double operators first
                            let k;
                            let tt = '';
                            wbf = text[i - 1];
                            for (k = 0; k <= const_2.DOUBLE_OPERATORS[j].length - 1; k++) {
                                tt += text[i + k];
                                wba = text[i + k + 1];
                            }
                            if (tt === const_2.DOUBLE_OPERATORS[j]) {
                                if (text[i - 1] !== ' ') {
                                    buf += ' ';
                                }
                                buf += const_2.DOUBLE_OPERATORS[j];
                                if (text[i + 2] !== ' ') {
                                    buf += ' ';
                                }
                                modified = 1;
                                break;
                            }
                        }
                    }
                    //check for single operators
                    if (!(modified > 0)) {
                        for (j in const_2.SINGLE_OPERATORS) { //check double operators first
                            if (text[i] === const_2.SINGLE_OPERATORS[j]) {
                                if (text[i - 1] !== ' ') {
                                    buf += ' ';
                                }
                                buf += text[i];
                                if (text[i + 1] !== ' ') {
                                    buf += ' ';
                                }
                                modified = -1;
                                //console.log('Operator:[', text[i], ']modified:', modified);
                                break;
                            }
                        }
                    }
                }
            } //formatin session
            if (modified === 0) { //insert only when on this session not modified!
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
    checks = const_2.FORMATS.concat(const_2.SINGLE_OPERATORS);
    checks = checks.concat(const_2.DOUBLE_OPERATORS);
    checks = checks.concat(const_2.TRENNER);
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