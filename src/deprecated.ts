
import * as vscode from 'vscode';
import { workspace , window} from 'vscode';

import { config , log} from './functions';


/*
* deprecated
*/
function deleteEmptyLines(range: vscode.Range, edit: vscode.TextEditorEdit, document: vscode.TextDocument) {
	let deletedLinesCounter = 0;
	let numberOfConsequtiveEmptyLines = 0;

	log("info", "Entry deleteEmptyLines -> max-Lines:", config.allowedNumberOfEmptyLines.toString(), "\n",
	"range-Start", range.start, "end:", range.end);
	console.log("range-Start", range.start, "end:", range.end);

	for (let index = range.start.line; index < range.end.line; index++) {

		let line = document.lineAt(index);

		if (!line.isEmptyOrWhitespace) {
			numberOfConsequtiveEmptyLines = 0;
			continue;
		}

		numberOfConsequtiveEmptyLines++;
		if (numberOfConsequtiveEmptyLines > config.allowedNumberOfEmptyLines) {
			deletedLinesCounter++;
			edit.delete(line.rangeIncludingLineBreak);
		}
	}
	log("info", "deletedLinesCounter:", deletedLinesCounter);
	//return deletedLinesCounter;
}

