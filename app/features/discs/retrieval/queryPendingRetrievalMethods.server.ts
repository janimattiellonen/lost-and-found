import type { SupabaseClient } from '@supabase/supabase-js';

import { selectPendingRetrievals } from './pendingRetrievals.server';
import { isRetrievalMethod, type RetrievalMethodValue } from './retrievalMethod';

/**
 * Which of the club's listed discs are already on the retrieval list, and what
 * each was asked for.
 *
 * Keyed by external id, which is how the disc list addresses a disc. The row
 * action reads this to say that a disc is already on the list rather than
 * silently putting it there twice, and to open its form with the method the
 * owner asked for.
 *
 * A query of its own rather than a join onto the disc list: the list is public
 * and this is not, and keeping them apart means an anonymous visitor's page
 * cannot grow a retrieval column by accident.
 */
export async function queryPendingRetrievalMethods(
  supabase: SupabaseClient,
): Promise<Record<string, RetrievalMethodValue>> {
  const { data, error } = await selectPendingRetrievals(supabase, 'retrieval_method, discs!inner(external_id)');

  if (error) {
    throw new Error(`Noutolistan haku epäonnistui: ${error.message}`);
  }

  const methods: Record<string, RetrievalMethodValue> = {};

  for (const row of (data ?? []) as any[]) {
    if (isRetrievalMethod(row.retrieval_method)) {
      methods[row.discs.external_id] = row.retrieval_method;
    }
  }

  return methods;
}
