import { defineConfig } from 'eslint/config';
import { sharedConfig } from '../../eslint.shared.mjs';
import nextPlugin from '@next/eslint-plugin-next';
import parser from '@typescript-eslint/parser';

export default defineConfig([
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  sharedConfig,
  nextPlugin.flatConfig.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {},
  },
]);
