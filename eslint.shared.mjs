import tseslint from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import vitest from 'eslint-plugin-vitest';
import parser from '@typescript-eslint/parser';

export const sharedConfig = {
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    globals: {
      JSX: true,
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    react,
    'react-hooks': hooks,
    vitest,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'vitest/no-conditional-tests': 'warn',
  },
};
