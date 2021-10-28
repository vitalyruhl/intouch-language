

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

    /*
        todo: 2021.10.28 viru ->  
                bug 2021.10.28 double Keyword in nesting-config (1x next in for and 1x in while) 
                break nesting, because this reduce nesting, witout increase it on while
                Break on find firs match, does not work on .some or .foreach -> need to use another iteration
                First Step was to uncomment the while definition
    */

    // {
    //     keyword: 'while',
    //     midle: '',
    //     end: 'next', 
    // },


];
