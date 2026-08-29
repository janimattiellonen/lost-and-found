import { CONNECTION_ERROR, messageForStatus } from './errorMessages';

/** What a call answers with when the only question is whether it worked. */
export type ActionResult = { status: 'success' } | { status: 'error'; message: string };

/** The same, plus whatever JSON the route answered with. */
export type PostResult = { status: 'success'; body: unknown } | { status: 'error'; message: string };

/**
 * POSTs a JSON payload to one of the app's resource routes.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function postJson(url: string, payload: unknown, genericError: string): Promise<PostResult> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { status: 'error', message: CONNECTION_ERROR };
  }

  // The routes answer with JSON on every path, so a body that will not parse
  // means the request never reached one — a signed-out redirect, or a proxy
  // error page. The status decides what to say; do not guess at a cause.
  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok) {
    return { status: 'success', body };
  }

  const message = (body as { error?: unknown })?.error;

  return {
    status: 'error',
    message: typeof message === 'string' ? message : messageForStatus(response.status, genericError),
  };
}
