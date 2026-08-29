import { type ActionResult, postJson } from '~/features/api/postJson';

import type { DiscReturnInput } from './discReturn';

/** The resource route that records the return. */
const RETURN_URL = '/discs/return';

const GENERIC_ERROR = 'Merkintä epäonnistui. Yritä uudelleen.';

/**
 * Marks one disc as returned to its owner.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function markAsReturned(input: DiscReturnInput): Promise<ActionResult> {
  const result = await postJson(RETURN_URL, input, GENERIC_ERROR);

  return result.status === 'success' ? { status: 'success' } : result;
}

export type { DiscReturnInput };
