import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId } from '~/lib/api/validate';
import { isRetrievalListEnabled } from '~/config/clubs';
import { isRetrievalMethod } from './retrievalMethod';
import { queryRequestRetrieval } from './queryRequestRetrieval.server';
import { createSupabaseServerClient } from '~/models/utils';

/** Authorises, validates and applies a retrieval request posted to /discs/retrieval. */
export async function handleRetrievalRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  // The list is one club's way of working, and this instance serves one club.
  // Checked here as well as in the UI: the route is reachable without it.
  if (!isRetrievalListEnabled()) {
    return Response.json({ error: 'Noutolista ei ole käytössä.' }, { status: 404 });
  }

  const { externalId, retrievalMethod } = (gate.body ?? {}) as Record<string, unknown>;

  if (!isExternalId(externalId)) {
    return Response.json({ error: 'Virheellinen kiekon tunniste.' }, { status: 422 });
  }

  // Required, unlike the return and disposal methods: a line on the list that
  // does not say whether to post the disc or hand it over is a line the admin
  // has to go back to the messages for.
  if (!isRetrievalMethod(retrievalMethod)) {
    return Response.json({ error: 'Virheellinen noutotapa.' }, { status: 422 });
  }

  try {
    const outcome = await queryRequestRetrieval(createSupabaseServerClient(request), { externalId, retrievalMethod });

    if (outcome === 'not-found') {
      return Response.json({ error: 'Kiekkoa ei löytynyt.' }, { status: 404 });
    }

    return Response.json({ onRetrievalList: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Noutolistalle lisääminen epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
