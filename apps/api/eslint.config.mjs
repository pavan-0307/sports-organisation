import { sharedConfig } from '../../eslint.shared.mjs';

export default [
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
  sharedConfig,
  {
    files: ['**/*.{js,ts}'],
    rules: {},
  },
];
