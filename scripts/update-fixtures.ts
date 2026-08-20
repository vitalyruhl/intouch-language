import * as fs from 'fs';
import * as path from 'path';

import { FormatOptions, formatQuickScript } from '@intouch-language/core';

const config: FormatOptions = {
	allowedNumberOfEmptyLines: 1,
	removeEmptyLines: true,
	removeEmptyLinesInComments: false,
	blockCodeBegin: '{>',
	blockCodeEnd: '{<',
	blockCodeExclude: '{#',
	regionBlockCodeBegin: '{region',
	regionBlockCodeEnd: '{endregion',
	regionBlockCodeExclude: '{#',
	insertSpaces: true,
	indentSize: 4,
};

(function main(): void {
	const baseDir = path.join(__dirname, '..', 'src', 'test', 'suite', 'testfiles');
	if (!fs.existsSync(baseDir)) {
		throw new Error(`testfiles directory not found: ${baseDir}`);
	}
	const entries = fs.readdirSync(baseDir).filter(file => file.endsWith('.test.vbi'));
	let changed = 0;
	for (const testFile of entries) {
		const testPath = path.join(baseDir, testFile);
		const expectedPath = path.join(baseDir, testFile.replace('.test.vbi', '.tobe.vbi'));
		const formatted = formatQuickScript(fs.readFileSync(testPath, 'utf8'), config).text;
		if (!fs.existsSync(expectedPath) || fs.readFileSync(expectedPath, 'utf8') !== formatted) {
			fs.writeFileSync(expectedPath, formatted, 'utf8');
			console.log(`${fs.existsSync(expectedPath) ? 'Updated' : 'Created'} fixture:`, path.basename(expectedPath));
			changed += 1;
		}
	}
	console.log(`Fixture update complete. Changed: ${changed}`);
})();
