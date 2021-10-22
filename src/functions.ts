import * as vscode from 'vscode';
import { workspace , window} from 'vscode';



export let config: any = {};


// Inline Character Constants
const TAB = "\t";
const CRLF = "\r\n";
const DQUOTE = '\"';
const SQUOTE = "\'";
const BACKSLASH = "\\";




export function format(editor: vscode.TextEditor,  range: vscode.Range) {
	let result: vscode.TextEdit[] = [];
	let formatted: string = '';

	let activeEditor = window.activeTextEditor;
	
	if (!activeEditor) {
		return;
	}
	
	let document = activeEditor.document;

	//first Step - get the config
	config = getConfig();

	

	// Remoove EmptyLines...
	let nEL:number = config.allowedNumberOfEmptyLines + 1.0;
	let rEL = new RegExp(`(^[\\t]*$\\r?\\n){${nEL},}`,'gm');
	
	formatted = PerformRegex(document, range,rEL,CRLF);
	//console.log("ManageLinebreakes",formatted);
	
    if (formatted) {
		activeEditor.edit((editor) =>{
			return editor.replace(range, formatted);
    	});
	}

	//rEL =/(^|\s*)(if|while|for\s*(\W\s*\S.*|\s*$)/gm;
	//formatted = PerformRegex(document, range,rEL,TAB);
	//if (formatted) {
	//	activeEditor.edit((editor) =>{
	//		return editor.replace(range, formatted);
    //	});
	//}

}


function PerformRegex(document: vscode.TextDocument, range: vscode.Range, regex:RegExp ,replace:string) {
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