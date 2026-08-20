import {
	ProposedFeatures,
	createConnection,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	ServerSettings,
	completionsFor,
	definitionFor,
	diagnosticsFor,
	formattingEdits,
	hoverFor,
	referencesFor,
	serverCapabilities,
	symbolsFor,
} from './features';
import { formattingSettings, readSettings } from './settings';
import { WorkspaceFunctionIndex } from './workspaceFunctions';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const workspaceFunctions = new WorkspaceFunctionIndex();
let settings: ServerSettings = {};
let workspaceFolders: string[] = [];

function publishDiagnostics(document: TextDocument): void {
	connection.sendDiagnostics({
		uri: document.uri,
		diagnostics: diagnosticsFor(document, workspaceFunctions.knownFunctionNames()),
	});
}

function republishOpenDocuments(): void {
	for (const document of documents.all()) {
		publishDiagnostics(document);
	}
}

async function quickFunctionSources(folder: string): Promise<string[]> {
	const sources: string[] = [];
	const entries = await fs.readdir(folder, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === '.git' || entry.name === 'node_modules') {
			continue;
		}
		const candidate = path.join(folder, entry.name);
		if (entry.isDirectory()) {
			sources.push(...await quickFunctionSources(candidate));
		} else if (entry.isFile() && /\.vbi?$/i.test(entry.name)) {
			sources.push(await fs.readFile(candidate, 'utf8'));
		}
	}
	return sources;
}

async function refreshWorkspaceFunctions(folders: readonly string[]): Promise<void> {
	try {
		const sources = (await Promise.all(folders.map(quickFunctionSources))).flat();
		workspaceFunctions.replaceWorkspaceSources(sources);
		republishOpenDocuments();
	} catch {
		// Keep diagnostics available for open documents when a workspace file cannot be read.
	}
}

connection.onInitialize(params => {
	const folders = params.workspaceFolders?.map(folder => folder.uri)
		?? (params.rootUri === null || params.rootUri === undefined ? [] : [params.rootUri]);
	workspaceFolders = folders
		.filter(uri => uri.startsWith('file:'))
		.map(uri => fileURLToPath(uri));
	void refreshWorkspaceFunctions(workspaceFolders);
	return serverCapabilities();
});
connection.onInitialized(async () => {
	const vbi = await connection.workspace.getConfiguration({ section: 'VBI' });
	settings = readSettings({ VBI: vbi });
	republishOpenDocuments();
});
connection.onDidChangeConfiguration(change => {
	settings = readSettings(change.settings);
	republishOpenDocuments();
});
connection.onDidChangeWatchedFiles(() => {
	void refreshWorkspaceFunctions(workspaceFolders);
});
documents.onDidOpen(change => {
	workspaceFunctions.updateDocument(change.document);
	publishDiagnostics(change.document);
});
documents.onDidChangeContent(change => {
	workspaceFunctions.updateDocument(change.document);
	publishDiagnostics(change.document);
});
documents.onDidClose(change => {
	workspaceFunctions.removeDocument(change.document.uri);
	connection.sendDiagnostics({ uri: change.document.uri, diagnostics: [] });
	republishOpenDocuments();
});

connection.onDocumentFormatting(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? [] : formattingEdits(document, formattingSettings(settings, params.options));
});
connection.onDocumentSymbol(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? [] : symbolsFor(document);
});
connection.onDefinition(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? undefined : definitionFor(document, params.position);
});
connection.onReferences(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? [] : referencesFor(document, params.position, params.context.includeDeclaration);
});
connection.onCompletion(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? [] : completionsFor(document);
});
connection.onHover(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? undefined : hoverFor(document, params.position);
});
connection.onShutdown(() => undefined);

documents.listen(connection);
connection.listen();
