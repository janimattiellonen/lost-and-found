import type { SupabaseClient } from '@supabase/supabase-js';

import { queryDiscIdsByExternalIds } from './queryDiscIdsByExternalIds.server';

/**
 * What the admin is told when the discs were marked but the errand was not
 * written. Thrown from here rather than composed by each caller: the two
 * disposal routes differ in how they answer, not in what went wrong, and the
 * singular and the plural of the same sentence drifted apart when both had a
 * copy.
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
 * The same update-or-insert as queryRequestRetrieval, over a set of discs
 * instead of one, and with no method: a disc the club is keeping is not going
 * back to an owner, so there is nothing to say about how. A disc already on the
 * list -- because its owner had asked for it -- has that open row's method
 * cleared rather than a second row inserted, which is both what the partial
 * unique index allows and the right reading: the club's newer decision says
 * what happens to the disc once it is in hand.
 *
 * Takes the external ids the mark was asked for rather than the ones it
 * changed; the club-scoped lookup drops anything this club does not have.
 */
export async function queryRequestDisposalRetrievals(supabase: SupabaseClient, externalIds: string[]): Promise<void> {
  const discIds = await queryDiscIdsByExternalIds(supabase, externalIds);

  if (discIds.length === 0) {
    return;
  }

  const { data: updated, error: updateError } = await supabase
    .from('disc_retrievals')
    .update({ retrieval_method: null })
    .in('disc_id', discIds)
    .is('retrieved_at', null)
    .select('disc_id');

  if (updateError) {
    throw new Error(failureMessage(externalIds.length));
  }

  const alreadyOnList = new Set((updated ?? []).map((row) => row.disc_id as number));
  const rows = discIds.filter((discId) => !alreadyOnList.has(discId)).map((discId) => ({ disc_id: discId }));

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('disc_retrievals').insert(rows);

  if (insertError) {
    throw new Error(failureMessage(externalIds.length));
  }
}
