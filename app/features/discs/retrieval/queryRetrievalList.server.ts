import type { SupabaseClient } from '@supabase/supabase-js';

import { queryPendingRetrievals } from './queryPendingRetrievals.server';
import { isRetrievalMethod } from './retrievalMethod';
import type { RetrievalListDisc } from './discRetrieval';

/** What the page shows of the disc behind a request. */
const LIST_COLUMNS =
  'requested_at, retrieval_method, discs!inner(external_id, disc_name, disc_colour, owner_name, owner_phone_number, added_at)';

/**
 * What the select above reads back.
 *
 * A select built from a string cannot be typed by supabase-js, so declaring the
 * columns asked for and casting once puts the checking back where the shape is
 * known — beside the select that names them.
 */
type Row = {
  requested_at: string;
  retrieval_method: number | null;
  discs: {
    external_id: string;
    disc_name: string;
    disc_colour: string;
    owner_name: string | null;
    owner_phone_number: string | null;
    added_at: string | null;
  };
};

/**
 * The discs waiting to be fetched out of storage, newest request first.
 *
 * The top of the list is where the admin looks: a request that came in today is
 * the one he has not dealt with yet, and an old line is one he has already seen
 * every time he opened the page.
 *
 * The owner's phone number is the point of the list, so this is only ever read
 * behind the signed-in page route.
 */
export async function queryRetrievalList(supabase: SupabaseClient): Promise<RetrievalListDisc[]> {
  const { data, error } = await queryPendingRetrievals(supabase, LIST_COLUMNS).order('requested_at', {
    ascending: false,
  });

  if (error) {
    throw new Error(`Noutolistan haku epäonnistui: ${error.message}`);
  }

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    externalId: row.discs.external_id,
    discName: row.discs.disc_name,
    discColour: row.discs.disc_colour,
    addedAt: row.discs.added_at ?? null,
    ownerName: row.discs.owner_name ?? null,
    ownerPhoneNumber: row.discs.owner_phone_number ?? null,
    // NULL is a value with a meaning here — the club is keeping this one — and
    // an out-of-range smallint is read as the same thing rather than as a
    // method it might not be. Either way the disc is still on the shelf.
    retrievalMethod: isRetrievalMethod(row.retrieval_method) ? row.retrieval_method : null,
    requestedAt: row.requested_at,
  }));
}
