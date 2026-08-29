import type { ActionFunctionArgs } from 'react-router';

import { markRefusal, requireAdminJson } from '~/features/api/resourceRoute.server';
import { isDisposalMethod } from '~/features/discDisposal/disposalMethod';
import { isExternalId, isIsoDate } from '~/features/api/validate';
import { markForDisposal } from '~/models/discs.server';

/**
 * Marks one disc as free to be sold or donated.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
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

    return Response.json({ marked: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Kiekon merkitseminen myytäväksi tai lahjoitettavaksi epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
