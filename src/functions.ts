import * as vscode from 'vscode';
import { workspace, window } from 'vscode';
import { forFormat, formatNestings } from './formats';
import { CRLF } from "./const";

export let config: any = {};

export function formatTE(editor: vscode.TextEditor, range: vscode.Range): vscode.TextEdit[] {
	config = getConfig();
	let document = window.activeTextEditor.document;


	// todo: add light-code-checker, like ; / if-then-endif; /for-next; etc...

	return [
		vscode.TextEdit.replace(range, format(editor, range)),//ground formattings
		vscode.TextEdit.replace(range, formatNestings(range, document, config))//Format nestings

	];
}

function format(editor: vscode.TextEditor, range: vscode.Range): string {

	let formatted: string = '';
	let activeEditor = window.activeTextEditor;
	let regex: RegExp;
	let isError: boolean = false;

	let document = activeEditor.document;

	formatted = document.getText(range); //get actual document text...
	formatted = forFormat(formatted, config); //Format keywords and operators

	//--------------------------------------------------------------------------------//
	// Remove EmptyLines...
	let nEL: number = config.allowedNumberOfEmptyLines + 1.0;

	if (config.RemoveEmptyLines) {
		if (config.EmptyLinesAlsoInComment) {
			regex = new RegExp(`(?![^{]*})(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
		}
		else {
			regex = new RegExp(`(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
		}
		formatted = formatted.replace(regex, CRLF);
	}

	// apply changes
	if (formatted) {
		activeEditor.edit((editor) => {
			return editor.replace(range, formatted);
		});
	}

	if (isError) { //only for ts, because a function must return value....
        return '';
    }
}

//----------------------------------------------------------------
//----------------------------------------------------------------

export function getConfig() {

	//debug
	config.debug = workspace.getConfiguration().get('VBI.formatter.debug');
	config.debugToChannel = workspace.getConfiguration().get('VBI.formatter.debugToChannel');

	//Leve emty Lines
	config.allowedNumberOfEmptyLines = workspace.getConfiguration().get('VBI.formatter.allowedNumberOfEmptyLines');
	if (config.allowedNumberOfEmptyLines < 0 || config.allowedNumberOfEmptyLines > 50) {
		config.allowedNumberOfEmptyLines = 1;
	}

	//misk
	config.RemoveEmptyLines = workspace.getConfiguration().get('VBI.formatter.RemoveEmptyLines');
	config.EmptyLinesAlsoInComment = workspace.getConfiguration().get('VBI.formatter.EmptyLinesAlsoInComment');
	config.KeywordUppercaseAlsoInComment = workspace.getConfiguration().get('VBI.formatter.KeywordUppercaseAlsoInComment');
	config.AllowInlineIFClause = workspace.getConfiguration().get('VBI.formatter.AllowInlineIFClause');

	//log this
	console.log('getConfig():', config);
	return config;
}

/**
 * @param cat Type String --> define Cathegory [info,warn,error]
 * @param o   Rest Parameter, Type Any --> Data to Log
 */
export let info = vscode.window.createOutputChannel("VBI-Info");
export function log(cat: string, ...o: any) {

	function mapObject(obj: any) {

		switch (typeof obj) {
			case 'undefined':
				return 'undefined';

			case 'object':
				let ret: string = '';
				for (const [key, value] of Object.entries(obj)) {
					ret += (`${key}: ${value}\n`);
				}
				return ret;

			default:
				return obj; //function,symbol,boolean

		}

	}

	if (config.debug) {
		if (config.debugToChannel) {
			switch (cat.toLowerCase()) {
				case 'info':

					//info.appendLine('INFO:');
					o.map((args: any) => {
						info.appendLine('INFO:' + mapObject(args));
					});
					info.show();
					return;

				case 'warn':
					//info.appendLine('WARN:');
					o.map((args: any) => {
						info.appendLine('WARN:' + mapObject(args));
					});
					info.show();
					return;

				case 'error':
					let err: string = '';
					//info.appendLine('ERROR: ');
					//err += mapObject(cat) + ": \r\n";
					o.map((args: any) => {
						err += mapObject(args);
					});
					info.appendLine(err);
					vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
					info.show();
					return;

				default:

					//info.appendLine('INFO-Other:');
					//info.appendLine('INFO-Other:' + mapObject(cat));
					o.map((args: any) => {
						info.appendLine('INFO-Other:' + mapObject(args));
					});
					info.show();
					return;
			}

		}
		else {
			switch (cat.toLowerCase()) {
				case 'info':
					console.log('INFO:', o);
					return;
				case 'warn':
					console.log('WARNING:', o);
					return;
				case 'error':
					console.log('ERROR:', o);
					return;
				default:
					console.log('log:', cat, o);
					return;
			}
		}
	}

}