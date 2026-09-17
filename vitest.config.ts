import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import stylexUnplugin from '@stylexjs/unplugin';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const alias = { '~': path.resolve(__dirname, 'app') };

// Two projects, because the two kinds of test need opposite things.
//
// Most tests here are plain TypeScript — the disc-text parser, the palette
// comparison — and want nothing but Node: no DOM, no plugins, milliseconds.
// Component tests need a DOM, and they need StyleX compiled, because
// `stylex.defineVars` throws at runtime rather than degrading ("Unexpected
// 'stylex.defineVars' call at runtime. Styles must be compiled by
// '@stylexjs/babel-plugin'"). Importing any component therefore drags in the
// whole token set and fails before a test body runs.
//
// The split is by extension: `.test.ts` is Node, `.test.tsx` is jsdom. That is
// also the honest description of the difference — a test with JSX in it needs a
// browser-like document, and one without it does not.
export default defineConfig({
  test: {
    // The StyleX plugin leaves file handles open — around 250 of them, which the
    // hanging-process reporter attributes to its source scan — so Vitest waits
    // for them before exiting. The tests have finished and the exit code is
    // unaffected; this stops the default ten seconds being added to every run.
    // It is a plugin leak, not a test leak: the node project exits immediately.
    teardownTimeout: 1_000,
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: ['app/**/*.test.ts'],
          exclude: ['e2e/**', 'node_modules/**'],
        },
      },
      {
        resolve: { alias },
        plugins: [
          stylexUnplugin.vite({
            useCSSLayers: false,
            aliases: { '~/*': [path.resolve(__dirname, 'app', '*')] },
          }),
        ],
        test: {
          name: 'component',
          environment: 'jsdom',
          setupFiles: ['./test/setup-component.ts'],
          include: ['app/**/*.test.tsx'],
          exclude: ['e2e/**', 'node_modules/**'],
        },
      },
    ],
  },
});
