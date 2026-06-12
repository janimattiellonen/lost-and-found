import createCache, { type EmotionCache } from '@emotion/cache';

// A single Emotion cache definition shared by the server (entry.server) and the
// client (entry.client). MUI and the app's `@emotion/styled` components both use
// the default `css` key, so server-rendered `<style data-emotion="css ...">`
// tags are adopted by the client cache during hydration instead of being
// re-inserted. Keeping the key in one place guarantees they line up.
export function createEmotionCache(): EmotionCache {
  return createCache({ key: 'css' });
}
