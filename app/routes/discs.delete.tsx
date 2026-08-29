import type { ActionFunctionArgs } from 'react-router';

import { deleteDisc, isExternalId } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';

/**
 * Deletes one disc, addressed by its external id.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
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

  const externalId = (body as { externalId?: unknown })?.externalId;

  if (!isExternalId(externalId)) {
    return Response.json({ error: 'Virheellinen kiekon tunniste.' }, { status: 422 });
  }

  try {
    const deleted = await deleteDisc(externalId, request);

    if (!deleted) {
      return Response.json({ error: 'Kiekkoa ei löytynyt. Se on ehkä jo poistettu.' }, { status: 404 });
    }

    return Response.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kiekon poisto epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
