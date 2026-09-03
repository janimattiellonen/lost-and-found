import type { SupabaseClient } from '@supabase/supabase-js';

import { queryDiscIdByExternalId } from './queryDiscIdByExternalId.server';
import type { RetrievalOutcome } from './discRetrieval';
import type { RetrievalMethodValue } from './retrievalMethod';

type Input = {
  externalId: string;
  retrievalMethod: RetrievalMethodValue;
};

/**
 * Puts one of this club's discs on the retrieval list.
 *
 * A disc already on it has its open row updated rather than a second one
 * inserted, which is how "he'd rather collect it after all" is recorded — and
 * the partial unique index means two requests racing cannot both land. A disc
 * fetched once and since back in storage gets a new row, so the history keeps
 * both errands.
 */
export async function queryRequestRetrieval(
  supabase: SupabaseClient,
  { externalId, retrievalMethod }: Input,
): Promise<RetrievalOutcome> {
  const discId = await queryDiscIdByExternalId(supabase, externalId);

  if (discId === null) {
    return 'not-found';
  }

  const { data: updated, error: updateError } = await supabase
    .from('disc_retrievals')
    .update({ retrieval_method: retrievalMethod })
    .eq('disc_id', discId)
    .is('retrieved_at', null)
    .select('id');

  if (updateError) {
    throw new Error(`Noutolistalle lisääminen epäonnistui: ${updateError.message}`);
  }

  if ((updated?.length ?? 0) > 0) {
    return 'done';
  }

  const { error: insertError } = await supabase
    .from('disc_retrievals')
    .insert({ disc_id: discId, retrieval_method: retrievalMethod });

  if (insertError) {
    throw new Error(`Noutolistalle lisääminen epäonnistui: ${insertError.message}`);
  }

  return 'done';
}
