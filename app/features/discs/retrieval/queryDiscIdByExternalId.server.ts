import type { SupabaseClient } from '@supabase/supabase-js';
import { currentClubId } from '~/config/clubs';

/**
 * The numeric id of one of this club's discs, or null when it has no such disc.
 *
 * Every write to disc_retrievals goes through here: the retrieval row is keyed
 * on discs.id, and the lookup that resolves it is also what scopes the write to
 * APP_CLUB_ID — so an id belonging to another club cannot be given an errand on
 * this club's list, even with a valid uuid in hand.
 */
export async function queryDiscIdByExternalId(supabase: SupabaseClient, externalId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('discs')
    .select('id')
    .eq('external_id', externalId)
    .eq('club_id', currentClubId())
    .maybeSingle();

  if (error) {
    throw new Error(`Kiekon haku epäonnistui: ${error.message}`);
  }

  return data?.id ?? null;
}
