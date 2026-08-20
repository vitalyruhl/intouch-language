import { CoreDiagnostic } from './parser';
import { Range, SourceSpan, sourceRange } from './source';
import { Token, TokenKind } from './token';
import { tokenize } from './tokenizer';

export type QuickScriptScriptType =
	| 'QuickFunction'
	| 'DataChange'
	| 'Condition'
	| 'Application'
	| 'Window'
	| 'KeyScript'
	| 'Generic'
	| 'Unknown';

export type WindowEvent = 'OnShow' | 'WhileRunning' | 'OnClose';
export type MetadataSourceKind = 'explicit' | 'legacy' | 'export' | 'filename' | 'none';

export interface QuickScriptParameterMetadata {
	name: string;
	datatype: string;
	description?: string;
	range: Range;
	nameRange: Range;
	datatypeRange: Range;
}

export interface QuickScriptDocumentMetadata {
	scriptType: QuickScriptScriptType;
	name?: string;
	nameRange?: Range;
	event?: string;
	eventRange?: Range;
	trigger?: string;
	triggerRange?: Range;
	shortcut?: string;
	shortcutRange?: Range;
	description?: string;
	descriptionRange?: Range;
	parameters: QuickScriptParameterMetadata[];
	returnType?: string;
	returnTypeRange?: Range;
	metadataSource: MetadataSourceKind;
	legacyScriptType?: string;
	diagnostics: CoreDiagnostic[];
}

export interface MetadataExtractionOptions {
	fileName?: string;
	/** Reuse the canonical token stream when extraction is part of semantic analysis. */
	tokens?: readonly Token[];
}

interface LocatedValue<T> {
	value: T;
	raw: string;
	range: Range;
	span: SourceSpan;
	source: Exclude<MetadataSourceKind, 'none'>;
}

interface MetadataCandidates {
	scriptTypes: LocatedValue<QuickScriptScriptType>[];
	names: LocatedValue<string>[];
	events: LocatedValue<string>[];
	triggers: LocatedValue<string>[];
	shortcuts: LocatedValue<string>[];
	descriptions: LocatedValue<string>[];
	returnTypes: LocatedValue<string>[];
	explicitParameters: QuickScriptParameterMetadata[];
	legacyParameters: QuickScriptParameterMetadata[];
	legacyScriptType?: string;
}

const IDENTIFIER = '[\\p{L}_$#][\\p{L}\\p{N}_$#-]*';
const EXPLICIT_FIELD = /^[ \t]*@([A-Za-z]+)(?:[ \t]+([^\r\n]*?))?[ \t]*$/gmu;
const LEGACY_FIELD = /^[ \t]*(Type|Name|Description|Trigger|Event|Shortcut|Returns?|Tagname\[\.field\]|Condition|Condition Type)[ \t]*:[ \t]*([^\r\n]*?)[ \t]*$/gimu;
const LEGACY_PARAMETER = new RegExp(`^[ \\t]*(DISCRETE|INTEGER|MESSAGE|REAL)[ \\t]+(${IDENTIFIER})(?:[ \\t]+([^\\r\\n]*?))?[ \\t]*$`, 'gimu');
const SCRIPT_TYPE_NAMES: Readonly<Record<string, QuickScriptScriptType>> = {
	quickfunction: 'QuickFunction',
	datachange: 'DataChange',
	condition: 'Condition',
	conditionalscript: 'Condition',
	application: 'Application',
	applicationscript: 'Application',
	window: 'Window',
	windowscript: 'Window',
	keyscript: 'KeyScript',
	generic: 'Generic',
};
const WINDOW_EVENTS: Readonly<Record<string, WindowEvent>> = {
	onshow: 'OnShow',
	whilerunning: 'WhileRunning',
	onclose: 'OnClose',
};
const KNOWN_FIELDS = new Set(['scripttype', 'name', 'description', 'event', 'trigger', 'shortcut', 'param', 'returns']);

function metadataDiagnostic(code: string, message: string, range: Range, severity: CoreDiagnostic['severity'] = 'warning'): CoreDiagnostic {
	return { code, message, severity, range, source: 'intouch-metadata' };
}

function locatedValue<T>(source: string, token: Token, match: RegExpMatchArray, raw: string, value: T, sourceKind: 'explicit' | 'legacy'): LocatedValue<T> {
	const matchStart = match.index ?? 0;
	const valueStart = matchStart + match[0].lastIndexOf(raw);
	const located = sourceRange(source, {
		start: token.span.start + valueStart,
		end: token.span.start + valueStart + raw.length,
	});
	return { value, raw, ...located, source: sourceKind };
}

