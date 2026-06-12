import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  resolve: {
    alias: [
      // `@mui/icons-material/<Icon>` resolves to a CJS flat file (the icons have
      // no per-icon package.json, so Vite never picks the ESM build). Vite's dev
      // SSR module runner serves that raw CJS and fails with "require is not
      // defined". Redirect single-segment icon imports to the ESM build.
      {
        find: /^@mui\/icons-material\/([^/]+)$/,
        replacement: '@mui/icons-material/esm/$1',
      },
    ],
  },
  ssr: {
    // MUI 5 ships without an `exports` map (only legacy `main`/`module`), so its
    // subpath ESM imports fail when externalized for SSR (a default import
    // resolves to an object -> "Element type is invalid"). Bundling the whole
    // @mui scope into the server build lets Vite apply proper CJS/ESM interop.
    noExternal: [/^@mui\//],
  },
  plugins: [reactRouter(), tsconfigPaths()],
});
