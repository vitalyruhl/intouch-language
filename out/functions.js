"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.info = exports.getConfig = exports.format = exports.config = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
exports.config = {};
function format(editor, range) {
    let result = [];
    let formatted = '';
    let activeEditor = vscode_1.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    let document = activeEditor.document;
    //first Step - get the config
    exports.config = getConfig();
    // Remoove EmptyLines...
    let nEL = exports.config.allowedNumberOfEmptyLines + 1.0;
    console.log("nEL", nEL);
    let r = /(^[ \t]*$\r?\n){2,}/gm;
    //let rEL = new RegExp(`(^[\t]*$\r?\n){${nEL},}`,'gm' );
    //console.log("rEL",rEL);
    console.log("rEL", r);
    formatted = PerformRegex(document, range, r, "\r\n");
    console.log("ManageLinebreakes", formatted);
    if (formatted) {
        //result.push(new vscode.TextEdit(range, formatted));
        activeEditor.edit((editor) => {
            return editor.replace(range, formatted);
        });
    }
}
exports.format = format;
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