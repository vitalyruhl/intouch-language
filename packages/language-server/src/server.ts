import {
	ProposedFeatures,
	createConnection,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver';

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
import { readSettings } from './settings';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
let settings: ServerSettings = {};

connection.onInitialize(() => serverCapabilities());
connection.onDidChangeConfiguration(change => {
	settings = readSettings(change.settings);
	for (const document of documents.all()) {
		connection.sendDiagnostics({ uri: document.uri, diagnostics: diagnosticsFor(document) });
	}
});
documents.onDidOpen(change => connection.sendDiagnostics({ uri: change.document.uri, diagnostics: diagnosticsFor(change.document) }));
documents.onDidChangeContent(change => connection.sendDiagnostics({ uri: change.document.uri, diagnostics: diagnosticsFor(change.document) }));
documents.onDidClose(change => connection.sendDiagnostics({ uri: change.document.uri, diagnostics: [] }));

connection.onDocumentFormatting(params => {
	const document = documents.get(params.textDocument.uri);
	return document === undefined ? [] : formattingEdits(document, {
		...settings,
		insertSpaces: params.options.insertSpaces,
		indentSize: params.options.tabSize,
	});
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
