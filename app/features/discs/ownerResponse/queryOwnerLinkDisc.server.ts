import type { SupabaseClient } from '@supabase/supabase-js';

import { HandoverMethod, type HandoverMethodValue } from '~/features/discs/handoverMethod';
import type { OwnerLinkDisc } from './ownerResponse';

/**
 * The disc behind an owner link, or null when the token resolves to nothing the
 * club is still listing.
 *
 * Goes through owner_link_disc() rather than selecting from discs: the columns
 * an anonymous visitor can reach are then fixed in the migration, not in a
 * query someone could widen later. Null covers an unknown token and a disc
 * already returned, released or archived alike — the page says the same thing
 * for all of them, and nothing is learned from a guess.
 */
export async function queryOwnerLinkDisc(supabase: SupabaseClient, token: string): Promise<OwnerLinkDisc | null> {
  const { data, error } = await supabase.rpc('owner_link_disc', { p_token: token });

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

/**
 * What the owner may choose, from where the disc is.
 *
 * Post and collecting from the admin always work. Collecting from the club's
 * storage is only on offer while the disc is actually in it — a disc already
 * fetched home is not there to be collected from, and a club whose discs never
 * go to a storage has no third option at all.
 */
export function handoverMethodsFor(isInStorage: boolean): HandoverMethodValue[] {
  const methods: HandoverMethodValue[] = [HandoverMethod.ByMail, HandoverMethod.PickedUpFromHome];

  return isInStorage ? [...methods, HandoverMethod.PickedUpFromStorage] : methods;
}
