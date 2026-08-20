'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc },
	};
	const clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ scheme: 'file', language: 'intouch' },
			{ scheme: 'untitled', language: 'intouch' },
		],
		synchronize: { configurationSection: 'VBI' },
	};

	client = new LanguageClient(
		'intouchLanguageServer',
		'InTouch QuickScript Language Server',
		serverOptions,
		clientOptions,
	);
	context.subscriptions.push(client);
	context.subscriptions.push(vscode.commands.registerCommand('vbi-format', async () => {
		await vscode.commands.executeCommand('editor.action.formatDocument');
	}));
	await client.start();
}

export async function deactivate(): Promise<void> {
	if (client !== undefined) {
		await client.stop();
		client = undefined;
	}
}
