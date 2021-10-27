"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NESTINGS = void 0;
const const_1 = require("./const");
exports.NESTINGS = [
    {
        keyword: 'if',
        lineEnd: 'then',
        midle: 'else',
        end: 'endif',
        cbInline: true
    },
    {
        keyword: 'for',
        lineEnd: const_1.CRLF,
        midle: '',
        end: 'next;',
        cbInline: false
    },
];
//# sourceMappingURL=nestingdef.js.map