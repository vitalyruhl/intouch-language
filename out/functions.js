"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.info = exports.getConfig = exports.formatCmd = exports.formatTE = exports.config = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const formats_1 = require("./formats");
exports.config = {};
function formatTE(editor, range) {
    return [
        vscode.TextEdit.replace(range, format(editor, range))
    ];
}
exports.formatTE = formatTE;
function formatCmd(editor, range) {
    return format(editor, range);
}
exports.formatCmd = formatCmd;
function format(editor, range) {
    let result = [];
    let formatted = '';
    let activeEditor = vscode_1.window.activeTextEditor;
    let regex;
    if (!activeEditor) {
        return '';
    }
    let document = activeEditor.document;
    //first Step - get the config
    exports.config = getConfig();
    formatted = document.getText(range); //get actual document text...
    formatted = (0, formats_1.forFormat)(formatted, exports.config); //Format document
    //--------------------------------------------------------------------------------//
    // Remoove EmptyLines...
    let nEL = exports.config.allowedNumberOfEmptyLines + 1.0;
    if (exports.config.EmptyLinesAlsoInComment) {
        regex = new RegExp(`(?![^{]*})(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
    }
    else {
        regex = new RegExp(`(^[\\t]*$\\r?\\n){${nEL},}`, 'gm');
    }
    if (exports.config.RemoveEmptyLines) {
        formatted = formatted.replace(regex, formats_1.CRLF);
    }
    if (formatted) {
        activeEditor.edit((editor) => {
            return editor.replace(range, formatted);
        });
    }
}
//----------------------------------------------------------------
//----------------------------------------------------------------
function getConfig() {
    //debug
    exports.config.debug = vscode_1.workspace.getConfiguration().get('VBI.formatter.debug');
    exports.config.debugToChannel = vscode_1.workspace.getConfiguration().get('VBI.formatter.debugToChannel');
    //Leve emty Lines
    exports.config.allowedNumberOfEmptyLines = vscode_1.workspace.getConfiguration().get('VBI.formatter.allowedNumberOfEmptyLines');
    if (exports.config.allowedNumberOfEmptyLines < 0 || exports.config.allowedNumberOfEmptyLines > 50) {
        exports.config.allowedNumberOfEmptyLines = 1;
    }
    //misk
    exports.config.RemoveEmptyLines = vscode_1.workspace.getConfiguration().get('VBI.formatter.RemoveEmptyLines');
    exports.config.EmptyLinesAlsoInComment = vscode_1.workspace.getConfiguration().get('VBI.formatter.EmptyLinesAlsoInComment');
    exports.config.KeywordUppercaseAlsoInComment = vscode_1.workspace.getConfiguration().get('VBI.formatter.KeywordUppercaseAlsoInComment');
    exports.config.AllowInlineIFClause = vscode_1.workspace.getConfiguration().get('VBI.formatter.AllowInlineIFClause');
    //log this
    console.log('getConfig():', exports.config);
    return exports.config;
}
exports.getConfig = getConfig;
/**
 * @param cat Type String --> define Cathegory [info,warn,error]
 * @param o   Rest Parameter, Type Any --> Data to Log
 */
exports.info = vscode.window.createOutputChannel("VBI-Info");
function log(cat, ...o) {
    function mapObject(obj) {
        switch (typeof obj) {
            case 'undefined':
                return 'undefined';
            case 'object':
                let ret = '';
                for (const [key, value] of Object.entries(obj)) {
                    ret += (`${key}: ${value}\n`);
                }
                return ret;
            default:
                return obj; //function,symbol,boolean
        }
    }
    if (exports.config.debug) {
        if (exports.config.debugToChannel) {
            switch (cat.toLowerCase()) {
                case 'info':
                    //info.appendLine('INFO:');
                    o.map((args) => {
                        exports.info.appendLine('INFO:' + mapObject(args));
                    });
                    exports.info.show();
                    return;
                case 'warn':
                    //info.appendLine('WARN:');
                    o.map((args) => {
                        exports.info.appendLine('WARN:' + mapObject(args));
                    });
                    exports.info.show();
                    return;
                case 'error':
                    let err = '';
                    //info.appendLine('ERROR: ');
                    //err += mapObject(cat) + ": \r\n";
                    o.map((args) => {
                        err += mapObject(args);
                    });
                    exports.info.appendLine(err);
                    vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
                    exports.info.show();
                    return;
                default:
                    //info.appendLine('INFO-Other:');
                    //info.appendLine('INFO-Other:' + mapObject(cat));
                    o.map((args) => {
                        exports.info.appendLine('INFO-Other:' + mapObject(args));
                    });
                    exports.info.show();
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
exports.log = log;
//# sourceMappingURL=functions.js.map