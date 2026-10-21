import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '.local/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        HTMLImageElement: 'readonly',
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Response: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  {
    files: ['**/*.astro/*.js'],
    languageOptions: {
      globals: { document: 'readonly', localStorage: 'readonly' },
    },
  },
  prettier,
];
