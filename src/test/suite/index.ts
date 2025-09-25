import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		reporter: 'list'
	});
	// mocha.useColors(true);
//ui: 'tdd',
	const testsRoot = path.resolve(__dirname, '..');
	//

	return new Promise(async (c, e) => {
		try {
			// Collect test files.
			// After compilation we have .js files in out/test/suite, but the source pattern was .test.ts.
			// We prefer .js (compiled) and fallback to .ts when executing uncompiled via ts-node.
			let files = await glob('./suite/**/*.test.js', { cwd: testsRoot });
			if (files.length === 0) {
				files = await glob('./suite/**/*.test.ts', { cwd: testsRoot });
			}
			if (files.length === 0) {
				console.warn('No test files found with patterns .test.js or .test.ts under', testsRoot);
			}
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
			console.log(`Discovered ${files.length} test file(s).`);

			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err as Error);
		}
	});
}
