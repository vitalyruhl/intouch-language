
import { TAB, CR, LF, CRLF, DQUOTE, SQUOTE, BACKSLASH } from "./const";
import { FORMATS, SINGLE_OPERATORS, DOUBLE_OPERATORS, TRENNER, KEYWORDS } from './const';
import { log } from './functions';
import { NESTINGS, EXCLUDE_KEYWORDS } from "./nestingdef";

import * as vscode from 'vscode';

import { REGEX } from './const';

export function formatNestings(text: string, config: any): string {

    let buf: string = '';
    let codeFragments: string[] = [];
    let regex: string = '';
    let nestingCounter: number = 0;
    let nestingCounterPrevous: number = 0;
    let multilineComment: boolean = false;
    let thisLineBack: boolean = false;
    let LineCount: number = 1;

    try {
        codeFragments = text.split(CRLF);//split code by Line

        for (let i = 0; i < codeFragments.length - 1; i++) {

            LineCount = i + 1;//only for Log and Error


            if (codeFragments[i] === '') {//not in epmty lines goes faster...
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


            let str = codeFragments[i].match(REGEX.gm_GET_STRING); //get all Strings in the Line
            if (str) {
                let str2 = str.map(item => {
                    let strw = item.replace(/\s(?<!\t)/gmi, '\0'); //replace whitespaces in each String on ~
                    strw = strw.replace(/\t/gmi, 'u0001'); //replace TAB in each String on ~~~~
                    return codeFragments[i].replace(item, strw);//each String in Line
                });

                // remove continuus whitespaces (Item 0 contains all Text???!!!)
                // and Then ~ back in whitespaces
                codeFragments[i] = str2[0].replace(REGEX.gm_MOR_2_WSP, ' ').replace(/\0/gmi, ' ').replace(/u0001/gmi, '\t');//replace ~ back in whitespaces
            }



            if (!multilineComment) {
                let exclude: boolean = false;

                codeFragments[i] = codeFragments[i].replace(REGEX.gm_GET_NESTING, ''); //remove all Nestings

                EXCLUDE_KEYWORDS.some(item => {
                    //show for Exludes from Nesting
                    regex = `((?![^{]*})(${item}))`;
                    if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                        exclude = true;
                    }
                });

                //loop in all Nesting Keyworconfigurations
                NESTINGS.some(item => {//format nestings

                    /*
                    todo: 2021.10.28 viru ->  
                            bug 2021.10.28 double Keyword in nesting-config (1x next in for and 1x in while) 
                            break nesting, because this reduce nesting, witout increase it on while
                            Break on find firs match, does not work on .some or .foreach -> need to use another iteration



                            https://stackoverflow.com/questions/2641347/short-circuit-array-foreach-like-calling-break
                            for (const [index, el] of arr.entries()) {
                                if ( index === 5 ) break;
                                }
                                var array = [1, 2, 3];

                            OR

                            for (var i = 0; i < array.length; i++) {
                            if (array[i] === 1){
                                break;
                            }
                            }



                    */
                    

                    if (!exclude) { //bugfix on "exit for;"
                        //begin like IF
                        regex = `((?![^{]*})(\\b${item.keyword})\\b)`;
                        if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {

                            nestingCounter++;
                        }
                    }

                    //midle like ELSE
                    if (item.midle !== '') {
                        regex = `((?![^{]*})(\\b${item.midle})\\b)`;
                        if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                            thisLineBack = true;
                        }
                    }


                    //end like ENDIF
                    regex = `((?![^{]*})(\\b${item.end})\\b)`;
                    if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
                        nestingCounter--;
                        if (nestingCounterPrevous !== nestingCounter) {
                            thisLineBack = true;
                        }
                        if (nestingCounter < 0) {//just in case
                            nestingCounter = 0;
                            thisLineBack = false;
                        }
                    }
                });
            }

            if (nestingCounterPrevous !== nestingCounter) {
                codeFragments[i] = getNesting(nestingCounterPrevous, thisLineBack) + codeFragments[i];
                nestingCounterPrevous = nestingCounter;
                thisLineBack = false;//reset this Flag
            }
            else {
                codeFragments[i] = getNesting(nestingCounterPrevous, thisLineBack) + codeFragments[i];
                thisLineBack = false;//reset this Flag
            }

        }

        // combine all into new text and return it
        for (let i = 0; i < codeFragments.length - 1; i++) {
            buf += codeFragments[i] + CRLF;
        }

    } catch (error) {
        log("Error", `Unhandled Error @ Line ${LineCount}!`);
        return text; //on error return unformated code
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

        //Columncount
        ColumnCount++;

        if (modified > 0) {
            modified--;
        }
        else {
            modified = 0;
            //check for String-End (check before begin!)
            if (inString && (txt[i] === '"')) {
                if (!(txt[i - 1] === '\\')) {  //check for escaped quot
                    inString = false;
                    //log("info", `Info @ Line ${LineCount} at Column ${ColumnCount} -> closed string detected!`);
                }
            }
            else if (!inComment) {//check for String-Begin, but not the same char as close!
                if (txt[i] === '"') {
                    inString = true;
                    //log("info", `Info @ Line ${LineCount} at Column ${ColumnCount} -> Open string detected!`);
                }
            }

            //Linecount 
            if (txt[i] === LF) { //txt[i] === CRLF || txt[i] === CR || txt[i] === LF

                if (inString) {//check for String error, because there is no way to declara string over multiple Line!
                    log("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> no closed string detected!`);
                    log("Error", buf);
                    return text; //return unformatet text
                }

                LineCount++;
                ColumnCount = 0;
            }


            //check for comment-error
            if (!inComment && (txt[i] === '}')) {
                log("Error", `Error @ Line ${LineCount} at Column ${ColumnCount} -> closed comment bracket witout Open comment bracket!`);
                log("Error", buf);
                return text; //return unformatet text
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
                                    buf += ' ';
                                }

                                modified = -1;
                                //console.log('Operator:[', text[i], ']modified:', modified);
                                break;
                            }
                        }
                    }
                }

            }//formating session

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
