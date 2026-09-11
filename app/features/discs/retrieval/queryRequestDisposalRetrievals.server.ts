import type { SupabaseClient } from '@supabase/supabase-js';

import { queryRequestRetrievals } from './queryRequestRetrievals.server';

/**
 * What the admin is told when the discs were marked but the errand was not
 * written. Composed here rather than by each caller: the two disposal routes
 * differ in how they answer, not in what went wrong, and the singular and the
 * plural of the same sentence drifted apart when both had a copy.
 */
function failureMessage(count: number): string {
  return count === 1
    ? 'Kiekko merkittiin, mutta noutolistalle lisääminen epäonnistui.'
    : 'Kiekot merkittiin, mutta noutolistalle lisääminen epäonnistui.';
}

/**
 * Puts discs the club has just released for sale or donation on the retrieval
 * list. They are off the public list but still on the shelf, and somebody has
 * to go and get them.
 *
 * The write itself is the ordinary one, as a `kept-by-club` errand: a disc
 * already on the list because its owner asked for it keeps that request intact,
 * since the club deciding to sell a disc does not unsay what its owner wanted.
 * What this adds is the message for the half-done state: the mark and the
 * errand are two writes and not one transaction, and an admin told only
 * "failed" would try the mark again, which is not what he needs.
 *
 * Takes the external ids the mark was asked for rather than the ones it
 * changed; the club-scoped lookup inside drops anything this club does not
 * have.
 */
export async function queryRequestDisposalRetrievals(supabase: SupabaseClient, externalIds: string[]): Promise<void> {
  try {
    await queryRequestRetrievals(supabase, { externalIds, errand: { kind: 'kept-by-club' } });
  } catch (error) {
    // The admin gets the sentence he can act on; the database's own words stay
    // reachable as the cause rather than being dropped on the floor.
    throw new Error(failureMessage(externalIds.length), { cause: error });
  }
}
