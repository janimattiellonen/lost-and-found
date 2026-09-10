import type { SupabaseClient } from '@supabase/supabase-js';

import { queryPendingRetrievals } from './queryPendingRetrievals.server';
import { toRetrievalErrand, type RetrievalErrand } from './retrievalErrand';

/**
 * What the select below reads back.
 *
 * A select built from a string cannot be typed by supabase-js, so declaring the
 * columns asked for and casting once puts the checking back where the shape is
 * known — beside the select that names them.
 */
type Row = { retrieval_method: number | null; discs: { external_id: string } };

/**
 * Which of the club's listed discs are already waiting to be fetched, and what
 * for.
 *
 * Keyed by external id, which is how the disc list addresses a disc; a disc
 * with no entry is not on the list. The row action reads this to say that a
 * disc is already on the list rather than silently putting it there twice, and
 * to open its form with the method the owner asked for.
 *
 * A disc can be here as "kept by the club" while still on the disc list: that
 * is the window between an owner answering "keep it" from the link and the
 * admin marking the disc sold or donated, which takes it off the disc list
 * altogether.
 *
 * A query of its own rather than a join onto the disc list: the list is public
 * and this is not, and keeping them apart means an anonymous visitor's page
 * cannot grow a retrieval column by accident.
 */
export async function queryPendingRetrievalErrands(supabase: SupabaseClient): Promise<Record<string, RetrievalErrand>> {
  const { data, error } = await queryPendingRetrievals(supabase, 'retrieval_method, discs!inner(external_id)');

  if (error) {
    throw new Error(`Noutolistan haku epäonnistui: ${error.message}`);
  }

  const errands: Record<string, RetrievalErrand> = {};

  for (const row of (data ?? []) as unknown as Row[]) {
    errands[row.discs.external_id] = toRetrievalErrand(row.retrieval_method);
  }

  return errands;
}
