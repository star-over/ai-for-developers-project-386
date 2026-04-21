import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tailwindcss from 'eslint-plugin-tailwindcss';
import importX from 'eslint-plugin-import-x';

export default [
  js.configs.recommended,
  ...ts.configs.strict,
  ...svelte.configs['flat/recommended'],
  ...tailwindcss.configs['flat/recommended'],
  {
    rules: {
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/no-custom-classname': 'off',
    },
    settings: {
      tailwindcss: {
        callees: ['cn', 'clsx', 'tv'],
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
      'svelte/no-reactive-reassign': 'warn',
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
      'eqeqeq': 'error',
      'no-var': 'error',
      'prefer-const': ['warn', { destructuring: 'all' }],
      'no-console': 'warn',
      'no-unused-expressions': 'error',
    },
  },
  {
    plugins: { 'import-x': importX },
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
