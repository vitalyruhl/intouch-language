
import { TAB, CR, LF, CRLF, DQUOTE, SQUOTE, BACKSLASH } from "./const";
import { FORMATS, SINGLE_OPERATORS, DOUBLE_OPERATORS, TRENNER, KEYWORDS } from './const';
import { log } from './functions';
import { NESTINGS } from "./nestingdef";

import * as vscode from 'vscode';

import { REGEX_gm_TAB_NOT_IN_COMMENT, REGEX_gm_MOR_2_WSP } from './const';

export function formatNestings(text: string, config: any): string {

    let buf: string = '';
    let isError: boolean = false;
    let codeFragments: string[] = [];

    //codeFragments.push('\n!!!! FORMATED !!!\n');

    // split in lines
   //for (let i = range.start.line; i < range.end.line; i++) {
   //    codeFragments.push(document.lineAt(i).text);
   //}

    codeFragments = text.split(CRLF);

    for (let i = 0; i < codeFragments.length - 1; i++) {
        codeFragments[i] = codeFragments[i].replace(REGEX_gm_TAB_NOT_IN_COMMENT, ''); //remove all Nestings
        codeFragments[i] = codeFragments[i].replace(REGEX_gm_MOR_2_WSP, ' '); // remoove continuus whitespaces
    }

    for (let Key in NESTINGS){

    }
    // todo: remove all whitespaces from code only
    // todo: format nestings

    // combine all into new text and return it
    for (let i = 0; i < codeFragments.length - 1; i++) {
        buf += codeFragments[i] + CRLF;
    }

    if (!isError) { 
		return buf;
	}
}

//edit.delete(line.rangeIncludingLineBreak);


export function forFormat(text: string, config: any): string {

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
