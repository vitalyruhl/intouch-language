"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.info = exports.getConfig = exports.formatCmd = exports.formatTE = exports.config = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
exports.config = {};
// Inline Character Constants
const TAB = "\t";
const CRLF = "\r\n";
const DQUOTE = '\"';
const SQUOTE = "\'";
const BACKSLASH = "\\";
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
    let content = '';
    let activeEditor = vscode_1.window.activeTextEditor;
    let regex;
    if (!activeEditor) {
        return '';
    }
    let document = activeEditor.document;
    //first Step - get the config
    exports.config = getConfig();
    // Remoove EmptyLines...
    let nEL = exports.config.allowedNumberOfEmptyLines + 1.0;
    if (exports.config.EmptyLinesAlsoInComment) {
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
    formatted = toUpperRegEx(regex, content); /*24.10.2021/todo: not in Comment!!!*/
    log("info", formatted);
    //All Hermes-System-Variable
    regex = /(\\b(SYS_|MA_|SMEL_|HER_)\\w*)/gmi;
    formatted = toUpperRegEx(regex, content);
    log("info", formatted);
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
function toUpperRegEx(regex, str) {
    return str.replace(regex, c => c.toUpperCase());
}
function PerformRegex(document, range, regex, replace) {
    let content = document.getText(range); //get actual document text...
    return content.replace(regex, replace); //test format comments
}
function getConfig() {
    //debug
    exports.config.debug = vscode_1.workspace.getConfiguration().get('VBI.formatter.debug');
    exports.config.debugToChannel = vscode_1.workspace.getConfiguration().get('VBI.formatter.debugToChannel');
    //Leve emty Lines
    exports.config.allowedNumberOfEmptyLines = vscode_1.workspace.getConfiguration().get('VBI.formatter.allowedNumberOfEmptyLines');
    if (exports.config.allowedNumberOfEmptyLines < 0 || exports.config.allowedNumberOfEmptyLines > 50) {
        exports.config.allowedNumberOfEmptyLines = 1;
    }
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
                    exports.info.appendLine('INFO:');
                    o.map((args) => {
                        exports.info.appendLine('' + mapObject(args));
                    });
                    exports.info.show();
                    return;
                case 'warn':
                    exports.info.appendLine('WARN:');
                    o.map((args) => {
                        exports.info.appendLine('' + mapObject(args));
                    });
                    exports.info.show();
                    return;
                case 'error':
                    let err = '';
                    exports.info.appendLine('ERROR: ');
                    //err += mapObject(cat) + ": \r\n";
                    o.map((args) => {
                        err += mapObject(args);
                    });
                    exports.info.appendLine(err);
                    vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
                    exports.info.show();
                    return;
                default:
                    exports.info.appendLine('INFO-Other:');
                    exports.info.appendLine(mapObject(cat));
                    o.map((args) => {
                        exports.info.appendLine('' + mapObject(args));
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