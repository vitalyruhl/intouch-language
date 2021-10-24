import * as vscode from 'vscode';
import { workspace, window } from 'vscode';



export let config: any = {};


// Inline Character Constants
const TAB = "\t";
const CRLF = "\r\n";
const DQUOTE = '\"';
const SQUOTE = "\'";
const BACKSLASH = "\\";


export function formatTE(editor: vscode.TextEditor, range: vscode.Range): vscode.TextEdit[]{
	return [
		vscode.TextEdit.replace(range,format(editor, range)) 
	];
}

export function formatCmd(editor: vscode.TextEditor, range: vscode.Range){
	return	format(editor, range);
}


function format(editor: vscode.TextEditor, range: vscode.Range):string {
	let result: vscode.TextEdit[] = [];
	let formatted: string = '';
	let content: string = '';
	let activeEditor = window.activeTextEditor;
	let regex: RegExp;

	if (!activeEditor) {
		return '';
	}

	let document = activeEditor.document;

	//first Step - get the config
	config = getConfig();



	// Remoove EmptyLines...
	let nEL: number = config.allowedNumberOfEmptyLines + 1.0;

	if (config.EmptyLinesAlsoInComment){
		regex = new RegExp(`(?![^{]*})(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
	}
	else { 
		regex = new RegExp(`(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
	}

	content = document.getText(range); //get actual document text...
	formatted = content.replace(regex, CRLF);


	//make all keywords Uppercase
	content = formatted;
	regex = /(?![^{]*})(\\b(NULL|EOF|AS|IF|ENDIF|ELSE|WHILE|FOR|DIM|THEN|EXIT|EACH|STEP|IN|RETURN|CALL|MOD|AND|NOT|IS|OR|XOR|Abs|TO|SHL|SHR|discrete|integer|real|message)\\b)/gmi;
	formatted = toUpperRegEx(regex, content);/*24.10.2021/todo: not in Comment!!!*/
	log("info",formatted);

	//All Hermes-System-Variable
	regex = /(\\b(SYS_|MA_|SMEL_|HER_)\\w*)/gmi;
	formatted = toUpperRegEx(regex, content);
	log("info",formatted);
	

	//Spacing on 
//	regex = /(?![^{]*})([^\s][-|==|=|\+][^\s])/gmi;
//	content = formatted;
//	formatted = content.replace(regex, ' - ');
//	log("info",formatted);
//config.AllowInlineIFClause


// <> =






	if (formatted) {
		activeEditor.edit((editor) => {
			return editor.replace(range, formatted);
		});
	}
}


function toUpperRegEx(regex: RegExp, str: string): string {
	return str.replace(regex, c => c.toUpperCase());
}

function PerformRegex(document: vscode.TextDocument, range: vscode.Range, regex: RegExp, replace: string) {
	let content = document.getText(range); //get actual document text...
	return content.replace(regex, replace); //test format comments
}


export function getConfig() {

	//debug
	config.debug = workspace.getConfiguration().get('VBI.formatter.debug');
	config.debugToChannel = workspace.getConfiguration().get('VBI.formatter.debugToChannel');

	//Leve emty Lines
	config.allowedNumberOfEmptyLines = workspace.getConfiguration().get('VBI.formatter.allowedNumberOfEmptyLines');
	if (config.allowedNumberOfEmptyLines < 0 || config.allowedNumberOfEmptyLines > 50) {
		config.allowedNumberOfEmptyLines = 1;
	}

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

					info.appendLine('INFO:');
					o.map((args: any) => {
						info.appendLine('' + mapObject(args));
					});
					info.show();
					return;

				case 'warn':
					info.appendLine('WARN:');
					o.map((args: any) => {
						info.appendLine('' + mapObject(args));
					});
					info.show();
					return;

				case 'error':
					let err: string = '';
					info.appendLine('ERROR: ');
					//err += mapObject(cat) + ": \r\n";
					o.map((args: any) => {
						err += mapObject(args);
					});
					info.appendLine(err);
					vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
					info.show();
					return;

				default:

					info.appendLine('INFO-Other:');
					info.appendLine(mapObject(cat));
					o.map((args: any) => {
						info.appendLine('' + mapObject(args));
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