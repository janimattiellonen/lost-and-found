import type { SupabaseClient } from '@supabase/supabase-js';

import { selectPendingRetrievals } from './pendingRetrievals.server';

/**
 * How many discs are waiting to be fetched out of storage.
 *
 * Read on every page load for the count beside the menu item, so it counts in
 * the database rather than fetching the rows to measure them — and never reads
 * an owner's phone number to do it.
 */
export async function queryRetrievalCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await selectPendingRetrievals(supabase, 'id, discs!inner(id)', {
    head: true,
    count: 'exact',
  });

  if (error) {
    throw new Error(`Noutolistan laskenta epäonnistui: ${error.message}`);
  }

  return count ?? 0;
}
