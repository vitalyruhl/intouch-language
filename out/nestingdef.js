"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NESTINGS = void 0;
const const_1 = require("./const");
exports.NESTINGS = [
    {
        keyword: 'if',
        lineEnd: 'then',
        nesting: const_1.TAB,
        midle: 'else',
        end: 'eindif',
        cbInline: true
    },
    {
        keyword: 'for',
        lineEnd: const_1.LF,
        nesting: const_1.TAB,
        midle: '',
        end: 'next',
        cbInline: false
    },
];
//# sourceMappingURL=nestingdef.js.map