
// Character Constants
export const TAB = "\t";
export const CRLF = "\r\n";
export const DQUOTE = '\"';
export const SQUOTE = "\'";
export const BACKSLASH = "\\";

const keywords: string[] = ["NULL", "EOF", "AS", "IF", "ENDIF", "ELSE", "WHILE", "FOR", "DIM", "THEN",
    "EXIT", "EACH", "STEP", "IN", "RETURN", "CALL", "MOD", "AND", "NOT", "IS",
    "OR", "XOR", "Abs", "TO", "SHL", "SHR", "discrete", "integer", "real", "message"];


export function forFormat(text: string): string {
    //let txt = runes(text);//Splitt text into single character
    let txt = text.split('');//Splitt text into single character
    let buf: string = '';
    let i: any = 0;
    for (i=0; i <= txt.length -1; i++) {

        //check for keywords
        let j: any;
        let tt: string = '';
        for (j in keywords) {
            let k: any;
            for (k = 0; k <= keywords[j].length - 1; k++) {
                tt += text[i + k];
            }
            if (tt.toLowerCase() == keywords[j].toLowerCase() &&  k == keywords[j].length - 1) {
                tt = tt.toUpperCase();
                i +=keywords[j].length;
                buf += tt;
            }

        }

        buf += txt[i];



    }
    console.log(buf);
    return text;
}

