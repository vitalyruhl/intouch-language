"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
// Use pure pipeline from compiled sources (no vscode dependency)
let pure;
try {
    pure = require('@intouch-language/core');
} catch (e) {
    console.error('Could not load out/formatCore.js. Run npm run compile first.', e);
    process.exit(1);
}

function getConfigFallback() { return { allowedNumberOfEmptyLines:1, removeEmptyLines:true, removeEmptyLinesInComments:false, blockCodeBegin:'{>', blockCodeEnd:'{<', blockCodeExclude:'{#', regionBlockCodeBegin:'{region', regionBlockCodeEnd:'{endregion', regionBlockCodeExclude:'{#', insertSpaces:true, indentSize:4 }; }
 (function main() {
    try {
        const config = getConfigFallback();
    const baseDir = path.join(__dirname, '..', 'src', 'test', 'suite', 'testfiles');
    if (!fs.existsSync(baseDir)) {
        console.error('testfiles directory not found:', baseDir);
        process.exit(1);
    }
    const entries = fs.readdirSync(baseDir).filter(f => f.endsWith('.test.vbi'));
    let changed = 0;
    for (const testFile of entries) {
        const testPath = path.join(baseDir, testFile);
        const expectedPath = path.join(baseDir, testFile.replace('.test.vbi', '.tobe.vbi'));
        const input = fs.readFileSync(testPath, 'utf8');
        const stage2 = pure.formatQuickScript(input, config).text;
        if (fs.existsSync(expectedPath)) {
            const old = fs.readFileSync(expectedPath, 'utf8');
            if (old !== stage2) {
                fs.writeFileSync(expectedPath, stage2, 'utf8');
                console.log('Updated fixture:', path.basename(expectedPath));
                changed++;
            }
        }
        else {
            fs.writeFileSync(expectedPath, stage2, 'utf8');
            console.log('Created missing fixture:', path.basename(expectedPath));
            changed++;
        }
    }
        console.log(`Fixture update complete. Changed: ${changed}`);
    } catch (e) {
        console.error('Fixture update failed:', e);
        process.exit(1);
    }
})();
//# sourceMappingURL=update-fixtures.js.map
