import { markRefusal, requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId, isIsoDate } from '~/lib/api/validate';
import { isReturnMethod } from '~/features/discs/return/returnMethod';
import { markAsReturned } from '~/models/discs.server';

/** Authorises, validates and applies a return posted to /discs/return. */
export async function handleReturnRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  const { externalId, returnedToOwnerDate, returnMethod } = (gate.body ?? {}) as Record<string, unknown>;

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
    const outcome = await markAsReturned(
      externalId,
      { returnedToOwnerDate, returnMethod: returnMethod ?? null },
      request,
    );

    const refusal = markRefusal(outcome);

    if (refusal) {
      return refusal;
    }

    return Response.json({ returned: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kiekon merkitseminen palautetuksi epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
