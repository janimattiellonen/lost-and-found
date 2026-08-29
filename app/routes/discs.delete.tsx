import type { ActionFunctionArgs } from 'react-router';

import { requireAdminJson } from '~/features/api/resourceRoute.server';
import { isExternalId } from '~/features/api/validate';
import { deleteDisc } from '~/models/discs.server';

/**
 * Deletes one disc, addressed by its external id.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  const externalId = (gate.body as { externalId?: unknown })?.externalId;

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
