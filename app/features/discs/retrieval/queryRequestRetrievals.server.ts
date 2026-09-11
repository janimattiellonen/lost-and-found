import type { SupabaseClient } from '@supabase/supabase-js';

import { queryDiscIdsByExternalIds } from './queryDiscIdsByExternalIds.server';
import { queryOpenRetrievalDiscIds } from './queryOpenRetrievalDiscIds.server';
import type { RetrievalErrand } from './retrievalErrand';

type Input = {
  externalIds: string[];
  /** Why these discs are being fetched; see the two branches below. */
  errand: RetrievalErrand;
};

/**
 * Puts discs on this club's retrieval list, and returns how many of them this
 * club actually has.
 *
 * A disc already on the list keeps its open row rather than gaining a second
 * one -- the partial unique index allows one, and one is what "the" errand
 * means everywhere else. What happens to that row depends on why it is being
 * asked for again:
 *
 *  * `to-owner` **writes the method onto it**. This is the admin transcribing a
 *    new message: "he'd rather collect it after all", or a disc the club had
 *    been keeping that is going back to its owner after all. The newest word
 *    about where the disc is going wins.
 *  * `kept-by-club` **leaves it exactly as it was**. The club deciding to sell a
 *    disc does not stop its owner from having asked for it by post, and that
 *    request is the thing worth keeping: it is how the admin knows there is a
 *    conversation to have before the disc goes to the bring-and-buy table. The
 *    disc is on the list either way, which is all the mark needed.
 *
 * `requested_at` is never touched, because the errand is as old as the first
 * time it was asked for. A disc fetched once and since back in storage has no
 * open row, so it gets a new one and the history keeps both errands.
 *
 * Plural because the batch disposal mark is; the single-disc callers pass one
 * id.
 */
export async function queryRequestRetrievals(
  supabase: SupabaseClient,
  { externalIds, errand }: Input,
): Promise<number> {
  // Resolving the ids here is also what scopes the write to APP_CLUB_ID: an id
  // belonging to another club drops out and gets no errand.
  const discIds = await queryDiscIdsByExternalIds(supabase, externalIds);

  if (discIds.length === 0) {
    return 0;
  }

  const alreadyOnList = await queryOpenRetrievalDiscIds(supabase, discIds);

  // Only the owner-bound request writes to a row that is already open; the
  // club's own decision has nothing to say about how the owner wanted it.
  if (errand.kind === 'to-owner' && alreadyOnList.size > 0) {
    const { error } = await supabase
      .from('disc_retrievals')
      .update({ retrieval_method: errand.method })
      .in('disc_id', [...alreadyOnList])
      .is('retrieved_at', null);

    if (error) {
      throw new Error(`Noutolistalle lisääminen epäonnistui: ${error.message}`);
    }
  }

  const rows = discIds
    .filter((discId) => !alreadyOnList.has(discId))
    .map((discId) => ({
      disc_id: discId,
      retrieval_method: errand.kind === 'to-owner' ? errand.method : null,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from('disc_retrievals').insert(rows);

    // 23505 is the partial unique index: between the read above and this insert,
    // an owner answered the link and their errand landed first. The disc is on
    // the list, which is all this was asked to achieve, so it is not a failure —
    // and reporting one would tell the admin his mark went wrong when it did
    // not. Their answer is the newer word about that disc anyway.
    if (error && error.code !== '23505') {
      throw new Error(`Noutolistalle lisääminen epäonnistui: ${error.message}`);
    }
  }

  return discIds.length;
}
