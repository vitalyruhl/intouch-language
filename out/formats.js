"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forFormat = exports.formatNestings = void 0;
const const_1 = require("./const");
const const_2 = require("./const");
const functions_1 = require("./functions");
const nestingdef_1 = require("./nestingdef");
const const_3 = require("./const");
function formatNestings(text, config) {
    let buf = "";
    let codeFragments = [];
    let regex = "";
    let nestingCounter = 0;
    let nestingCounterPrevious = 0;
    let multilineComment = false;
    let thisLineBack = false;
    let LineCount = 1;
    let regexCB = `^${config.BlockCodeBegin}`;
    let regexCEx = `^${config.BlockCodeExclude}`;
    let regexCE = `^${config.BlockCodeEnd}`;
    let regexRegionCB = `^${config.RegionBlockCodeBegin}`;
    let regexRegionCEx = `^${config.RegionBlockCodeExclude}`;
    let regexRegionCE = `^${config.RegionBlockCodeEnd}`;
    try {
        codeFragments = text.split(const_1.CRLF); //split code by Line
        for (let i = 0; i < codeFragments.length - 1; i++) {
            LineCount = i + 1; //only for Log and Error
            if (codeFragments[i] === "") {
                //not in empty lines goes faster...
                continue;
            }
            //check for multiline comment
            //REGEX_gm_GET_NESTING
            if (codeFragments[i].search(const_3.REGEX.g_CHECK_OPEN_COMMENT) !== -1) {
                multilineComment = true;
            }
            if (codeFragments[i].search(const_3.REGEX.g_CHECK_CLOSE_COMMENT) !== -1) {
                multilineComment = false;
            }
            let str = codeFragments[i].match(const_3.REGEX.gm_GET_STRING); //get all Strings in the Line
            if (str) {
                let str2 = str.map((item) => {
                    let strw = item.replace(/\s(?<!\t)/gim, "\0"); //replace whitespace in each String on ~
                    strw = strw.replace(/\t/gim, "u0001"); //replace TAB in each String on ~~~~
                    return codeFragments[i].replace(item, strw); //each String in Line
                });
                // remove continues whitespace (Item 0 contains all Text???!!!)
                codeFragments[i] = str2[0].replace(const_3.REGEX.gm_MOR_2_WSP, " ");
                //!-----------------------------------------------------------------------------------
                //! NEW formatting's
                if (!multilineComment) {
                    //check for NO_SPACE_ITEMS
                    for (let item in const_2.NO_SPACE_ITEMS) {
                        //find space before
                        if (config.FormatAlsoInComment) {
                            regex = `(\\s\\${const_2.NO_SPACE_ITEMS[item]})`;
                        }
                        else {
                            regex = `((?![^{]*})\\s\\${const_2.NO_SPACE_ITEMS[item]})`;
                        }
                        codeFragments[i] = codeFragments[i].replace(new RegExp(regex, "g"), `${const_2.NO_SPACE_ITEMS[item]}`);
                        //find space after
                        if (config.FormatAlsoInComment) {
                            regex = `(\\${const_2.NO_SPACE_ITEMS[item]}\\s)`;
                        }
                        else {
                            regex = `((?![^{]*})(\\${const_2.NO_SPACE_ITEMS[item]}\\s))`;
                        }
                        codeFragments[i] = codeFragments[i].replace(new RegExp(regex, "g"), `${const_2.NO_SPACE_ITEMS[item]}`);
                    }
                    //* check for Space or crlf after ';'
                    //! it might be replaced in strings to?! -> its a Problem? -> fix them so far as possible
                    if (config.FormatAlsoInComment) {
                        codeFragments[i] = codeFragments[i].replace(/;(?!\s)/g, `; `);
                    }
                    else {
                        codeFragments[i] = codeFragments[i].replace(/(?![^{]*});(?!\s)/g, `; `);
                    }
                }
                //! END New formatting's
                //!-----------------------------------------------------------------------------------
                // and Then ~ back in whitespace
                codeFragments[i] = codeFragments[i]
                    .replace(/\0/gim, " ")
                    .replace(/u0001/gim, "\t"); //replace ~ back in whitespaces
            }
            if (!multilineComment) {
                let exclude = false;
                codeFragments[i] = codeFragments[i].replace(const_3.REGEX.gm_GET_NESTING, ""); //remove all Nestings
                // if (i == 45) {
                //     let debug = true;
                // }
                //* check for Codeblock
                // bugfix: 02.11.2021 viru -> turn this code after remove all Nestings for correct Nesting-Format
                if (codeFragments[i].search(new RegExp(regexCB, "gi")) !== -1) {
                    nestingCounter++;
                    thisLineBack = true;
                }
                else if (codeFragments[i].search(new RegExp(regexCEx, "gi")) !== -1) {
                    thisLineBack = true;
                }
                else if (codeFragments[i].search(new RegExp(regexCE, "gi")) !== -1) {
                    nestingCounter--;
                    thisLineBack = true;
                    if (nestingCounter < 0) {
                        //just in case
                        nestingCounter = 0;
                        thisLineBack = false;
                    }
                    //check for region Nesting
                }
                else if (codeFragments[i].search(new RegExp(regexRegionCB, "gi")) !== -1) {
                    nestingCounter++;
                    thisLineBack = true;
                }
                else if (codeFragments[i].search(new RegExp(regexRegionCEx, "gi")) !== -1) {
                    thisLineBack = true;
                }
                else if (codeFragments[i].search(new RegExp(regexRegionCE, "gi")) !== -1) {
                    nestingCounter--;
                    thisLineBack = true;
                    if (nestingCounter < 0) {
                        //just in case
                        nestingCounter = 0;
                        thisLineBack = false;
                    }
                }
                else {
                    nestingdef_1.EXCLUDE_KEYWORDS.some((item) => {
                        //show for Excludes from Nesting
                        regex = `((?![^{]*})(${item}))`;
                        if (codeFragments[i].search(new RegExp(regex, "i")) !== -1) {
                            exclude = true;
                        }
                    });
                    //loop in all Nesting Keyword configurations
                    let keyFound = false;
                    for (var ii = 0; ii < nestingdef_1.NESTINGS.length; ii++) {
                        if (!exclude) {
                            //(!exclude) ==> bugfix on "exit for;"
                            //first like if
                            regex = `((?![^{]*})(\\b${nestingdef_1.NESTINGS[ii].keyword})\\b)`;
                            if (codeFragments[i].search(new RegExp(regex, "i")) !== -1) {
                                nestingCounter++;
                                keyFound = true;
                            }
                        }
                        //bugfix on "then in a new line"
                        if (nestingdef_1.NESTINGS[ii].multiline !== "") {
                            regex = `((?![^{]*})(\\b${nestingdef_1.NESTINGS[ii].multiline})\\b)`;
                            if (codeFragments[i].search(new RegExp(regex, "i")) !== -1) {
                                if (!keyFound) {
                                    thisLineBack = true;
                                }
                            }
                        }
                        //middle like ELSE
                        if (nestingdef_1.NESTINGS[ii].middle !== "") {
                            regex = `((?![^{]*})(\\b${nestingdef_1.NESTINGS[ii].middle})\\b)`;
                            if (codeFragments[i].search(new RegExp(regex, "i")) !== -1) {
                                thisLineBack = true;
                                break;
                            }
                        }
                        //end like ENDIF
                        regex = `((?![^{]*})(\\b${nestingdef_1.NESTINGS[ii].end})\\b)`;
                        if (codeFragments[i].search(new RegExp(regex, "i")) !== -1) {
                            nestingCounter--;
                            if (nestingCounterPrevious !== nestingCounter) {
                                thisLineBack = true;
                                break;
                            }
                            if (nestingCounter < 0) {
                                //just in case
                                nestingCounter = 0;
                                thisLineBack = false;
                            }
                        }
                        keyFound = false;
                    }
                }
            }
            if (nestingCounterPrevious !== nestingCounter) {
                codeFragments[i] =
                    getNesting(nestingCounterPrevious, thisLineBack) + codeFragments[i];
                nestingCounterPrevious = nestingCounter;
                thisLineBack = false; //reset this Flag
            }
            else {
                codeFragments[i] =
                    getNesting(nestingCounterPrevious, thisLineBack) + codeFragments[i];
                thisLineBack = false; //reset this Flag
            }
        }
        // combine all into new text and return it
        for (let i = 0; i < codeFragments.length - 1; i++) {
            buf += codeFragments[i] + const_1.CRLF;
        }
    }
    catch (error) {
        (0, functions_1.log)("Error", `Unhandled Error @ Line ${LineCount}!`);
        return text; //on error return unformatted code
    }
    return buf;
}
exports.formatNestings = formatNestings;
//edit.delete(line.rangeIncludingLineBreak);
function getNesting(n, thisLineBack) {
    let temp = "";
    if (n !== 0) {
        for (let i = 0; i < n; i++) {
            if (thisLineBack) {
                thisLineBack = false; //reset this Flag
            }
            else {
                temp += const_1.TAB;
            }
        }
    }
    return temp;
}
function forFormat(text, config) {
    // todo: 2021.10.28 viru -> this is to complicated! -> refactor it like Nesting!
    let txt = text.split("");
    let buf = "";
    let i = 0;
    let modified = 0;
    let inComment = false;
    let inString = false;
    let LineCount = 1;
    let ColumnCount = 0;
    for (i = 0; i <= txt.length - 1; i++) {
        //Column count
        ColumnCount++;
        if (modified > 0) {
            modified--;
        }
        else {
            modified = 0;
            //check for String-End (check before begin!)
            if (inString && txt[i] === '"') {
                // if (!(txt[i - 1] === '\\')) {  //check for escaped quot
                inString = false;
                // }
            }
            else if (!inComment) {
                //check for String-Begin, but not the same char as close!
                if (txt[i] === '"') {
                    inString = true;
                    //log("info", `Info @ Line ${LineCount} at Column ${ColumnCount} -> Open string detected!`);
                }
            }
            //Line count
            if (txt[i] === const_1.LF) {
                if (inString) {
                    //check for String error, because there is no way to declare string over multiple Line!
                    (0, functions_1.log)("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> no closed string detected!`);
                    (0, functions_1.log)("info", buf);
                    return text; //return unformatet text
                }
                LineCount++;
                ColumnCount = 0;
            }
            //check for comment-error
            if (!inComment && txt[i] === "}") {
                (0, functions_1.log)("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> closed comment bracket witout Open comment bracket!`);
                (0, functions_1.log)("Error", buf);
                return text; //return unformatted text
            }
            else if (txt[i] === "{") {
                //check for Comment-Begin
                inComment = true;
            }
            else if (inComment && txt[i] === "}") {
                //check for Comment-End
                inComment = false;
            }
            //formatting session
            if (!inString) {
                if (!(modified > 0) &&
                    (!inComment || config.KeywordUppercaseAlsoInComment)) {
                    let j;
                    let wbf = ""; //word-bindery-test-char-before
                    let wba = ""; //word-bindery-test-char-after
                    //check for KEYWORDS
                    for (j in const_2.KEYWORDS) {
                        let k;
                        let tt = "";
                        wbf = text[i - 1];
                        for (k = 0; k <= const_2.KEYWORDS[j].length - 1; k++) {
                            tt += text[i + k];
                            wba = text[i + k + 1];
                        }
                        if (tt.toLowerCase() === const_2.KEYWORDS[j].toLowerCase()) {
                            if (CheckCRLForWhitespace(wbf) && CheckCRLForWhitespace(wba)) {
                                //check Word-Binary
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
                            let tt = "";
                            wbf = text[i - 1];
                            for (k = 0; k <= const_2.DOUBLE_OPERATORS[j].length - 1; k++) {
                                tt += text[i + k];
                                wba = text[i + k + 1];
                            }
                            if (tt === const_2.DOUBLE_OPERATORS[j]) {
                                if (text[i - 1] !== " ") {
                                    buf += " ";
                                }
                                buf += const_2.DOUBLE_OPERATORS[j];
                                if (text[i + 2] !== " ") {
                                    buf += " ";
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
                                if (const_2.SINGLE_OPERATORS[j] === "-") {
                                    //23.01.2022 check '-' as single Operator, because it can be used in variables
                                    let tstSwp = text[i + 1] == " " && text[i - 1] != " "; // 2022.01.25 Bugfix
                                    let tstNmb = text[i + 1] == " " && text[i - 1] != " " && isNaN(+text[i + 1]); // 2022.01.25 Bugfix
                                    if (tstSwp) {
                                        buf += " ";
                                    }
                                }
                                else if (text[i - 1] != " ") {
                                    //check for space before operator
                                    buf += " ";
                                }
                                buf += text[i];
                                if (text[i + 1] != " ") {
                                    //check for space after operator
                                    // let debug1 = SINGLE_OPERATORS[j];
                                    // if (SINGLE_OPERATORS[j] === '+' || SINGLE_OPERATORS[j] === '-') {
                                    if (const_2.SINGLE_OPERATORS[j] === "-") {
                                        // do nothing!
                                    }
                                    else if (const_2.SINGLE_OPERATORS[j] === "+") {
                                        //23.01.2022 remove '-' as single Operator, because it can be used in variables
                                        if (isNaN(+text[i + 1])) {
                                            buf += " ";
                                        }
                                    }
                                    else {
                                        buf += " ";
                                    }
                                }
                                modified = -1;
                                //console.log('Operator:[', text[i], ']modified:', modified);
                                break;
                            }
                        }
                    }
                }
            } //formatting session
            if (modified === 0) {
                //insert only when on this session not modified!
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
    return const_2.FORMATS.concat(const_2.SINGLE_OPERATORS, const_2.DOUBLE_OPERATORS, const_2.TRENNER).some((item) => s === item);
}
//# sourceMappingURL=formats.js.map