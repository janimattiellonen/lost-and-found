import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { parseBatch, toDiscDTO } from '~/features/discs/submission/toDiscDTO';
import { createDiscs } from '~/models/discs.server';

/**
 * Authorises, validates and stores a batch posted to /discs/create.
 *
 * The club comes from APP_CLUB_ID rather than the request, so a disc cannot be
 * filed under another club's public list.
 */
export async function handleCreateRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  const batch = parseBatch(gate.body);

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
