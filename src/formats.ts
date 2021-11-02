
import { TAB, LF, CRLF } from "./const";
import { FORMATS, SINGLE_OPERATORS, DOUBLE_OPERATORS, TRENNER, KEYWORDS, NO_SPACE_ITEMS } from './const';
import { log } from './functions';
import { NESTINGS, EXCLUDE_KEYWORDS } from "./nestingdef";

import { REGEX } from './const';

export function formatNestings(text: string, config: any): string {

    let buf: string = '';
    let codeFragments: string[] = [];
    let regex: string = '';
    let nestingCounter: number = 0;
    let nestingCounterPrevious: number = 0;
    let multilineComment: boolean = false;
    let thisLineBack: boolean = false;
    let LineCount: number = 1;
   
    let FindCodeBlock: boolean = false;
    let FindEndCodeBlock: boolean = false;
    let FindCodeBlockBack: boolean = false;

    try {
        codeFragments = text.split(CRLF);//split code by Line

        for (let i = 0; i < codeFragments.length - 1; i++) {

            LineCount = i + 1;//only for Log and Error


            if (codeFragments[i] === '') {//not in empty lines goes faster...
                continue;
            }

            //check for multiline comment
            //REGEX_gm_GET_NESTING
            if (codeFragments[i].search(REGEX.g_CHECK_OPEN_COMMENT) !== -1) {
                multilineComment = true;
            }

            if (codeFragments[i].search(REGEX.g_CHECK_CLOSE_COMMENT) !== -1) {
                multilineComment = false;
            }

            // check for Codeblock
            // config.BlockCodeExclude
            let regexCB = `^${config.BlockCodeBegin}`;
            let regexCEx = `^${config.BlockCodeExclude}`;
            let regexCE = `^${config.BlockCodeEnd}`;

            if (codeFragments[i].search(new RegExp(regexCB, 'gi')) !== -1) {
                FindCodeBlock = true;
            } else  if (codeFragments[i].search(new RegExp(regexCE, 'gi')) !== -1) {
                FindEndCodeBlock = true;
            }else  if (codeFragments[i].search(new RegExp(regexCEx, 'gi')) !== -1) {
                FindCodeBlockBack = true;
            }

            let str = codeFragments[i].match(REGEX.gm_GET_STRING); //get all Strings in the Line
            if (str) {
                let str2 = str.map(item => {
                    let strw = item.replace(/\s(?<!\t)/gmi, '\0'); //replace whitespace in each String on ~
                    strw = strw.replace(/\t/gmi, 'u0001'); //replace TAB in each String on ~~~~
                    return codeFragments[i].replace(item, strw);//each String in Line
                });

                // remove continues whitespace (Item 0 contains all Text???!!!)

                codeFragments[i] = str2[0].replace(REGEX.gm_MOR_2_WSP, ' ');

                //!-----------------------------------------------------------------------------------
                //! NEW formatting's

                if (!multilineComment) {
                    //check for NO_SPACE_ITEMS
                    for (let item in NO_SPACE_ITEMS) {

                        //find space before
                        if (config.FormatAlsoInComment) {
                            regex = `(\\s\\${NO_SPACE_ITEMS[item]})`;
                        }
                        else {
                            regex = `((?![^{]*})\\s\\${NO_SPACE_ITEMS[item]})`;
                        }
                        codeFragments[i] = codeFragments[i].replace(new RegExp(regex, 'g'), `${NO_SPACE_ITEMS[item]}`);

                        //find space after
                        if (config.FormatAlsoInComment) {
                            regex = `(\\${NO_SPACE_ITEMS[item]}\\s)`;
                        }
                        else {
                            regex = `((?![^{]*})(\\${NO_SPACE_ITEMS[item]}\\s))`;
                        }
                        codeFragments[i] = codeFragments[i].replace(new RegExp(regex, 'g'), `${NO_SPACE_ITEMS[item]}`);
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
                codeFragments[i] = codeFragments[i].replace(/\0/gmi, ' ').replace(/u0001/gmi, '\t');//replace ~ back in whitespaces

            }

            if (!multilineComment) {

                let exclude: boolean = false;
                codeFragments[i] = codeFragments[i].replace(REGEX.gm_GET_NESTING, ''); //remove all Nestings



                
                if (FindCodeBlock) {//check for Codeblock
                    nestingCounter++;
                    FindCodeBlock = false;
                }
                else if (FindEndCodeBlock) {//check for end Codeblock
                    nestingCounter--;
                    thisLineBack = true;
                    FindEndCodeBlock = false;
                    if (nestingCounter < 0) {//just in case
                        nestingCounter = 0;
                        thisLineBack = false;
                    }
                }
                else if (FindCodeBlockBack) {//This comment line turn back for structures
                    thisLineBack = true;
                    FindCodeBlockBack = false;
                }

                else {

                    EXCLUDE_KEYWORDS.some(item => {
                        //show for Excludes from Nesting
                        regex = `((?![^{]*})(${item}))`;
                        if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                            exclude = true;
                        }
                    });

                    //loop in all Nesting Keyword configurations 
                    let keyFound: boolean = false;
                    for (var ii = 0; ii < NESTINGS.length; ii++) {
                        //NESTINGS.some(item => {//format nestings

                        if (!exclude) { //(!exclude) ==> bugfix on "exit for;"
                            //first like if
                            regex = `((?![^{]*})(\\b${NESTINGS[ii].keyword})\\b)`;
                            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                                nestingCounter++;
                                keyFound = true;
                            }
                        }


                        //bugfix on "then in a new line"
                        if (NESTINGS[ii].multiline !== '') {
                            regex = `((?![^{]*})(\\b${NESTINGS[ii].multiline})\\b)`;
                            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                                if (!keyFound) {
                                    thisLineBack = true;
                                }
                            }
                        }

                        //middle like ELSE
                        if (NESTINGS[ii].middle !== '') {
                            regex = `((?![^{]*})(\\b${NESTINGS[ii].middle})\\b)`;
                            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                                thisLineBack = true;
                                break;
                            }
                        }


                        //end like ENDIF
                        regex = `((?![^{]*})(\\b${NESTINGS[ii].end})\\b)`;
                        if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                            nestingCounter--;
                            if (nestingCounterPrevious !== nestingCounter) {
                                thisLineBack = true;
                                break;
                            }
                            if (nestingCounter < 0) {//just in case
                                nestingCounter = 0;
                                thisLineBack = false;
                            }
                        }

                        keyFound = false;
                    }
                }
            }

            if (nestingCounterPrevious !== nestingCounter) {
                codeFragments[i] = getNesting(nestingCounterPrevious, thisLineBack) + codeFragments[i];
                nestingCounterPrevious = nestingCounter;
                thisLineBack = false;//reset this Flag
            }
            else {
                codeFragments[i] = getNesting(nestingCounterPrevious, thisLineBack) + codeFragments[i];
                thisLineBack = false;//reset this Flag
            }

        }

        // combine all into new text and return it
        for (let i = 0; i < codeFragments.length - 1; i++) {
            buf += codeFragments[i] + CRLF;
        }

    } catch (error) {
        log("Error", `Unhandled Error @ Line ${LineCount}!`);
        return text; //on error return unformatted code
    }

    return buf;
}

