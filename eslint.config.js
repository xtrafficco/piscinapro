import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'vendor/**', 'supabase/functions/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  {
    // scripts clássicos do navegador: compartilham funções e constantes globais entre si
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: { ...globals.browser, module: 'readonly' } },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
    },
  },
  {
    files: ['js/tema-inicial.js', 'js/pure.js', 'js/sync-diff.js'],
    rules: { 'no-var': 'off' },
  },
  {
    files: ['sw.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.serviceworker } },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'e2e/**/*.js', 'playwright.config.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
