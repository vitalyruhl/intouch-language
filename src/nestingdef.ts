

interface NestingInterface {
    keyword: string; //begin of the Nesting (IF)
    midle: string; //eg else in if-then-else-endit (ELSE)
    end: string; //end of this Nestin (ENDIF)
}

export const EXCLUDE_KEYWORDS: string[] = ["EXIT FOR"];


export const NESTINGS: NestingInterface[] = [
    {
        keyword: 'if',
        midle: 'else',
        end: 'endif',
    },
    {
        keyword: 'for',
        midle: '',
        end: 'next',
    },
    {
        keyword: 'while',
        midle: '',
        end: 'next',
    },
];
