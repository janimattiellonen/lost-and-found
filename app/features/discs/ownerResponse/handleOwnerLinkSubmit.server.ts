import { currentClubId } from '~/config/clubs';
import { isExternalId } from '~/lib/api/validate';
import { parseOwnerResponse } from './parseOwnerResponse';
import { queryOwnerLinkDisc } from './queryOwnerLinkDisc.server';
import { querySubmitOwnerResponse } from './querySubmitOwnerResponse.server';
import { createConnection } from '~/models/utils';

/** What the page renders after a submit: a thank-you, or a message above the form. */
export type OwnerLinkActionResult = { saved: true } | { error: string };

const STALE = 'Tätä linkkiä ei voi enää käyttää. Kiekko on ehkä jo palautettu tai luovutettu – ota yhteyttä seuraan.';

/**
 * Records what the owner answered.
 *
 * The disc is looked up again rather than trusted from the form: the options
 * depend on where the disc is, and the page the owner is looking at may have
 * been open since before it was fetched out of the storage. The database
 * refuses the same thing independently.
 */
export async function handleOwnerLinkSubmit(token: string, formData: FormData): Promise<OwnerLinkActionResult> {
  if (!isExternalId(token)) {
    return { error: STALE };
  }

  const supabase = createConnection();

  const disc = await queryOwnerLinkDisc(supabase, token, currentClubId());

  if (!disc) {
    return { error: STALE };
  }

  const parsed = parseOwnerResponse(formData, disc.handoverMethods);

  if ('error' in parsed) {
    return parsed;
  }

  const outcome = await querySubmitOwnerResponse(supabase, { token, response: parsed.response });

  return outcome === 'saved' ? { saved: true } : { error: STALE };
}
