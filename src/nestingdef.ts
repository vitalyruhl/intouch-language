
import {TAB, CR, LF, CRLF, DQUOTE, SQUOTE, BACKSLASH} from "./const";


interface NestingInterface {
    keyword: string; //begin of the Nesting
    lineEnd: string; //end of the Line in Keyword - can be the same
    nesting: string; //string for Nesting eg, \t
    midle: string; //eg else in if-then-else-endit
    end: string; //end of this Nestin
    cbInline: boolean; //can be Inline
}

export const NESTINGS: NestingInterface[] = [
    {
        keyword: 'if',
        lineEnd: 'then',
        nesting: TAB,
        midle: 'else',
        end: 'eindif',
        cbInline: true
    },
    {
        keyword: 'for',
        lineEnd: LF,
        nesting: TAB,
        midle: '',
        end: 'next',
        cbInline: false
    },
];
