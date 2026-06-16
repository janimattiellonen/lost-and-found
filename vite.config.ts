import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import stylexUnplugin from '@stylexjs/unplugin';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    // Vite 8 resolves tsconfig `paths` (the `~/*` -> `./app/*` alias) natively,
    // replacing the former vite-tsconfig-paths plugin.
    tsconfigPaths: true,
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
  plugins: [
    stylexUnplugin.vite({
      useCSSLayers: false,
      aliases: {
        '~/*': [path.resolve(__dirname, 'app', '*')],
      },
      // Append StyleX's atomic CSS into the root route's stylesheet (the one
      // produced by root.tsx's `app.css` side-effect import). React Router
      // injects root's CSS on every route via <Links/>, so this makes StyleX
      // global. Without it the plugin defaults to "the first .css asset", which
      // is a code-split chunk and would not load app-wide.
      cssInjectionTarget: (fileName) => /(?:^|\/)root-[^/]*\.css$/.test(fileName),
    }),
    reactRouter(),
  ],
});
