"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = exports.config = void 0;
exports.formatTE = formatTE;
exports.getConfig = getConfig;
exports.log = log;
exports.cloneArray = cloneArray;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const formats_1 = require("./formats");
const const_1 = require("./const");
exports.config = {};
function formatTE(range) {
    exports.config = getConfig();
    let document = vscode_1.window.activeTextEditor.document;
    const newText = format(range, document, exports.config);
    return [vscode.TextEdit.replace(range, newText)];
}
function format(range, document, config) {
    // PURE IMPLEMENTATION (Refactor 2025-09-14): No direct editor side-effects anymore.
    let regex;
    let formatted = document.getText(range);
    // 1. Keyword / Operator Formatting
    formatted = (0, formats_1.preFormat)(formatted, config);
    // 2. Nestings
    formatted = (0, formats_1.formatNestings)(formatted, config);
    // 3. Remove EmptyLines
    const nEL = (config.allowedNumberOfEmptyLines || 1) + 1.0;
    if (config.RemoveEmptyLines) {
        if (config.EmptyLinesAlsoInComment) {
            regex = new RegExp(`(?![^{]*})(^[\t]*$\r?\n){${nEL},}`, 'gm');
        }
        else {
            regex = new RegExp(`(^[\t]*$\r?\n){${nEL},}`, 'gm');
        }
        formatted = formatted.replace(regex, const_1.CRLF);
    }
    return formatted;
}
//----------------------------------------------------------------
//----------------------------------------------------------------
function getConfig() {
    //https://code.visualstudio.com/api/references/contribution-points
    //debug
    exports.config.debug = false; //workspace.getConfiguration().get('VBI.formatter.debug.active');
    exports.config.debugToChannel = true; //workspace.getConfiguration().get('VBI.formatter.debug.debugToChannel');
    //Live empty Lines
    exports.config.allowedNumberOfEmptyLines = vscode_1.workspace.getConfiguration().get('VBI.formatter.EmptyLine.allowedNumberOfEmptyLines');
    if (exports.config.allowedNumberOfEmptyLines < 0 || exports.config.allowedNumberOfEmptyLines > 50) {
        exports.config.allowedNumberOfEmptyLines = 1;
    }
    exports.config.RemoveEmptyLines = vscode_1.workspace.getConfiguration().get('VBI.formatter.EmptyLine.RemoveEmptyLines');
    exports.config.EmptyLinesAlsoInComment = vscode_1.workspace.getConfiguration().get('VBI.formatter.EmptyLine.EmptyLinesAlsoInComment');
    //codeblock-Nesting settings
    exports.config.BlockCodeBegin = vscode_1.workspace.getConfiguration().get('VBI.formatter.BC.BlockCodeBegin');
    exports.config.BlockCodeEnd = vscode_1.workspace.getConfiguration().get('VBI.formatter.BC.BlockCodeEnd');
    exports.config.BlockCodeExclude = vscode_1.workspace.getConfiguration().get('VBI.formatter.BC.BlockCodeExclude');
    //Region codeblock-Nesting settings
    exports.config.RegionBlockCodeBegin = vscode_1.workspace.getConfiguration().get('VBI.formatter.Region.BlockCodeBegin');
    exports.config.RegionBlockCodeEnd = vscode_1.workspace.getConfiguration().get('VBI.formatter.Region.BlockCodeEnd');
    exports.config.RegionBlockCodeExclude = vscode_1.workspace.getConfiguration().get('VBI.formatter.Region.BlockCodeExclude');
    //misc
    exports.config.ReplaceTabToSpaces = vscode_1.workspace.getConfiguration().get('VBI.formatter.Misc.ReplaceTabToSpaces');
    exports.config.IndentSize = vscode_1.workspace.getConfiguration().get('VBI.formatter.Misc.IndentSize');
    if (typeof exports.config.IndentSize !== 'number' || exports.config.IndentSize < 1 || exports.config.IndentSize > 10) {
        exports.config.IndentSize = 4;
    }
    if (typeof exports.config.ReplaceTabToSpaces !== 'boolean') {
        exports.config.ReplaceTabToSpaces = true; // fallback to default from package.json
    }
    //config.AllowInlineIFClause = workspace.getConfiguration().get('VBI.formatter.AllowInlineIFClause');
    //log this
    console.log('getConfig():', exports.config);
    return exports.config;
}
/**
 * @param cat Type String --> define Category [info,warn,error]
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
                    console.error('ERROR:', o);
                    return;
                default:
                    console.log('log:', cat, o);
                    return;
            }
        }
    }
    else if (cat.toLowerCase() === 'error') { // show Error in vc, and log it to console
        let err = '';
        o.map((args) => {
            err += mapObject(args);
        });
        console.error('ERROR:', o);
        vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
        return;
    }
}
function cloneArray(arr) {
    return [...arr];
}
//# sourceMappingURL=functions.js.map