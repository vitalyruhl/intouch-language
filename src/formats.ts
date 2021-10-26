
// Character Constants
export const TAB = "\t";
export const CR = "\r";
export const LF = "\n";
export const CRLF = "\r\n";
export const DQUOTE = '\"';
export const SQUOTE = "\'";
export const BACKSLASH = "\\";

export const FORMATS: string[] = [TAB, CR, LF, CRLF, DQUOTE, SQUOTE, BACKSLASH];
export const SINGLE_OPERATORS: string[] = ['=', '+', '-', '<', '>', '*', '/', '%', '!', '~', '|'];
export const DOUBLE_OPERATORS: string[] = ['==', '<>', '<=', '=>'];
export const TRENNER: string[] = [';', ' '];

import { log } from './functions';


const KEYWORDS: string[] = ["NULL", "EOF", "AS", "IF", "ENDIF", "ELSE", "WHILE", "FOR", "DIM", "THEN",
    "EXIT", "EACH", "STEP", "IN", "RETURN", "CALL", "MOD", "AND", "NOT", "IS",
    "OR", "XOR", "Abs", "TO", "SHL", "SHR", "discrete", "integer", "real", "message"];


export function forFormat(text: string, config: any): string {
    //let txt = runes(text);//Splitt text into single character
    let txt = text.split('');//Splitt text into single character
    let buf: string = '';
    let i: any = 0;
    let modified: number = 0;

    let inComment: boolean = false;
    let inString: boolean = false;

    let LineCount: number = 1;
    let ColumnCount: number = 0;
    let NestingCount: number = 0;

    for (i = 0; i <= txt.length - 1; i++) {

        //Columncount
        ColumnCount++;

        if (modified > 0) {
            modified--;
        }
        else {

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

                //check for consistense whitespace and remove them
                if (!(modified > 0) && !inComment) {
                    if (text[i] === ' ' && text[i + 1] === ' ') {
                        modified++;
                    }
                }


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


                    //check for Double
                    if (!(modified > 0)) {
                        for (j in DOUBLE_OPERATORS) {//check double operators first
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
                    if (!(modified > 0) && false) {
                        for (j in SINGLE_OPERATORS) {//check double operators first

                            if (text[i] === SINGLE_OPERATORS[j]) {

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



            }//formatin session

            if (!(modified > 0)) {//insert only when on this session not modified!
                buf += txt[i];
            }

        }//not modified

    }//for
    //console.log(buf);












    return buf;
}//function

function CheckCRLForWhitespace(s: string): boolean {
    let checks: string[] = [];
    let check: boolean[] = [];
    let test: boolean = false;

    checks = FORMATS.concat(SINGLE_OPERATORS);
    checks = checks.concat(DOUBLE_OPERATORS);
    
    checks = checks.concat(TRENNER);

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