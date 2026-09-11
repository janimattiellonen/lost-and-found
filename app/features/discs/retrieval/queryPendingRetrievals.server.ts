import type { SupabaseClient } from '@supabase/supabase-js';
import { currentClubId } from '~/config/clubs';

/**
 * The one filter chain behind every read of the retrieval list: the page, the
 * count beside the menu item, and the state of the icons in the disc list.
 *
 * This, not the absence of a per-club feature flag, is what keeps one club's
 * errands off the other's list: both deployments share a database, and the
 * club filter below is the whole of the separation.
 *
 * "Pending" is two things at once. The request is open — nothing has been
 * fetched — and the disc is one that still has an errand in it: a disc since
 * returned to its owner, or archived, has none, so it drops off the list
 * without anyone having to tick it off. Written once, so the count on the menu
 * cannot come to mean something slightly different from the page it points at.
 *
 * A disc released for sale or donation is deliberately *not* filtered out, as
 * it was until 2026-09-10. It is off the public list but still on the shelf,
 * and fetching it is the errand — a purpose 1 row is the reason it is here.
 *
 * The club is scoped through the join rather than copied onto the row, so the
 * two tables cannot disagree about which club a retrieval belongs to. The
 * caller's `select` must therefore embed discs with `!inner` for these filters
 * to have anything to apply to.
 */
export function queryPendingRetrievals(
  supabase: SupabaseClient,
  select: string,
  options?: { head?: boolean; count?: 'exact' },
) {
  return supabase
    .from('disc_retrievals')
    .select(select, options)
    .is('retrieved_at', null)
    .eq('discs.club_id', currentClubId())
    .eq('discs.is_returned_to_owner', false)
    .is('discs.archived_at', null);
}
