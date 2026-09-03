import type { SupabaseClient } from '@supabase/supabase-js';

import { selectPendingRetrievals } from './pendingRetrievals.server';
import { isRetrievalMethod, RetrievalMethod } from './retrievalMethod';
import type { RetrievalListDisc } from './discRetrieval';

/** What the page shows of the disc behind a request. */
const LIST_COLUMNS =
  'requested_at, retrieval_method, discs!inner(external_id, disc_name, disc_colour, owner_name, owner_phone_number, added_at)';

/**
 * The discs waiting to be fetched out of storage, oldest request first — the
 * order the admin works through them in.
 *
 * The owner's phone number is the point of the list, so this is only ever read
 * behind the signed-in page route.
 */
export async function queryRetrievalList(supabase: SupabaseClient): Promise<RetrievalListDisc[]> {
  const { data, error } = await selectPendingRetrievals(supabase, LIST_COLUMNS).order('requested_at', {
    ascending: true,
  });

  if (error) {
    throw new Error(`Noutolistan haku epäonnistui: ${error.message}`);
  }

  return ((data ?? []) as any[]).map((row) => ({
    externalId: row.discs.external_id,
    discName: row.discs.disc_name,
    discColour: row.discs.disc_colour,
    addedAt: row.discs.added_at ?? null,
    ownerName: row.discs.owner_name ?? null,
    ownerPhoneNumber: row.discs.owner_phone_number ?? null,
    // The CHECK constraint should make an out-of-range value impossible; if one
    // happens, read it as the method that costs a wasted trip rather than a
    // wasted stamp.
    retrievalMethod: isRetrievalMethod(row.retrieval_method) ? row.retrieval_method : RetrievalMethod.PickedUp,
    requestedAt: row.requested_at,
  }));
}
