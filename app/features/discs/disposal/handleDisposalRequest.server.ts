import { markRefusal, requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId, isIsoDate } from '~/lib/api/validate';
import { isDisposalMethod } from '~/features/discs/disposal/disposalMethod';
import { queryRequestDisposalRetrievals } from '~/features/discs/retrieval/queryRequestDisposalRetrievals.server';
import { markForDisposal } from '~/models/discs.server';
import { createSupabaseServerClient } from '~/models/utils';

/** Authorises, validates and applies a disposal posted to /discs/disposal. */
export async function handleDisposalRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  const { externalId, canBeSoldOrDonatedDate, canBeSoldOrDonatedMethod } = (gate.body ?? {}) as Record<string, unknown>;

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

    const refusal = markRefusal(outcome);

    if (refusal) {
      return refusal;
    }

    // The disc is off the public list now but still on the shelf, so it goes on
    // the retrieval list. After the mark, not before: an errand for a disc the
    // club never released would be a trip for nothing.
    //
    // Its own catch, because the two writes are not one transaction and the
    // admin has to be told which half happened — the message comes from the
    // query, which knows how many discs it was asked about. Reporting a plain
    // failure would be worse than either: the disc is marked, so a second
    // attempt at the mark is not what he needs.
    try {
      await queryRequestDisposalRetrievals(createSupabaseServerClient(request), [externalId]);
    } catch (retrievalError) {
      const message =
        retrievalError instanceof Error ? retrievalError.message : 'Noutolistalle lisääminen epäonnistui.';

      return Response.json({ error: message }, { status: 500 });
    }

    return Response.json({ marked: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Kiekon merkitseminen myytäväksi tai lahjoitettavaksi epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
