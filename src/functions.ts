import * as vscode from 'vscode';
import { workspace, window } from 'vscode';
import * as ff from './formats';

export let config: any = {};

export function formatTE(editor: vscode.TextEditor, range: vscode.Range): vscode.TextEdit[] {
	return [
		vscode.TextEdit.replace(range, format(editor, range))
	];
}

export function formatCmd(editor: vscode.TextEditor, range: vscode.Range) {
	return format(editor, range);
}


function format(editor: vscode.TextEditor, range: vscode.Range): string {
	let result: vscode.TextEdit[] = [];
	let formatted: string = '';
	let activeEditor = window.activeTextEditor;
	let regex: RegExp;

	if (!activeEditor) {
		return '';
	}

	let document = activeEditor.document;

	//first Step - get the config
	config = getConfig();
	formatted = document.getText(range); //get actual document text...

	//--------------------------------------------------------------------------------//
	// Remoove EmptyLines...
	let nEL: number = config.allowedNumberOfEmptyLines + 1.0;

	if (config.EmptyLinesAlsoInComment) {
		regex = new RegExp(`(?![^{]*})(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
	}
	else {
		regex = new RegExp(`(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
	}
	//todo uncomment on readdy: formatted = formatted.replace(regex, ff.CRLF);

	//--------------------------------------------------------------------------------//
	//make all keywords Uppercase
	// (?!("|{)[\s\S]*?(}|"))
	// (\b(if|eof|discrete|integer|real|message)\b)
	// (["'])(?:(?=(\\?))\2.)*?\1
	// (?!([^{]*[}])([^"]*["]))(\b(as|eof|if|endif|then|dim)\b)
	// (?<!(\0|\t|\n|\r))([^"](?![^{]*?["]})(\b(as|eof|if|endif|then|dim)\b))

	regex = /(?![^{]*})(\b(NULL|EOF|AS|IF|ENDIF|ELSE|WHILE|FOR|DIM|THEN|EXIT|EACH|STEP|IN|RETURN|CALL|MOD|AND|NOT|IS|OR|XOR|Abs|TO|SHL|SHR|discrete|integer|real|message)\b)/gmi;
	// formatted = toUpperRegEx(regex, formatted);/*24.10.2021/todo: not in Comment!!!*/
	formatted = formatted.replace(regex, c => c.toUpperCase());
	//log("info", formatted);


	//--------------------------------------------------------------------------------//
	//All Hermes-System-Variable
	regex = /\b(sys_|ma_|smel_|her_)/gmi;
	formatted = toUpperRegEx(regex, formatted);
	log("info", formatted); 


	//--------------------------------------------------------------------------------//
	//Spacing on 
	let arr : string[] = ['-','==','=','+','-','<','>','<>'];
	formatted = formatSpaceBeforeAfter(arr,formatted);
	//	log("info",formatted);
	//config.AllowInlineIFClause


	// <> =






	if (formatted) {
		activeEditor.edit((editor) => {
			return editor.replace(range, formatted);
		});
	}
}



//----------------------------------------------------------------
//----------------------------------------------------------------

function formatSpaceBeforeAfter(arr: string[],str: string): string {

	arr.map( a => {
		let regex = new RegExp(`(?![^{]*})(^[\\s]${a})`, 'gm');
		return str.replace(regex, c => c.toUpperCase())
	});
 return str;
}

function toUpperRegEx(regex: RegExp, str: string): string {
	return str.replace(regex, c => c.toUpperCase());
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
	
	//misk
	config.EmptyLinesAlsoInComment = workspace.getConfiguration().get('VBI.formatter.EmptyLinesAlsoInComment');
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