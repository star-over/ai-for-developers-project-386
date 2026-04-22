import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tailwindcss from 'eslint-plugin-tailwindcss';
import importX from 'eslint-plugin-import-x';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  js.configs.recommended,
  ...ts.configs.strict,
  ...svelte.configs['flat/recommended'],
  ...tailwindcss.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['frontend/**/*.svelte', 'frontend/**/*.ts', 'frontend/**/*.js'],
  })),
  {
    files: ['frontend/**/*.svelte', 'frontend/**/*.ts', 'frontend/**/*.js'],
    rules: {
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/no-custom-classname': 'off',
    },
    settings: {
      tailwindcss: {
        callees: ['cn', 'clsx', 'tv'],
        config: resolve(__dirname, 'frontend/src/app.css'),
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    rules: {
      'svelte/no-unused-svelte-ignore': 'error',
      'svelte/require-each-key': 'error',
      'svelte/no-reactive-reassign': 'error',
      'svelte/no-target-blank': 'error',
      'svelte/no-at-html-tags': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.js', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parser: ts.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    rules: {
      // --- errors: ломают билд или вызывают баги ---
      'eqeqeq': 'error',
      'no-var': 'error',

      // --- warnings: стиль и качество кода ---
      'prefer-const': ['warn', { destructuring: 'all' }],
      'no-console': 'warn',

      // ts-strict overrides: style/quality → warn (не ломают билд)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-extraneous-class': 'warn',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn',
      '@typescript-eslint/unified-signatures': 'warn',
      '@typescript-eslint/no-useless-constructor': 'warn',
      '@typescript-eslint/prefer-literal-enum-member': 'warn',
    },
  },
  {
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: ['frontend/tsconfig.json', 'backend/tsconfig.json'],
          noWarnOnMultipleProjects: true,
        },
      },
    },
    rules: {
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': ['error', { maxDepth: 3 }],
    },
  },
  {
    ignores: [
      'node_modules/**',
      'frontend/node_modules/**',
      'backend/node_modules/**',
      'frontend/dist/**',
      'frontend/.vite/**',
      'frontend/src/lib/api/**',
      'spec/tsp-output/**',
      '.agents/**',
      '.claude/**',
    ],
  },
];
