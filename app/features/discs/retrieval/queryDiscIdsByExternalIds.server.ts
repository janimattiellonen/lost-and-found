import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';

/**
 * The numeric ids of the given discs that belong to this club, in no particular
 * order and with no row for an id this club does not have.
 *
 * The plural of queryDiscIdByExternalId, and it exists for the same reason: a
 * disc_retrievals row is keyed on discs.id, and the lookup that resolves it is
 * also what scopes the write to APP_CLUB_ID. An id from another club drops out
 * here and gets no errand, even with a valid uuid in hand.
 *
 * A query of its own rather than a loop over the singular: a batch marks up to
 * MAX_DISCS_PER_WRITE discs, and one round trip beats twenty-five.
 */
export async function queryDiscIdsByExternalIds(supabase: SupabaseClient, externalIds: string[]): Promise<number[]> {
  if (externalIds.length === 0) {
    return [];
  }

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
