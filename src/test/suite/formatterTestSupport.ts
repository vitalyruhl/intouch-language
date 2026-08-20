import {
	FormatOptions,
	formatQuickScript,
	formatQuickScriptLexically,
	formatQuickScriptStructure,
} from '@intouch-language/core';

export const config: FormatOptions = {
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

export function getConfig(): FormatOptions {
	return { ...config };
}

export function preFormat(text: string, options: FormatOptions = config): string {
	return formatQuickScriptLexically(text, options).text;
}

export function formatNestings(text: string, options: FormatOptions = config): string {
	return formatQuickScriptStructure(text, options).text;
}

export function fullFormatPipeline(text: string, options: FormatOptions = config): string {
	return formatQuickScript(text, options).text;
}
