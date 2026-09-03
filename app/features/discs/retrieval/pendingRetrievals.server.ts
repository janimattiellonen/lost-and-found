import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The one filter chain behind every read of the retrieval list: the page, the
 * count beside the menu item, and the state of the icons in the disc list.
 *
 * "Pending" is two things at once. The request is open — nothing has been
 * fetched — and the disc is one the club still lists: a disc since returned,
 * released for sale or donation, or archived has no errand left in it, so it
 * drops off the list without anyone having to tick it off. Written once, so the
 * count on the menu cannot come to mean something slightly different from the
 * page it points at.
 *
 * The club is scoped through the join rather than copied onto the row, so the
 * two tables cannot disagree about which club a retrieval belongs to. The
 * caller's `select` must therefore embed discs with `!inner` for these filters
 * to have anything to apply to.
 */
export function selectPendingRetrievals(
  supabase: SupabaseClient,
  select: string,
  options?: { head?: boolean; count?: 'exact' },
): PostgrestFilterBuilder<any, any, any, any, any> {
  return supabase
    .from('disc_retrievals')
    .select(select, options)
    .is('retrieved_at', null)
    .eq('discs.club_id', process.env.APP_CLUB_ID)
    .eq('discs.is_returned_to_owner', false)
    .eq('discs.can_be_sold_or_donated', false)
    .is('discs.archived_at', null);
}
