"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forFormat = exports.formatNestings = void 0;
const const_1 = require("./const");
const const_2 = require("./const");
const functions_1 = require("./functions");
const nestingdef_1 = require("./nestingdef");
const const_3 = require("./const");
function formatNestings(text, config) {
    let buf = '';
    let isError = false;
    let codeFragments = [];
    let regex = '';
    let nestingCounter = 0;
    codeFragments = text.split(const_1.CRLF); //split code by Line
    for (let i = 0; i < codeFragments.length - 1; i++) {
        codeFragments[i] = codeFragments[i].replace(const_3.REGEX_gm_TAB_NOT_IN_COMMENT, ''); //remove all Nestings
        codeFragments[i] = codeFragments[i].replace(const_3.REGEX_gm_MOR_2_WSP, ' '); // remoove continuus whitespaces
        let Obj = nestingdef_1.NESTINGS; // todo: format nestings
        Obj.forEach(item => {
            regex = `((?![^{]*})(\\b${item.keyword})\\b)`;
            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                nestingCounter++;
            }
            regex = `((?![^{]*})(\\b${item.end})\\b)`;
            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                nestingCounter--;
            }
            if (nestingCounter < 0) { //just in case
                nestingCounter = 0;
            }
        });
        // interface NestingInterface {
        //     keyword: string; //begin of the Nesting
        //     lineEnd: string; //end of the Line in Keyword - can be the same
        //     midle: string; //eg else in if-then-else-endit
        //     end: string; //end of this Nestin
        //     cbInline: boolean; //can be Inline
        // }
        codeFragments[i] = getNesting(nestingCounter) + codeFragments[i];
    }
    // combine all into new text and return it
    for (let i = 0; i < codeFragments.length - 1; i++) {
        buf += codeFragments[i] + const_1.CRLF;
    }
    if (!isError) {
        return buf;
    }
}
exports.formatNestings = formatNestings;
//edit.delete(line.rangeIncludingLineBreak);
function getNesting(n) {
    let temp = '';
    if (n === 0) {
        return '';
    }
    for (let i = 0; i <= n; i++) {
        temp += const_1.TAB;
    }
    return temp;
}
function forFormat(text, config) {
    let txt = text.split('');
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
                    //check double operators first
                    if (!(modified > 0)) {
                        for (j in const_2.DOUBLE_OPERATORS) {
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
                        for (j in const_2.SINGLE_OPERATORS) {
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
            } //formating session
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
    //https://stackoverflow.com/questions/69709447/problem-to-create-a-regex-expression-in-js-to-select-keywords-in-text-but-excl/69734464?noredirect=1#comment123265818_69734464
    return const_2.FORMATS.concat(const_2.SINGLE_OPERATORS, const_2.DOUBLE_OPERATORS, const_2.TRENNER).some(item => s === item);
}
//# sourceMappingURL=formats.js.map