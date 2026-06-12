/**
 * By default, React Router will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx react-router reveal` ✨
 * For more information, see https://reactrouter.com/explanation/special-files#entryclienttsx
 */

import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { CacheProvider } from '@emotion/react';

import { createEmotionCache } from './createEmotionCache';

// Provide the same Emotion cache the server used so MUI/`@emotion/styled` styles
// are inserted next to the server-rendered `<style data-emotion>` tags rather
// than prepended above the <meta> tags, which would corrupt full-document
// hydration ("Expected server HTML to contain a matching <meta> in <head>").
const cache = createEmotionCache();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <CacheProvider value={cache}>
        <HydratedRouter />
      </CacheProvider>
    </StrictMode>,
  );
});
