import {
	FileChangeType,
	ProposedFeatures,
	createConnection,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
import { WorkspaceDocumentSource, WorkspaceSymbolIndex } from './workspaceSymbols';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const workspaceSymbols = new WorkspaceSymbolIndex();
let settings: ServerSettings = {};
let workspaceFolders: string[] = [];

function publishDiagnostics(document: TextDocument): void {
	connection.sendDiagnostics({
		uri: document.uri,
		diagnostics: diagnosticsFor(document, workspaceSymbols, settings),
	});
}

function republishOpenDocuments(): void {
	for (const document of documents.all()) {
		publishDiagnostics(document);
	}
}

async function quickScriptSources(folder: string): Promise<WorkspaceDocumentSource[]> {
	const sources: WorkspaceDocumentSource[] = [];
	const entries = await fs.readdir(folder, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === '.git' || entry.name === 'node_modules') {
			continue;
		}
		const candidate = path.join(folder, entry.name);
		if (entry.isDirectory()) {
			sources.push(...await quickScriptSources(candidate));
		} else if (entry.isFile() && /\.(?:vbi|vi)$/i.test(entry.name)) {
			sources.push({ uri: pathToFileURL(candidate).toString(), text: await fs.readFile(candidate, 'utf8') });
		}
	}
	return sources;
}

async function refreshWorkspaceSymbols(folders: readonly string[]): Promise<void> {
	try {
		const sources = (await Promise.all(folders.map(quickScriptSources))).flat();
		workspaceSymbols.replaceWorkspaceDocuments(sources);
		republishOpenDocuments();
	} catch {
		// Keep diagnostics available for open documents when a workspace file cannot be read.
	}
}

connection.onInitialize(async params => {
	const folders = params.workspaceFolders?.map(folder => folder.uri)
		?? (params.rootUri === null || params.rootUri === undefined ? [] : [params.rootUri]);
	workspaceFolders = folders
		.filter(uri => uri.startsWith('file:'))
		.map(uri => fileURLToPath(uri));
	await refreshWorkspaceSymbols(workspaceFolders);
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
connection.onDidChangeWatchedFiles(change => {
	void (async () => {
		for (const file of change.changes.filter(candidate => /\.(?:vbi|vi)$/i.test(candidate.uri))) {
			if (file.type === FileChangeType.Deleted) {
				workspaceSymbols.removeWorkspaceDocument(file.uri);
				continue;
			}
			try {
				workspaceSymbols.updateWorkspaceDocument({ uri: file.uri, text: await fs.readFile(fileURLToPath(file.uri), 'utf8') });
			} catch {
				workspaceSymbols.removeWorkspaceDocument(file.uri);
			}
		}
		republishOpenDocuments();
	})();
});
documents.onDidOpen(change => {
	workspaceSymbols.updateDocument(change.document);
	republishOpenDocuments();
});
documents.onDidChangeContent(change => {
	workspaceSymbols.updateDocument(change.document);
	republishOpenDocuments();
});
documents.onDidClose(change => {
	workspaceSymbols.removeDocument(change.document.uri);
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
	return document === undefined ? undefined : definitionFor(document, params.position, workspaceSymbols);
});
connection.onReferences(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? [] : referencesFor(document, params.position, params.context.includeDeclaration, workspaceSymbols);
});
connection.onCompletion(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? [] : completionsFor(document, workspaceSymbols);
});
connection.onHover(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? undefined : hoverFor(document, params.position, workspaceSymbols);
});
connection.onShutdown(() => undefined);

documents.listen(connection);
connection.listen();
