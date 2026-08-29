import type { ActionFunctionArgs } from 'react-router';

import { markRefusal, requireAdminJson } from '~/features/api/resourceRoute.server';
import { isReturnMethod } from '~/features/discReturn/returnMethod';
import { isExternalId, isIsoDate } from '~/features/api/validate';
import { markAsReturned } from '~/models/discs.server';

/**
 * Marks one disc as returned to its owner.
 *
 * A resource route for the same reason as /discs/create: a plain fetch POST to
 * a page route is answered with a rendered document, not the action's JSON.
 */
export async function action({ request }: ActionFunctionArgs) {
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
