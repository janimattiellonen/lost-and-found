import type { SupabaseClient } from '@supabase/supabase-js';

import { queryDiscIdsByExternalIds } from './queryDiscIdsByExternalIds.server';
import type { RetrievalMethodValue } from './retrievalMethod';

type Input = {
  externalIds: string[];
  /**
   * What the owner asked for, or null when the club is keeping the disc — a
   * disc that is not going back to anybody has no handover method.
   */
  retrievalMethod: RetrievalMethodValue | null;
};

/**
 * Puts discs on this club's retrieval list, and returns how many of them this
 * club actually has.
 *
 * A disc already on the list has its open row updated rather than a second one
 * inserted. That is how "he'd rather collect it after all" is recorded, how a
 * disc down for sale is put back on its way to its owner, and how one the owner
 * had asked for becomes the club's to keep — in every direction the newest word
 * wins, and requested_at is left alone, because the errand is as old as the
 * first time it was asked for. The partial unique index means two requests
 * racing cannot both land.
 *
 * A disc fetched once and since back in storage has no open row, so it gets a
 * new one and the history keeps both errands.
 *
 * Plural because the batch disposal mark is; the single-disc callers pass one
 * id. Written once rather than once per caller: the update-or-insert and its
 * ordering are the whole of what this feature has to get right.
 */
export async function queryRequestRetrievals(
  supabase: SupabaseClient,
  { externalIds, retrievalMethod }: Input,
): Promise<number> {
  // Resolving the ids here is also what scopes the write to APP_CLUB_ID: an id
  // belonging to another club drops out and gets no errand.
  const discIds = await queryDiscIdsByExternalIds(supabase, externalIds);

  if (discIds.length === 0) {
    return 0;
  }

  const { data: updated, error: updateError } = await supabase
    .from('disc_retrievals')
    .update({ retrieval_method: retrievalMethod })
    .in('disc_id', discIds)
    .is('retrieved_at', null)
    .select('disc_id');

  if (updateError) {
    throw new Error(`Noutolistalle lisääminen epäonnistui: ${updateError.message}`);
  }

  const alreadyOnList = new Set((updated ?? []).map((row) => row.disc_id as number));
  const rows = discIds
    .filter((discId) => !alreadyOnList.has(discId))
    .map((discId) => ({ disc_id: discId, retrieval_method: retrievalMethod }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('disc_retrievals').insert(rows);

    if (insertError) {
      throw new Error(`Noutolistalle lisääminen epäonnistui: ${insertError.message}`);
    }
  }

  return discIds.length;
}
