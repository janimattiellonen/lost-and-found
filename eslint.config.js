import fs from 'node:fs';

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

// Every directory under app/features/ is a vertical slice. Read at config load
// rather than hard-coded, so a new slice is guarded the moment it is created.
const features = fs
  .readdirSync('app/features', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

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

  // Keep features self-contained: a slice may import its own subtree, but not
  // another slice. Deny everything under ~/features/, then re-allow the slice's
  // own files (gitignore-style negation, so order matters). Shared code belongs
  // in ~/lib (plumbing) or ~/ui (presentational); if neither fits, the two
  // slices are one slice. See .claude/skills/project-conventions.
  ...features.map((feature) => ({
    files: [`app/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~/features/*', `!~/features/${feature}`, `!~/features/${feature}/**`],
              message: 'Cross-feature import. Put shared code in ~/lib or ~/ui, or merge the slices.',
            },
          ],
        },
      ],
    },
  })),
);