//edit.delete(line.rangeIncludingLineBreak);

function getNesting(n: number, thisLineBack: boolean): string {
    let temp: string = '';
    if (n !== 0) {
        for (let i = 0; i < n; i++) {
            if (thisLineBack) {
                thisLineBack = false;//reset this Flag
            }
            else {
                temp += TAB;
            }
        }
    }

    return temp;
}

export function forFormat(text: string, config: any): string {

    // todo: 2021.10.28 viru -> this is to complicated! -> refactor it like Nesting!

    let txt = text.split('');
    let buf: string = '';
    let i: any = 0;
    let modified: number = 0;

    let inComment: boolean = false;
    let inString: boolean = false;

    let LineCount: number = 1;
    let ColumnCount: number = 0;

    for (i = 0; i <= txt.length - 1; i++) {

        //Column count
        ColumnCount++;

        if (modified > 0) {
            modified--;
        }
        else {
            modified = 0;
            //check for String-End (check before begin!)
            if (inString && (txt[i] === '"')) {
                // if (!(txt[i - 1] === '\\')) {  //check for escaped quot
                inString = false;
                // }
            }
            else if (!inComment) {//check for String-Begin, but not the same char as close!
                if (txt[i] === '"') {
                    inString = true;
                    //log("info", `Info @ Line ${LineCount} at Column ${ColumnCount} -> Open string detected!`);
                }
            }

            //Line count 
            if (txt[i] === LF) {

                if (inString) {//check for String error, because there is no way to declare string over multiple Line!
                    log("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> no closed string detected!`);
                    log("info", buf);
                    return text; //return unformatet text
                }

                LineCount++;
                ColumnCount = 0;
            }


            //check for comment-error
            if (!inComment && (txt[i] === '}')) {
                log("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> closed comment bracket witout Open comment bracket!`);
                log("Error", buf);
                return text; //return unformatted text
            }
            else if (txt[i] === '{') { //check for Comment-Begin
                inComment = true;
            }
            else if (inComment && (txt[i] === '}')) {//check for Comment-End
                inComment = false;
            }


            //formatting session
            if (!inString) {

                if (!(modified > 0) && (!inComment || config.KeywordUppercaseAlsoInComment)) {
                    let j: any;

                    let wbf: string = '';//word-bindery-test-char-before
                    let wba: string = '';//word-bindery-test-char-after


                    //check for KEYWORDS
                    for (j in KEYWORDS) {
                        let k: any;
                        let tt: string = '';
                        wbf = text[i - 1];
                        for (k = 0; k <= KEYWORDS[j].length - 1; k++) {
                            tt += text[i + k];
                            wba = text[i + k + 1];
                        }

                        if (tt.toLowerCase() === KEYWORDS[j].toLowerCase()) {
                            if (CheckCRLForWhitespace(wbf) && CheckCRLForWhitespace(wba)) {//check Word-Binary
                                tt = KEYWORDS[j].toUpperCase() + wba;
                                buf += tt;
                                modified = tt.length - 1;
                            }
                        }
                    }


                    //check double operators first
                    if (!(modified > 0)) {
                        for (j in DOUBLE_OPERATORS) {
                            let k: any;
                            let tt: string = '';
                            wbf = text[i - 1];

                            for (k = 0; k <= DOUBLE_OPERATORS[j].length - 1; k++) {
                                tt += text[i + k];
                                wba = text[i + k + 1];
                            }

                            if (tt === DOUBLE_OPERATORS[j]) {

                                if (text[i - 1] !== ' ') {
                                    buf += ' ';
                                }

                                buf += DOUBLE_OPERATORS[j];

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
                        for (j in SINGLE_OPERATORS) {

                            if (text[i] === SINGLE_OPERATORS[j]) {

                                if (text[i - 1] !== ' ') {
                                    buf += ' ';
                                }

                                buf += text[i];

                                if (text[i + 1] !== ' ') {
                                    let debug1 = SINGLE_OPERATORS[j];
                                    if (SINGLE_OPERATORS[j] === '+' || SINGLE_OPERATORS[j] === '-') {
                                        if (isNaN(+text[i + 1])) {
                                            buf += ' ';
                                        }
                                    }
                                    else {
                                        buf += ' ';
                                    }
                                }

                                modified = -1;
                                //console.log('Operator:[', text[i], ']modified:', modified);
                                break;
                            }
                        }
                    }

                }

            }//formatting session

            if (modified === 0) {//insert only when on this session not modified!
                buf += txt[i];
            }

        }//not modified

    }//for
    //console.log(buf);

    return buf;
}//function


function CheckCRLForWhitespace(s: string): boolean {
    //https://stackoverflow.com/questions/69709447/problem-to-create-a-regex-expression-in-js-to-select-keywords-in-text-but-excl/69734464?noredirect=1#comment123265818_69734464
    return FORMATS.concat(SINGLE_OPERATORS, DOUBLE_OPERATORS, TRENNER).some(item => s === item);
}
