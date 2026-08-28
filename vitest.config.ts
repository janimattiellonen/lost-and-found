import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Standalone from vite.config.ts on purpose: the parser is plain TypeScript, so
// the tests need neither the React Router plugin nor the StyleX transform.
export default defineConfig({
  resolve: {
    alias: { '~': path.resolve(__dirname, 'app') },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts'],
    // e2e/ belongs to Playwright.
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
