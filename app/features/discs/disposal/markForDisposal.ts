import { type ActionResult, postJson } from '~/lib/api/postJson';

import type { DiscDisposalInput } from './discDisposal';

/** The resource route that records the mark. */
const DISPOSAL_URL = '/discs/disposal';

const GENERIC_ERROR = 'Merkintä epäonnistui. Yritä uudelleen.';

/**
 * Marks one disc as free to be sold or donated.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function markForDisposal(input: DiscDisposalInput): Promise<ActionResult> {
  const result = await postJson(DISPOSAL_URL, input, GENERIC_ERROR);

  return result.status === 'success' ? { status: 'success' } : result;
}

export type { DiscDisposalInput };
