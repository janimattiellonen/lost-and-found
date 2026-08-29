import type { ActionFunctionArgs } from 'react-router';

import { isDisposalMethod } from '~/features/discDisposal/disposalMethod';
import { isExternalId, isIsoDate, markForDisposal } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';

/**
 * Marks one disc as free to be sold or donated.
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

  const { externalId, canBeSoldOrDonatedDate, canBeSoldOrDonatedMethod } = (body ?? {}) as Record<string, unknown>;

  if (!isExternalId(externalId)) {
    return Response.json({ error: 'Virheellinen kiekon tunniste.' }, { status: 422 });
  }

  if (!isIsoDate(canBeSoldOrDonatedDate)) {
    return Response.json({ error: 'Virheellinen päivämäärä.' }, { status: 422 });
  }

  // The method is optional: the radio group can be left empty or cleared.
  if (canBeSoldOrDonatedMethod != null && !isDisposalMethod(canBeSoldOrDonatedMethod)) {
    return Response.json({ error: 'Virheellinen tapa.' }, { status: 422 });
  }

  try {
    const outcome = await markForDisposal(
      externalId,
      { canBeSoldOrDonatedDate, canBeSoldOrDonatedMethod: canBeSoldOrDonatedMethod ?? null },
      request,
    );

    if (outcome === 'not-found') {
      return Response.json({ error: 'Kiekkoa ei löytynyt.' }, { status: 404 });
    }

    // The row is there but the update changed nothing, which is how a
    // row-level security policy refuses an UPDATE.
    if (outcome === 'not-permitted') {
      return Response.json(
        { error: 'Kiekko löytyi, mutta sen päivitys estyi. Tarkista tietokannan käyttöoikeudet (RLS).' },
        { status: 403 },
      );
    }

    return Response.json({ marked: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Kiekon merkitseminen myytäväksi tai lahjoitettavaksi epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
