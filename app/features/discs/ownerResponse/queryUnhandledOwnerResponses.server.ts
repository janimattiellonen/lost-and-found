import type { SupabaseClient } from '@supabase/supabase-js';

import { isHandoverMethod } from '~/features/discs/handoverMethod';
import { isOwnerChoice } from './ownerChoice';
import type { OwnerResponseSummary } from './ownerResponse';

const RESPONSE_COLUMNS =
  'id, responded_at, choice, handover_method, shipping_name, shipping_street, shipping_postal_code, ' +
  'shipping_city, shipping_country, discs!inner(external_id, disc_name, disc_colour, owner_name, owner_phone_number)';

/**
 * The answers the admin has not dealt with yet, newest first.
 *
 * Scoped to this instance's club through the join, so one club's admin never
 * reads another club's answers — or the phone numbers and addresses in them.
 * Only ever read behind a signed-in page.
 */
export async function queryUnhandledOwnerResponses(supabase: SupabaseClient): Promise<OwnerResponseSummary[]> {
  const { data, error } = await supabase
    .from('disc_owner_responses')
    .select(RESPONSE_COLUMNS)
    .is('handled_at', null)
    .eq('discs.club_id', process.env.APP_CLUB_ID)
    .order('responded_at', { ascending: false });

  if (error) {
    throw new Error(`Vastausten haku epäonnistui: ${error.message}`);
  }

  return ((data ?? []) as any[]).flatMap((row) => {
    // A choice outside the enum should be impossible: the CHECK constraint
    // covers it. If one appears, leaving it out beats rendering a card that
    // says nothing.
    if (!isOwnerChoice(row.choice)) {
      return [];
    }

    return [
      {
        id: row.id,
        externalId: row.discs.external_id,
        discName: row.discs.disc_name,
        discColour: row.discs.disc_colour,
        ownerName: row.discs.owner_name ?? null,
        ownerPhoneNumber: row.discs.owner_phone_number ?? null,
        choice: row.choice,
        handoverMethod: isHandoverMethod(row.handover_method) ? row.handover_method : null,
        respondedAt: row.responded_at,
        address: row.shipping_street
          ? {
              name: row.shipping_name ?? '',
              street: row.shipping_street,
              postalCode: row.shipping_postal_code ?? '',
              city: row.shipping_city ?? '',
              country: row.shipping_country ?? '',
            }
          : null,
      },
    ];
  });
}

/**
 * How many answers are waiting, for the count beside the menu item.
 *
 * Counts in the database rather than fetching the rows to measure them, and so
 * reads neither a phone number nor an address to do it.
 */
export async function queryUnhandledOwnerResponseCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('disc_owner_responses')
    .select('id, discs!inner(id)', { head: true, count: 'exact' })
    .is('handled_at', null)
    .eq('discs.club_id', process.env.APP_CLUB_ID);

  if (error) {
    throw new Error(`Vastausten laskenta epäonnistui: ${error.message}`);
  }

  return count ?? 0;
}
