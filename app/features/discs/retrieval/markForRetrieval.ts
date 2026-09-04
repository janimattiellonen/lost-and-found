import { type ActionResult, postJson } from '~/lib/api/postJson';

import type { DiscRetrievalInput } from './discRetrieval';

/** The resource route that puts the disc on the retrieval list. */
const RETRIEVAL_URL = '/discs/retrieval';

const GENERIC_ERROR = 'Noutolistalle lisääminen epäonnistui. Yritä uudelleen.';

/**
 * Puts one disc on the admin's retrieval list.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function markForRetrieval(input: DiscRetrievalInput): Promise<ActionResult> {
  const result = await postJson(RETRIEVAL_URL, input, GENERIC_ERROR);

  return result.status === 'success' ? { status: 'success' } : result;
}

export type { DiscRetrievalInput };
