"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.info = exports.getConfig = exports.formatCmd = exports.formatTE = exports.config = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
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
    //--------------------------------------------------------------------------------//
    // Remoove EmptyLines...
    let nEL = exports.config.allowedNumberOfEmptyLines + 1.0;
    if (exports.config.EmptyLinesAlsoInComment) {
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
    let arr = ['-', '==', '=', '+', '-', '<', '>', '<>'];
    formatted = formatSpaceBeforeAfter(arr, formatted);
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
function formatSpaceBeforeAfter(arr, str) {
    arr.map(a => {
        let regex = new RegExp(`(?![^{]*})(^[\\s]${a})`, 'gm');
        return str.replace(regex, c => c.toUpperCase());
    });
    return str;
}
function toUpperRegEx(regex, str) {
    return str.replace(regex, c => c.toUpperCase());
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
    //misk
    exports.config.EmptyLinesAlsoInComment = vscode_1.workspace.getConfiguration().get('VBI.formatter.EmptyLinesAlsoInComment');
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