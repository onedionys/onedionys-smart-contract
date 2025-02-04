import globals from 'globals';
import pluginJs from '@eslint/js';
import mochaPlugin from 'eslint-plugin-mocha';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    mochaPlugin.configs.flat.recommended,
    {
        ignores: [
            '.editorconfig',
            '.npmrc',
            'angular.json',
            'ckeditor.config.js',
            'tsconfig.app.json',
            'tsconfig.json',
            'tsconfig.spec.json',
            'src/app/',
            'src/assets/',
            'src/environments/',
            'src/favicon.ico',
            'src/index.html',
            'src/main.ts',
            'src/polyfills.ts',
            'src/styles.scss',
            'src/test.ts',
            'src/typings.d.ts',
        ],
    },
];
