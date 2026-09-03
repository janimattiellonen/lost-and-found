import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';

/**
 * How many answers are waiting, for the count beside the menu item.
 *
 * Counts in the database rather than fetching the rows to measure them, and so
 * reads neither a phone number nor an address to do it.
 */
export async function queryUnhandledOwnerResponseCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('disc_owner_responses')
    .select('id, discs!inner(id)', { head: true, count: 'exact' })
    .is('handled_at', null)
    .eq('discs.club_id', currentClubId());

  if (error) {
    throw new Error(`Vastausten laskenta epäonnistui: ${error.message}`);
  }

  return count ?? 0;
}
