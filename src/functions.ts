
import * as vscode from 'vscode';
import { workspace, window } from 'vscode';
import { preFormat, formatNestings } from './formats';
import { CRLF } from "./const";

export let config: any = {};

export function formatTE(range: vscode.Range): vscode.TextEdit[] {
	config = getConfig();
	let document = window.activeTextEditor.document;

	const newText = format(range, document, config);
	return [vscode.TextEdit.replace(range, newText)];
}

function format(range: vscode.Range, document: vscode.TextDocument, config: any): string {
	// PURE IMPLEMENTATION (Refactor 2025-09-14): No direct editor side-effects anymore.
	let regex: RegExp;
	let formatted: string = document.getText(range);

	// 1. Keyword / Operator Formatting
	formatted = preFormat(formatted, config);
	// 2. Nestings
	formatted = formatNestings(formatted, config);

	// 3. Remove EmptyLines
	const nEL: number = (config.allowedNumberOfEmptyLines || 1) + 1.0;
	if (config.RemoveEmptyLines) {
		if (config.EmptyLinesAlsoInComment) {
			regex = new RegExp(`(?![^{]*})(^[\t]*$\r?\n){${nEL},}`, 'gm');
		} else {
			regex = new RegExp(`(^[\t]*$\r?\n){${nEL},}`, 'gm');
		}
		formatted = formatted.replace(regex, CRLF);
	}

	return formatted;
}

//----------------------------------------------------------------
//----------------------------------------------------------------

export function getConfig() {
	//https://code.visualstudio.com/api/references/contribution-points
	//debug
	config.debug = false; //workspace.getConfiguration().get('VBI.formatter.debug.active');
	config.debugToChannel = true; //workspace.getConfiguration().get('VBI.formatter.debug.debugToChannel');

	//Live empty Lines
	config.allowedNumberOfEmptyLines = workspace.getConfiguration().get('VBI.formatter.EmptyLine.allowedNumberOfEmptyLines');
	if (config.allowedNumberOfEmptyLines < 0 || config.allowedNumberOfEmptyLines > 50) {
		config.allowedNumberOfEmptyLines = 1;
	}

	config.RemoveEmptyLines = workspace.getConfiguration().get('VBI.formatter.EmptyLine.RemoveEmptyLines');
	config.EmptyLinesAlsoInComment = workspace.getConfiguration().get('VBI.formatter.EmptyLine.EmptyLinesAlsoInComment');

	//codeblock-Nesting settings
	config.BlockCodeBegin = workspace.getConfiguration().get('VBI.formatter.BC.BlockCodeBegin');
	config.BlockCodeEnd = workspace.getConfiguration().get('VBI.formatter.BC.BlockCodeEnd');
	config.BlockCodeExclude = workspace.getConfiguration().get('VBI.formatter.BC.BlockCodeExclude');


	//Region codeblock-Nesting settings
	config.RegionBlockCodeBegin = workspace.getConfiguration().get('VBI.formatter.Region.BlockCodeBegin');
	config.RegionBlockCodeEnd = workspace.getConfiguration().get('VBI.formatter.Region.BlockCodeEnd');
	config.RegionBlockCodeExclude = workspace.getConfiguration().get('VBI.formatter.Region.BlockCodeExclude');


	//misc
	config.ReplaceTabToSpaces = workspace.getConfiguration().get('VBI.formatter.Misc.ReplaceTabToSpaces');
	config.IndentSize = workspace.getConfiguration().get('VBI.formatter.Misc.IndentSize');
	if (typeof config.IndentSize !== 'number' || config.IndentSize < 1 || config.IndentSize > 10) {
		config.IndentSize = 4;
	}
	if (typeof config.ReplaceTabToSpaces !== 'boolean') {
		config.ReplaceTabToSpaces = true; // fallback to default from package.json
	}
	//config.AllowInlineIFClause = workspace.getConfiguration().get('VBI.formatter.AllowInlineIFClause');

	//log this
	console.log('getConfig():', config);
	return config;
}

/**
 * @param cat Type String --> define Category [info,warn,error]
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
					console.error('ERROR:', o);
					return;
				default:
					console.log('log:', cat, o);
					return;
			}
		}
	}
	else if (cat.toLowerCase() === 'error') { // show Error in vc, and log it to console

		let err: string = '';
		o.map((args: any) => {
			err += mapObject(args);
		});
		console.error('ERROR:',o);
		vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
		return;
	}


}

export function cloneArray(arr){
	return [...arr]
}