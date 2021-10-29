

interface NestingInterface {
    keyword: string; //begin of the Nesting (IF)
    midle: string; //eg else in if-then-else-endit (ELSE)
    end: string; //end of this Nesting (ENDIF)
    multiline: string; //can contain Multiline Keyword (THEN)
}

export const EXCLUDE_KEYWORDS: string[] = ["EXIT FOR"];


export const NESTINGS: NestingInterface[] = [
    {
        keyword: 'if',
        midle: 'else',
        end: 'endif',
        multiline: 'then',
    },
    {
        keyword: 'for',
        midle: '',
        end: 'next',
        multiline: '',
    },
    {
        keyword: 'while',
        midle: '',
        end: 'next',
        multiline: '',
    },


];
