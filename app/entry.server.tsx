/**
 * By default, React Router will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx react-router reveal` ✨
 * For more information, see https://reactrouter.com/explanation/special-files#entryservertsx
 */

import { PassThrough } from 'node:stream';

import type { EntryContext } from 'react-router';
import { createReadableStreamFromReadable } from '@react-router/node';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get('user-agent');

    // Stream to the browser (onShellReady), but wait for the full markup for
    // bots and SPA mode (onAllReady) so crawlers get complete HTML.
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady';

    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={routerContext} url={request.url} />, {
      [readyOption]() {
        shellRendered = true;
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);

        responseHeaders.set('Content-Type', 'text/html');

        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );

        pipe(body);
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell. Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    });

    setTimeout(abort, streamTimeout + 1000);
  });
}
