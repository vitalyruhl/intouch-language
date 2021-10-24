'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const functions_1 = require("./functions");
function activate(context) {
    vscode.commands.registerCommand('vbi-format', () => {
        const { activeTextEditor } = vscode.window;
        if (activeTextEditor && activeTextEditor.document.languageId === 'intouch') {
            const { document } = activeTextEditor;
            let start = new vscode.Position(0, 0);
            let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            let r = new vscode.Range(start, end);
            return (0, functions_1.formatCmd)(activeTextEditor, r);
        }
    });
    //https://vscode-docs.readthedocs.io/en/latest/extensionAPI/vscode-api/
    vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'intouch' }, {
        provideDocumentFormattingEdits(document) {
            const { activeTextEditor } = vscode.window;
            let start = new vscode.Position(0, 0);
            let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            let r = new vscode.Range(start, end);
            return (0, functions_1.formatTE)(activeTextEditor, r);
        }
    });
}
exports.activate = activate;
//It will be invoked on deactivation
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map