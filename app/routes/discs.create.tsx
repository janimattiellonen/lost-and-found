import type { ActionFunctionArgs } from 'react-router';

import { parseBatch, toDiscDTO } from '~/features/discSubmission/toDiscDTO';
import { createDiscs } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';

/**
 * Persists a batch of hand-added discs.
 *
 * A resource route (no default export) rather than an action on /demo: a plain
 * `fetch` POST to a page route is a document request, so React Router answers
 * it with the rendered HTML page and the JSON below never reaches the caller.
 * A resource route returns its action's response as-is.
 *
 * The club comes from APP_CLUB_ID rather than the request, so a disc cannot be
 * filed under another club's public list.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Virheellinen pyyntö.' }, { status: 405 });
  }

  if (!(await isUserLoggedIn(request))) {
    return Response.json({ error: 'Kirjautuminen on vanhentunut. Kirjaudu uudelleen.' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Virheellinen pyyntö.' }, { status: 400 });
  }

  const batch = parseBatch(body);

  if ('error' in batch) {
    return Response.json({ error: batch.error }, { status: 422 });
  }

  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  try {
    const externalIds = await createDiscs(
      batch.discs.map((disc) => toDiscDTO(disc, clubId)),
      request,
    );

    return Response.json({ savedCount: externalIds.length, externalIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tallennus epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
