import js from '@eslint/js';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

const nodeFiles = [
  'plugins/**/*.js',
  'config/**/*.js',
  'tools/**/*.js',
  'tests/**/*.js',
  'vite.config.js',
  'playwright.config.js',
  'site.config.js',
];

export default defineConfig([
  globalIgnores(['dist/', 'node_modules/', 'playwright-report/', 'test-results/', 'temp/']),
  {
    files: ['**/*.{js,mjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]);
