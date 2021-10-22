'use strict';

import * as vscode from 'vscode';
import { format } from './functions';



export function activate(context: vscode.ExtensionContext) {
	
	vscode.commands.registerCommand('vbi-format', () => {
        const {activeTextEditor} = vscode.window;

        if (activeTextEditor && activeTextEditor.document.languageId === 'intouch') {
            const {document} = activeTextEditor;

			let start = new vscode.Position(0, 0);
			let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);

			return format(activeTextEditor,new vscode.Range(start, end));

           
        }
    });
	
	
	vscode.languages.registerDocumentFormattingEditProvider({scheme: 'file', language: 'intouch'}, {
		provideDocumentFormattingEdits(document: vscode.TextDocument) {
			const firstLine = document.lineAt(0);
			
			return [vscode.TextEdit.insert(firstLine.range.start, '\n--> format\n')] ;
			


			// let start = new vscode.Position(0, 0);
			// let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
			// return format(document, new vscode.Range(start, end), options)

			//todo:add test for sel. Ranges
			// return format(document,range, options)

		}
	});

	
}

//It will be invoked on deactivation
export function deactivate() { }
