import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import nodePlugin from 'eslint-plugin-n';
import jest from 'eslint-plugin-jest';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    js.configs.recommended,

    {
        files: ['**/*.ts'],
        extends: tseslint.configs.recommendedTypeChecked,
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        plugins: {
            'unused-imports': unusedImports,
            n: nodePlugin,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            'n/no-missing-import': 'off',
            'no-console': 'off',
        },
    },

    {
        files: ['**/*.spec.ts', '**/*.test.ts'],
        plugins: { jest },
        rules: {
            ...jest.configs['flat/recommended'].rules,
            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
        },
    },

    eslintConfigPrettier,
);
