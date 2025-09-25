"use strict";
// Delegation wrapper only – real formatting logic lives in formatCore.ts
// Single Source of Truth: modify formatting rules in formatCore.ts
// This file provides stable export names for the rest of the extension.
Object.defineProperty(exports, "__esModule", { value: true });
exports.preFormat = preFormat;
exports.formatNestings = formatNestings;
exports.fullFormatPipeline = fullFormatPipeline;
const formatCore_1 = require("./formatCore");
function preFormat(text, config) {
    return (0, formatCore_1.preFormat)(text, config);
}
function formatNestings(text, config) {
    return (0, formatCore_1.formatNestings)(text, config);
}
function fullFormatPipeline(text, config) {
    return (0, formatCore_1.pureFormatPipeline)(text, config);
}
// Note: If VSCode-specific logging or telemetry is needed later, inject it here
// without duplicating core logic.
//# sourceMappingURL=formats.js.map