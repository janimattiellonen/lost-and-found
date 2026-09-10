import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId } from '~/lib/api/validate';
import { isRetrievalMethod } from './retrievalMethod';
import { queryRequestRetrievals } from './queryRequestRetrievals.server';
import { createSupabaseServerClient } from '~/models/utils';

/** Authorises, validates and applies a retrieval request posted to /discs/retrieval. */
export async function handleRetrievalRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
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
    // Nothing resolved means this club has no such disc — the same lookup that
    // scopes the write is what reports it.
    const affected = await queryRequestRetrievals(createSupabaseServerClient(request), {
      externalIds: [externalId],
      retrievalMethod,
    });

    if (affected === 0) {
      return Response.json({ error: 'Kiekkoa ei löytynyt.' }, { status: 404 });
    }

    return Response.json({ onRetrievalList: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Noutolistalle lisääminen epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
