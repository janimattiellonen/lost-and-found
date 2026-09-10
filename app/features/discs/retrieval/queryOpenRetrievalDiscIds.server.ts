import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Which of these discs are already waiting to be fetched.
 *
 * Takes numeric ids, not external ones: every caller has already resolved them
 * through the club-scoped lookup, and that lookup is what keeps one club's
 * errands out of the other's.
 *
 * Reads across clubs by design — the caller has narrowed the set already, and a
 * second club filter here would be a second place to keep in step.
 */
export async function queryOpenRetrievalDiscIds(supabase: SupabaseClient, discIds: number[]): Promise<Set<number>> {
  if (discIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from('disc_retrievals')
    .select('disc_id')
    .in('disc_id', discIds)
    .is('retrieved_at', null);

  if (error) {
    throw new Error(`Noutolistan haku epäonnistui: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.disc_id as number));
}
