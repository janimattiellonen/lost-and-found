import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';

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
 * changed. Resolving them here is also what scopes the write to APP_CLUB_ID, so
 * an id from another club drops out on the way in and gets no errand.
 */
export async function queryRequestDisposalRetrievals(supabase: SupabaseClient, externalIds: string[]): Promise<void> {
  const discIds = await queryDiscIds(supabase, externalIds);

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
    throw new Error(`Noutolistalle lisääminen epäonnistui: ${updateError.message}`);
  }

  const alreadyOnList = new Set((updated ?? []).map((row) => row.disc_id as number));
  const rows = discIds.filter((discId) => !alreadyOnList.has(discId)).map((discId) => ({ disc_id: discId }));

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('disc_retrievals').insert(rows);

  if (insertError) {
    throw new Error(`Noutolistalle lisääminen epäonnistui: ${insertError.message}`);
  }
}

/** The numeric ids of the given discs that belong to this club. */
async function queryDiscIds(supabase: SupabaseClient, externalIds: string[]): Promise<number[]> {
  const { data, error } = await supabase
    .from('discs')
    .select('id')
    .in('external_id', externalIds)
    .eq('club_id', currentClubId());

  if (error) {
    throw new Error(`Kiekkojen haku epäonnistui: ${error.message}`);
  }

  return (data ?? []).map((row) => row.id as number);
}
