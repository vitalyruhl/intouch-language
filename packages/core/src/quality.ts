import { CoreDiagnostic, DiagnosticSeverity } from './parser';
import { SemanticModel } from './semantics';
import { Token, TokenKind } from './token';

export const QUALITY_DIAGNOSTIC_CODES = {
	nonAsciiIdentifier: 'quickscript.naming.nonAsciiIdentifier',
	windowWhitespace: 'quickscript.naming.windowWhitespace',
	windowNonAscii: 'quickscript.naming.windowNonAscii',
} as const;

export type QualityDiagnosticSeverity = DiagnosticSeverity | 'off';

export interface QualityDiagnosticSettings {
	nonAsciiIdentifiers?: QualityDiagnosticSeverity;
	windowWhitespace?: QualityDiagnosticSeverity;
	windowNonAscii?: QualityDiagnosticSeverity;
}

const ASCII_IDENTIFIER = /^[A-Za-z0-9_$#-]+$/;
const WINDOW_COMMANDS = new Set(['HIDE', 'SHOW']);
const WINDOW_FUNCTIONS = new Set([
	'HIDE',
	'INFOAPPSTATUS',
	'INFOAPPTITLEEXPAND',
	'MOVEWINDOW',
	'PRINTWINDOW',
	'SHOW',
	'SHOWAT',
	'SHOWTOPLEFTAT',
	'WINDOWSTATE',
]);

function significantTokens(model: SemanticModel): Token[] {
	return model.document.tokens.filter(token => ![
		TokenKind.Whitespace,
		TokenKind.Newline,
		TokenKind.Comment,
		TokenKind.EOF,
	].includes(token.kind));
}

function stringContent(token: Token): string {
	return token.lexeme.startsWith('"') && token.lexeme.endsWith('"')
		? token.lexeme.slice(1, -1)
		: token.lexeme.slice(1);
}

function windowNameTokens(model: SemanticModel): Token[] {
	const tokens = significantTokens(model);
	const windows: Token[] = [];
	for (let index = 0; index < tokens.length; index += 1) {
		const name = tokens[index].lexeme.toUpperCase();
		const previous = tokens[index - 1];
		if (previous?.lexeme === '.' || previous?.lexeme === '->') continue;
		if (WINDOW_COMMANDS.has(name) && tokens[index + 1]?.kind === TokenKind.String) {
			windows.push(tokens[index + 1]);
			continue;
		}
		if (WINDOW_FUNCTIONS.has(name)
			&& tokens[index + 1]?.lexeme === '('
			&& tokens[index + 2]?.kind === TokenKind.String) {
			windows.push(tokens[index + 2]);
		}
	}
	return windows;
}

function qualityDiagnostic(
	code: string,
	message: string,
	severity: QualityDiagnosticSeverity,
	tokenOrRange: Pick<Token, 'range'>,
): CoreDiagnostic | undefined {
	if (severity === 'off') return undefined;
	return { code, message, severity, range: tokenOrRange.range, source: 'intouch-quality' };
}

/** Analyze maintainability conventions without changing QuickScript validity or symbols. */
export function qualityDiagnostics(
	model: SemanticModel,
	settings: QualityDiagnosticSettings = {},
): CoreDiagnostic[] {
	const diagnostics: CoreDiagnostic[] = [];
	const diagnosedIdentifiers = new Set<string>();
	const identifierSeverity = settings.nonAsciiIdentifiers ?? 'warning';
	for (const identifier of model.identifiers) {
		const normalized = identifier.name.toUpperCase();
		if (ASCII_IDENTIFIER.test(identifier.name) || diagnosedIdentifiers.has(normalized)) continue;
		diagnosedIdentifiers.add(normalized);
		const diagnostic = qualityDiagnostic(
			QUALITY_DIAGNOSTIC_CODES.nonAsciiIdentifier,
			`Avoid non-ASCII characters in identifier '${identifier.name}'.`,
			identifierSeverity,
			identifier,
		);
		if (diagnostic !== undefined) diagnostics.push(diagnostic);
	}

	for (const token of windowNameTokens(model)) {
		const content = stringContent(token);
		if (/\s/u.test(content)) {
			const diagnostic = qualityDiagnostic(
				QUALITY_DIAGNOSTIC_CODES.windowWhitespace,
				'Avoid whitespace in window names.',
				settings.windowWhitespace ?? 'warning',
				token,
			);
			if (diagnostic !== undefined) diagnostics.push(diagnostic);
		}
		if (/[^\x00-\x7f]/u.test(content)) {
			const diagnostic = qualityDiagnostic(
				QUALITY_DIAGNOSTIC_CODES.windowNonAscii,
				'Avoid non-ASCII characters in window names.',
				settings.windowNonAscii ?? 'warning',
				token,
			);
			if (diagnostic !== undefined) diagnostics.push(diagnostic);
		}
	}
	return diagnostics;
}
