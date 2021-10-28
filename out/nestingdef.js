"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NESTINGS = exports.EXCLUDE_KEYWORDS = void 0;
exports.EXCLUDE_KEYWORDS = ["EXIT FOR"];
exports.NESTINGS = [
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
//# sourceMappingURL=nestingdef.js.map