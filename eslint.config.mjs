import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';

export default [
	{
		ignores: [
			'**/*.js',
			'.Temp/**',
			'.projectatlas/**',
			'.serena/**',
			'.vscode-test/**',
			'dist/**',
			'node_modules/**',
			'out/**',
		],
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: typescriptEslintParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': typescriptEslintPlugin,
		},
		rules: {
			...typescriptEslintPlugin.configs.recommended.rules,
		},
	},
	{
		files: ['scripts/**/*.ts', 'src/**/*.ts', 'src/**/*.tsx'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
		},
	},
];
