'use strict';

import * as vscode from 'vscode';
import { formatTE } from './functions';

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.registerCommand('vbi-format', () => {
		const { activeTextEditor } = vscode.window;
		if (activeTextEditor) { 
			//&& activeTextEditor.document.languageId === 'intouch'
			const { document } = activeTextEditor;
			let start = new vscode.Position(0, 0);
			let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
			let r = new vscode.Range(start, end);
			return formatTE(r);
		}
	});

	//https://vscode-docs.readthedocs.io/en/latest/extensionAPI/vscode-api/
	vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'intouch' }, {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			const { activeTextEditor } = vscode.window;
			let start = new vscode.Position(0, 0);
			let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
			let r = new vscode.Range(start, end);
			return formatTE(r);
		}
	});
}

//It will be invoked on deactivation
export function deactivate() { }
