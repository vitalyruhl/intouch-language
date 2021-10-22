"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("./functions");
/*
* deprecated
*/
function deleteEmptyLines(range, edit, document) {
    let deletedLinesCounter = 0;
    let numberOfConsequtiveEmptyLines = 0;
    (0, functions_1.log)("info", "Entry deleteEmptyLines -> max-Lines:", functions_1.config.allowedNumberOfEmptyLines.toString(), "\n", "range-Start", range.start, "end:", range.end);
    console.log("range-Start", range.start, "end:", range.end);
    for (let index = range.start.line; index < range.end.line; index++) {
        let line = document.lineAt(index);
        if (!line.isEmptyOrWhitespace) {
            numberOfConsequtiveEmptyLines = 0;
            continue;
        }
        numberOfConsequtiveEmptyLines++;
        if (numberOfConsequtiveEmptyLines > functions_1.config.allowedNumberOfEmptyLines) {
            deletedLinesCounter++;
            edit.delete(line.rangeIncludingLineBreak);
        }
    }
    (0, functions_1.log)("info", "deletedLinesCounter:", deletedLinesCounter);
    //return deletedLinesCounter;
}
//# sourceMappingURL=deprecated.js.map