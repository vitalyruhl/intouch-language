import { quickFunctionNames } from '@intouch-language/core';
import { TextDocument } from 'vscode-languageserver-textdocument';

/** Tracks QuickFunctions from workspace files and the language server's open documents. */
export class WorkspaceFunctionIndex {
	private readonly workspaceNames = new Set<string>();
	private readonly openDocuments = new Map<string, string[]>();

	public replaceWorkspaceSources(sources: Iterable<string>): void {
		this.workspaceNames.clear();
		for (const source of sources) {
			for (const name of quickFunctionNames(source)) {
				this.workspaceNames.add(name);
			}
		}
	}

	public updateDocument(document: TextDocument): void {
		this.openDocuments.set(document.uri, quickFunctionNames(document.getText()));
	}

	public removeDocument(uri: string): void {
		this.openDocuments.delete(uri);
	}

	public knownFunctionNames(): string[] {
		const names = new Map<string, string>();
		for (const name of this.workspaceNames) names.set(name.toUpperCase(), name);
		for (const documentNames of this.openDocuments.values()) {
			for (const name of documentNames) names.set(name.toUpperCase(), name);
		}
		return [...names.values()];
	}
}
