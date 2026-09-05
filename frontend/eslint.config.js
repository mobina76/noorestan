import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.angular/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-debugger': 'error',
      'no-eval': 'error',
    },
  },
]);
