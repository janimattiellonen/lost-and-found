import type { SupabaseClient } from '@supabase/supabase-js';

import { handoverMethodsFor } from './handoverMethodsFor';
import type { OwnerLinkDisc } from './ownerResponse';

/**
 * The disc behind an owner link, or null when the token resolves to nothing the
 * club is still listing.
 *
 * Goes through owner_link_disc() rather than selecting from discs: the columns
 * an anonymous visitor can reach are then fixed in the migration, not in a
 * query someone could widen later. Null covers an unknown token and a disc
 * already returned, released or archived alike — the page says the same thing
 * for all of them, and nothing is learned from a guess. A disc belonging to
 * another club is not found either: both clubs share this database, and a token
 * opened on the wrong deployment would otherwise be answered with the wrong
 * club's payment and collection details.
 */
export async function queryOwnerLinkDisc(
  supabase: SupabaseClient,
  token: string,
  clubId: number,
): Promise<OwnerLinkDisc | null> {
  const { data, error } = await supabase.rpc('owner_link_disc', { p_token: token, p_club_id: clubId });

  if (error) {
    throw new Error(`Kiekon haku epäonnistui: ${error.message}`);
  }

  const row = (data as any[])?.[0];

  if (!row) {
    return null;
  }

  return {
    discName: row.disc_name,
    discColour: row.disc_colour,
    discManufacturer: row.disc_manufacturer ?? null,
    phoneNumberEnding: row.phone_number_ending ?? null,
    handoverMethods: handoverMethodsFor(row.in_storage === true),
  };
}