function normalizeScriptType(raw: string): QuickScriptScriptType | undefined {
	return SCRIPT_TYPE_NAMES[raw.replace(/[ \t_-]+/g, '').toLowerCase()];
}

function normalizeWindowEvent(raw: string): WindowEvent | undefined {
	return WINDOW_EVENTS[raw.replace(/[ \t_-]+/g, '').toLowerCase()];
}

function valueEquals(left: unknown, right: unknown): boolean {
	return typeof left === 'string' && typeof right === 'string'
		? left.localeCompare(right, 'en', { sensitivity: 'base' }) === 0
		: left === right;
}

function selectValue<T>(
	label: string,
	explicit: readonly LocatedValue<T>[],
	legacy: readonly LocatedValue<T>[],
	diagnostics: CoreDiagnostic[],
): LocatedValue<T> | undefined {
	const preferred = explicit[0] ?? legacy[0];
	if (preferred === undefined) return undefined;
	for (const duplicate of [...explicit.slice(1), ...legacy]) {
		if (!valueEquals(preferred.value, duplicate.value)) {
			diagnostics.push(metadataDiagnostic(
				'metadata-conflict',
				`${label} '${duplicate.raw}' conflicts with higher-priority ${preferred.source} metadata '${preferred.raw}'.`,
				duplicate.range,
			));
		}
	}
	return preferred;
}

function parseExplicitFields(source: string, token: Token, candidates: MetadataCandidates, diagnostics: CoreDiagnostic[]): void {
	for (const match of token.lexeme.matchAll(EXPLICIT_FIELD)) {
		const field = match[1];
		const raw = (match[2] ?? '').trim();
		const normalizedField = field.toLowerCase();
		const fieldStart = token.span.start + (match.index ?? 0) + match[0].indexOf(`@${field}`) + 1;
		const fieldRange = sourceRange(source, { start: fieldStart, end: fieldStart + field.length }).range;
		if (!KNOWN_FIELDS.has(normalizedField)) {
			diagnostics.push(metadataDiagnostic(
				'unknown-metadata-field',
				`Unknown QuickScript metadata field '@${field}'.`,
				fieldRange,
				'information',
			));
			continue;
		}
		if (raw.length === 0) {
			diagnostics.push(metadataDiagnostic('invalid-metadata-value', `Metadata field '@${field}' requires a value.`, fieldRange));
			continue;
		}
		if (normalizedField === 'scripttype') {
			const scriptType = normalizeScriptType(raw);
			const value = locatedValue(source, token, match, raw, scriptType ?? 'Unknown', 'explicit');
			if (scriptType === undefined) {
				diagnostics.push(metadataDiagnostic('invalid-script-type', `Unknown QuickScript script type '${raw}'.`, value.range));
			} else {
				candidates.scriptTypes.push(value);
			}
			continue;
		}
		if (normalizedField === 'param') {
			const parameter = raw.match(new RegExp(`^(${IDENTIFIER})[ \\t]+(DISCRETE|INTEGER|MESSAGE|REAL)(?:[ \\t]+([\\s\\S]*))?$`, 'iu'));
			const value = locatedValue(source, token, match, raw, raw, 'explicit');
			if (parameter === null) {
				diagnostics.push(metadataDiagnostic('invalid-metadata-value', `Metadata field '@Param' must use '@Param Name TYPE Description...'.`, value.range));
				continue;
			}
			const nameOffset = value.span.start + raw.indexOf(parameter[1]);
			const datatypeOffset = value.span.start + raw.indexOf(parameter[2], parameter[1].length);
			candidates.explicitParameters.push({
				name: parameter[1],
				datatype: parameter[2].toUpperCase(),
				description: parameter[3]?.trim() || undefined,
				range: value.range,
				nameRange: sourceRange(source, { start: nameOffset, end: nameOffset + parameter[1].length }).range,
				datatypeRange: sourceRange(source, { start: datatypeOffset, end: datatypeOffset + parameter[2].length }).range,
			});
			continue;
		}
		const value = locatedValue(source, token, match, raw, raw, 'explicit');
		switch (normalizedField) {
			case 'name': candidates.names.push(value); break;
			case 'description': candidates.descriptions.push(value); break;
			case 'event': candidates.events.push(value); break;
			case 'trigger': candidates.triggers.push(value); break;
			case 'shortcut': candidates.shortcuts.push(value); break;
			case 'returns': candidates.returnTypes.push({ ...value, value: raw.toUpperCase() }); break;
		}
	}
}

