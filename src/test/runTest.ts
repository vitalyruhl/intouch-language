import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// Codex and VS Code extension hosts set this for their own child processes.
		// The test runner must launch Code as Electron, not as a Node.js process.
		delete process.env.ELECTRON_RUN_AS_NODE;

		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Test against the minimum VS Code version supported by the extension.
		await runTests({
			version: '1.104.0',
			extensionDevelopmentPath,
			extensionTestsPath,
		});
	} catch {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main()
