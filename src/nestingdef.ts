

interface NestingInterface {
    keyword: string; //begin of the Nesting (IF)
    middle: string; //eg else in if-then-else-endif (ELSE)
    end: string; //end of this Nesting (ENDIF)
    multiline: string; //can contain Multiline Keyword (THEN)
}

export const EXCLUDE_KEYWORDS: string[] = ["EXIT FOR"];


export const NESTINGS: NestingInterface[] = [
    {
        keyword: 'if',
        middle: 'else',
        end: 'endif',
        multiline: 'then',
    },
    {
        keyword: 'for',
        middle: '',
        end: 'next',
        multiline: '',
    },
    {
        keyword: 'while',
        middle: '',
        end: 'next',
        multiline: '',
    }
];
