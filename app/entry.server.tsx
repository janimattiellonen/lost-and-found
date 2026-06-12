/**
 * Custom server entry so MUI/Emotion styles are extracted during SSR and
 * injected into <head>. Without this, Emotion inserts its `<style data-emotion>`
 * tags on the client during hydration, mutating <head> and breaking
 * full-document hydration.
 *
 * We render with `renderToPipeableStream` (not `renderToString`) because React
 * Router's Single Fetch streams the hydration data into the document via
 * `__reactRouterContext.streamController` chunks. `renderToString` omits those
 * chunks, leaving the client waiting forever for initial data, so route
 * components never mount. We buffer the full streamed output in `onAllReady`
 * (the app uses no `defer`, so nothing is lost by waiting) and only then run
 * Emotion's critical-style extraction, which needs the complete markup.
 */

import { Writable } from 'node:stream';

import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter, type EntryContext } from 'react-router';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';

import { createEmotionCache } from './createEmotionCache';

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise<Response>((resolve, reject) => {
    const cache = createEmotionCache();
    const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

    let shellRendered = false;
    let statusCode = responseStatusCode;

    const { pipe, abort } = renderToPipeableStream(
      <CacheProvider value={cache}>
        <ServerRouter context={routerContext} url={request.url} />
      </CacheProvider>,
      {
        onAllReady() {
          shellRendered = true;

          const chunks: Buffer[] = [];
          const collector = new Writable({
            write(chunk, _encoding, callback) {
              chunks.push(Buffer.from(chunk));
              callback();
            },
            final(callback) {
              const html = Buffer.concat(chunks).toString('utf-8');
              const emotionChunks = extractCriticalToChunks(html);
              const styleTags = constructStyleTagsFromChunks({ html, styles: emotionChunks.styles });

              // root.tsx renders the literal `__STYLES__` only on the server (it
              // renders null on the client), giving a hydration-safe slot for the
              // extracted style tags.
              const markup = html.replace('__STYLES__', styleTags);

              responseHeaders.set('Content-Type', 'text/html');
              resolve(
                new Response(`<!DOCTYPE html>${markup}`, {
                  status: statusCode,
                  headers: responseHeaders,
                }),
              );
              callback();
            },
          });

          pipe(collector);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          statusCode = 500;
          // Log streaming errors once the shell has rendered; shell errors are
          // surfaced via onShellError/reject.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
