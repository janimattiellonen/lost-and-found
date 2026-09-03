import type { SupabaseClient } from '@supabase/supabase-js';

/** Whether the answer was there to be marked, for the caller to answer with. */
export type HandledOutcome = 'done' | 'not-found';

/**
 * Marks one answer as dealt with, which takes it off the admin's list.
 *
 * The row is read first, for two reasons: the update has to be scoped to this
 * instance's club, which PostgREST cannot express as a filter on a joined table
 * in an UPDATE, and the address wipe below should only claim to have happened
 * when there was an address.
 *
 * Wiping it is the point of doing it here: a shipping address is needed to put
 * on a parcel and for nothing after that, and the club should not end up
 * holding a standing list of members' home addresses. What the owner asked for
 * stays — only where they live goes.
 */
export async function queryMarkResponseHandled(supabase: SupabaseClient, responseId: number): Promise<HandledOutcome> {
  const { data: existing, error: readError } = await supabase
    .from('disc_owner_responses')
    .select('id, shipping_street, discs!inner(club_id)')
    .eq('id', responseId)
    .eq('discs.club_id', process.env.APP_CLUB_ID)
    .maybeSingle();

  if (readError) {
    throw new Error(`Vastauksen haku epäonnistui: ${readError.message}`);
  }

  if (!existing) {
    return 'not-found';
  }

  const now = new Date().toISOString();

  const wipe = (existing as any).shipping_street
    ? {
        shipping_name: null,
        shipping_street: null,
        shipping_postal_code: null,
        shipping_city: null,
        shipping_country: null,
        shipping_cleared_at: now,
      }
    : {};

  const { error } = await supabase
    .from('disc_owner_responses')
    .update({ handled_at: now, ...wipe })
    .eq('id', responseId);

  if (error) {
    throw new Error(`Vastauksen merkitseminen käsitellyksi epäonnistui: ${error.message}`);
  }

  return 'done';
}
