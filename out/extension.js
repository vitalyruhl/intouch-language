'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
//import { p_comment } from './regex'
function activate(context) {
    vscode.commands.registerCommand('vbi-format', () => {
        const { activeTextEditor } = vscode.window;
        if (activeTextEditor && activeTextEditor.document.languageId === 'intouch') {
            const { document } = activeTextEditor;
            const firstLine = document.lineAt(0);
            const edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, firstLine.range.start, '\n--> command\n');
            return vscode.workspace.applyEdit(edit);
        }
    });
    // 👍 formatter implemented using API
    vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'intouch' }, {
        provideDocumentFormattingEdits(document) {
            const firstLine = document.lineAt(0);
            return [vscode.TextEdit.insert(firstLine.range.start, '\n--> format\n')];
            // let start = new vscode.Position(0, 0);
            // let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            // return format(document, new vscode.Range(start, end), options)
            //todo:add test for sel. Ranges
            // return format(document,range, options)
        }
    });
}
exports.activate = activate;
//It will be invoked on deactivation
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map