function legacyParameterSection(token: Token): { text: string; start: number } | undefined {
	const section = token.lexeme.match(/\bParameters\s*:\s*([\s\S]*?)(?:\r?\n[ \t]*\r?\n|\bUsage\s*:|\bVersion\s+history\s*:|\{<|$)/iu);
	if (section === null) return undefined;
	const start = (section.index ?? 0) + section[0].indexOf(section[1]);
	return { text: section[1], start };
}

function parseLegacyFields(source: string, token: Token, candidates: MetadataCandidates): void {
	for (const match of token.lexeme.matchAll(LEGACY_FIELD)) {
		const label = match[1].toLowerCase();
		const raw = match[2].trim();
		if (raw.length === 0) continue;
		if (label === 'type') {
			candidates.legacyScriptType ??= raw;
			const scriptType = normalizeScriptType(raw);
			candidates.scriptTypes.push(locatedValue(source, token, match, raw, scriptType ?? 'Unknown', 'legacy'));
			continue;
		}
		const value = locatedValue(source, token, match, raw, raw, 'legacy');
		switch (label) {
			case 'name': candidates.names.push(value); break;
			case 'description': candidates.descriptions.push(value); break;
			case 'event': candidates.events.push(value); break;
			case 'trigger': candidates.triggers.push(value); break;
			case 'shortcut': candidates.shortcuts.push(value); break;
			case 'tagname[.field]': candidates.triggers.push(value); break;
			case 'condition': candidates.triggers.push(value); break;
			case 'condition type': candidates.events.push(value); break;
			case 'return':
			case 'returns': candidates.returnTypes.push({ ...value, value: raw.toUpperCase() }); break;
		}
	}
	const section = legacyParameterSection(token);
	if (section === undefined) return;
	for (const match of section.text.matchAll(LEGACY_PARAMETER)) {
		const datatype = match[1];
		const name = match[2];
		const lineStart = section.start + (match.index ?? 0);
		const datatypeStart = token.span.start + lineStart + match[0].indexOf(datatype);
		const nameStart = token.span.start + lineStart + match[0].indexOf(name, match[0].indexOf(datatype) + datatype.length);
		candidates.legacyParameters.push({
			name,
			datatype: datatype.toUpperCase(),
			description: match[3]?.trim() || undefined,
			range: sourceRange(source, { start: datatypeStart, end: token.span.start + lineStart + match[0].trimEnd().length }).range,
			nameRange: sourceRange(source, { start: nameStart, end: nameStart + name.length }).range,
			datatypeRange: sourceRange(source, { start: datatypeStart, end: datatypeStart + datatype.length }).range,
		});
	}
}

function isStructuredLegacyComment(text: string): boolean {
	if (/^[ \t]*Script[ \t]*:[ \t]*$/imu.test(text)) return true;
	const hasType = /^[ \t]*Type[ \t]*:[ \t]*[^\r\n]+$/imu.test(text);
	const hasIdentity = /^[ \t]*(?:Name|Tagname\[\.field\]|Condition)[ \t]*:[ \t]*[^\r\n]+$/imu.test(text);
	return hasType && hasIdentity;
}

function filenameFallback(fileName: string | undefined): { scriptType: QuickScriptScriptType; name: string } | undefined {
	if (fileName === undefined) return undefined;
	const stem = fileName.replace(/^.*[\\/]/, '').replace(/\.(?:vbi|vi)$/i, '').replace(/_\d+(?:\.\d+){1,3}$/i, '');
	for (const [prefix, scriptType] of [
		['QF_', 'QuickFunction'],
		['DCH_', 'DataChange'],
		['CS_', 'Condition'],
		['APP_', 'Application'],
		['KEY_', 'KeyScript'],
	] as const) {
		if (stem.toUpperCase().startsWith(prefix)) {
			return { scriptType, name: stem.slice(prefix.length) };
		}
	}
	return undefined;
}

/** Extract canonical document metadata exclusively from comment tokens plus an optional filename fallback. */
export function extractDocumentMetadata(source: string, options: MetadataExtractionOptions = {}): QuickScriptDocumentMetadata {
	const diagnostics: CoreDiagnostic[] = [];
	const candidates: MetadataCandidates = {
		scriptTypes: [],
		names: [],
		events: [],
		triggers: [],
		shortcuts: [],
		descriptions: [],
		returnTypes: [],
		explicitParameters: [],
		legacyParameters: [],
	};
	const comments = (options.tokens ?? tokenize(source)).filter(token => token.kind === TokenKind.Comment);
	for (const token of comments) {
		parseExplicitFields(source, token, candidates, diagnostics);
		if (isStructuredLegacyComment(token.lexeme)) parseLegacyFields(source, token, candidates);
	}

	const explicit = <T>(values: readonly LocatedValue<T>[]): LocatedValue<T>[] => values.filter(value => value.source === 'explicit');
	const legacy = <T>(values: readonly LocatedValue<T>[]): LocatedValue<T>[] => values.filter(value => value.source === 'legacy');
	const scriptType = selectValue('Script type', explicit(candidates.scriptTypes), legacy(candidates.scriptTypes), diagnostics);
	const name = selectValue('Name', explicit(candidates.names), legacy(candidates.names), diagnostics);
	const event = selectValue('Event', explicit(candidates.events), legacy(candidates.events), diagnostics);
	const trigger = selectValue('Trigger', explicit(candidates.triggers), legacy(candidates.triggers), diagnostics);
	const shortcut = selectValue('Shortcut', explicit(candidates.shortcuts), legacy(candidates.shortcuts), diagnostics);
	const description = selectValue('Description', explicit(candidates.descriptions), legacy(candidates.descriptions), diagnostics);
	const returnType = selectValue('Return type', explicit(candidates.returnTypes), legacy(candidates.returnTypes), diagnostics);
	const parameters = candidates.explicitParameters.length > 0 ? candidates.explicitParameters : candidates.legacyParameters;
	if (candidates.explicitParameters.length > 0 && candidates.legacyParameters.length > 0) {
		const signature = (items: readonly QuickScriptParameterMetadata[]): string => items
			.map(parameter => `${parameter.name.toUpperCase()}:${parameter.datatype.toUpperCase()}`)
			.join(',');
		if (signature(candidates.explicitParameters) !== signature(candidates.legacyParameters)) {
			diagnostics.push(metadataDiagnostic(
				'metadata-conflict',
				'Legacy parameter metadata conflicts with higher-priority explicit @Param metadata.',
				candidates.legacyParameters[0].range,
			));
		}
	}
	const fallback = filenameFallback(options.fileName);
	const resolvedScriptType = scriptType?.value ?? fallback?.scriptType ?? 'Generic';
	const resolvedName = name?.value ?? fallback?.name;

	let resolvedEvent = event?.value;
	if (resolvedScriptType === 'Window' && event !== undefined) {
		const normalized = normalizeWindowEvent(event.value);
		if (normalized === undefined) {
			diagnostics.push(metadataDiagnostic('invalid-window-event', `Unknown Window script event '${event.value}'.`, event.range));
			resolvedEvent = undefined;
		} else {
			resolvedEvent = normalized;
		}
	} else if (event !== undefined && !['Application', 'Condition'].includes(resolvedScriptType)) {
		diagnostics.push(metadataDiagnostic('metadata-conflict', `Event metadata is not supported for ${resolvedScriptType} scripts.`, event.range));
	}
	if (resolvedScriptType === 'Window' && returnType !== undefined) {
		diagnostics.push(metadataDiagnostic('metadata-conflict', 'Window scripts cannot declare a return type.', returnType.range));
	}

	const metadataSources: MetadataSourceKind[] = [scriptType, name, event, trigger, shortcut, description, returnType]
		.flatMap(value => value === undefined ? [] : [value.source]);
	if (candidates.explicitParameters.length > 0) metadataSources.push('explicit');
	else if (candidates.legacyParameters.length > 0) metadataSources.push('legacy');
	const metadataSource: MetadataSourceKind = metadataSources.includes('explicit')
		? 'explicit'
		: metadataSources.includes('legacy')
			? 'legacy'
			: fallback === undefined ? 'none' : 'filename';

	return {
		scriptType: resolvedScriptType,
		name: resolvedName,
		nameRange: name?.range,
		event: resolvedEvent,
		eventRange: event?.range,
		trigger: trigger?.value,
		triggerRange: trigger?.range,
		shortcut: shortcut?.value,
		shortcutRange: shortcut?.range,
		description: description?.value,
		descriptionRange: description?.range,
		parameters,
		returnType: returnType?.value,
		returnTypeRange: returnType?.range,
		metadataSource,
		legacyScriptType: candidates.legacyScriptType,
		diagnostics,
	};
}
