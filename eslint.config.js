import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  // Replaces the former .eslintignore.
  {
    ignores: ['node_modules', 'build', '.react-router', '.cache', '.vercel', '.output'],
  },

  // Lint JS/TS/JSX/TSX (flat config drops the old --ext flag).
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,

  {
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // React Router / Vite handle the JSX transform; no React import needed.
      'react/react-in-jsx-scope': 'off',
      // Match the prior leniency so the lint-stack upgrade does not turn
      // pre-existing code red. Tighten later if desired.
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/no-children-prop': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'prefer-const': 'warn',
      // New in eslint-plugin-react-hooks v7 — fires on pre-existing setState-in-
      // effect patterns. Kept as a warning so this lint-only upgrade does not
      // turn existing code red; fix the effects in a separate change.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
);
