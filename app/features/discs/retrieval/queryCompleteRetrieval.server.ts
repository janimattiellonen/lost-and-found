import type { SupabaseClient } from '@supabase/supabase-js';

import { queryDiscIdByExternalId } from './queryDiscIdByExternalId.server';
import type { RetrievalOutcome } from './discRetrieval';

/**
 * Records that one of this club's discs is out of storage, which closes its
 * open request and takes it off the list.
 *
 * Says nothing about the owner having it: the handover is the return mark on
 * the disc itself, and it can be days later.
 *
 * A disc with no open request is reported as 'done' rather than as an error:
 * it is off the list either way, which is what was asked for.
 */
export async function queryCompleteRetrieval(supabase: SupabaseClient, externalId: string): Promise<RetrievalOutcome> {
  const discId = await queryDiscIdByExternalId(supabase, externalId);

  if (discId === null) {
    return 'not-found';
  }

  const { error } = await supabase
    .from('disc_retrievals')
    .update({ retrieved_at: new Date().toISOString() })
    .eq('disc_id', discId)
    .is('retrieved_at', null);

  if (error) {
    throw new Error(`Noudetuksi merkintä epäonnistui: ${error.message}`);
  }

  return 'done';
}
