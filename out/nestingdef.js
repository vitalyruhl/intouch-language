"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NESTINGS = exports.EXCLUDE_KEYWORDS = void 0;
exports.EXCLUDE_KEYWORDS = ["EXIT FOR"];
exports.NESTINGS = [
    {
        keyword: "if",
        middle: "else",
        end: "endif",
        multiline: "then",
    },
    {
        keyword: "for",
        middle: "",
        end: "next",
        multiline: "",
    },
    {
        keyword: "while",
        middle: "",
        end: "next",
        multiline: "",
    }
];
//# sourceMappingURL=nestingdef.js.map