import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId } from '~/lib/api/validate';
import { deleteDisc } from '~/models/discs.server';

/** Authorises, validates and performs a delete posted to /discs/delete. */
export async function handleDeleteRequest(request: Request): Promise<Response> {
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
