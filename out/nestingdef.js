"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NESTINGS = exports.EXCLUDE_KEYWORDS = void 0;
exports.EXCLUDE_KEYWORDS = ["EXIT FOR"];
exports.NESTINGS = [
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
//# sourceMappingURL=nestingdef.js.map