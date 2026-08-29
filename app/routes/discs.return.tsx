import type { ActionFunctionArgs } from 'react-router';

import { isReturnMethod } from '~/features/discReturn/returnMethod';
import { isExternalId, isIsoDate, markAsReturned } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';

/**
 * Marks one disc as returned to its owner.
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

  const { externalId, returnedToOwnerDate, returnMethod } = (body ?? {}) as Record<string, unknown>;

  if (!isExternalId(externalId)) {
    return Response.json({ error: 'Virheellinen kiekon tunniste.' }, { status: 422 });
  }

  if (!isIsoDate(returnedToOwnerDate)) {
    return Response.json({ error: 'Virheellinen palautuspäivä.' }, { status: 422 });
  }

  // The method is optional: the radio group can be left empty or cleared.
  if (returnMethod != null && !isReturnMethod(returnMethod)) {
    return Response.json({ error: 'Virheellinen palautustapa.' }, { status: 422 });
  }

  try {
    const updated = await markAsReturned(
      externalId,
      { returnedToOwnerDate, returnMethod: returnMethod ?? null },
      request,
    );

    if (!updated) {
      return Response.json({ error: 'Kiekkoa ei löytynyt.' }, { status: 404 });
    }

    return Response.json({ returned: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kiekon merkitseminen palautetuksi epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
