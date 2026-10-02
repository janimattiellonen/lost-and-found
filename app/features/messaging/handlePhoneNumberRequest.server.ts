import { currentClubId } from '~/config/clubs';
import { parseOwnerPhoneNumber } from '~/features/messaging/ownerPhoneNumber';
import { queryUpdateOwnerPhoneNumber } from '~/features/messaging/queryUpdateOwnerPhoneNumber.server';
import { requireAdminJson } from '~/lib/api/resourceRoute.server';
import { isExternalId } from '~/lib/api/validate';
import { createSupabaseServerClient } from '~/models/utils';

/**
 * Authorises, validates and saves a phone number posted to
 * /message/phone-number by the composer's phone editor.
 *
 * Answers with the number as written — trimmed — so the composer shows what
 * the database now holds rather than what was typed.
 */
export async function handlePhoneNumberRequest(request: Request): Promise<Response> {
  const gate = await requireAdminJson(request);

  if ('response' in gate) {
    return gate.response;
  }

  const { externalId, phoneNumber } = (gate.body ?? {}) as Record<string, unknown>;

  if (!isExternalId(externalId)) {
    return Response.json({ error: 'Virheellinen kiekon tunniste.' }, { status: 422 });
  }

  const parsed = parseOwnerPhoneNumber(phoneNumber);

  if (parsed.error !== undefined) {
    return Response.json({ error: parsed.error }, { status: 422 });
  }

  try {
    const outcome = await queryUpdateOwnerPhoneNumber(createSupabaseServerClient(request), {
      externalId,
      clubId: currentClubId(),
      phoneNumber: parsed.phoneNumber,
    });

    if (outcome === 'not-found') {
      return Response.json({ error: 'Kiekkoa ei löytynyt.' }, { status: 404 });
    }

    return Response.json({ phoneNumber: parsed.phoneNumber });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Puhelinnumeron tallennus epäonnistui.';

    return Response.json({ error: message }, { status: 500 });
  }
}
