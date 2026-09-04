import type { SupabaseClient } from '@supabase/supabase-js';

import { currentClubId } from '~/config/clubs';
import { isHandoverMethod } from '~/features/discs/handoverMethod';
import { isOwnerChoice } from './ownerChoice';
import type { OwnerResponseSummary } from './ownerResponse';

const RESPONSE_COLUMNS =
  'id, responded_at, choice, handover_method, has_more_discs, shipping_name, shipping_street, shipping_postal_code, ' +
  'shipping_city, shipping_country, discs!inner(external_id, disc_name, disc_colour, owner_name, owner_phone_number)';

/**
 * What the select above reads back.
 *
 * A select built from a string cannot be typed by supabase-js, so declaring the
 * columns asked for and casting once puts the checking back where the shape is
 * known — beside the select that names them.
 */
type Row = {
  id: number;
  responded_at: string;
  choice: number;
  handover_method: number | null;
  has_more_discs: boolean | null;
  shipping_name: string | null;
  shipping_street: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  discs: {
    external_id: string;
    disc_name: string;
    disc_colour: string;
    owner_name: string | null;
    owner_phone_number: string | null;
  };
};

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
    .eq('discs.club_id', currentClubId())
    .order('responded_at', { ascending: false });

  if (error) {
    throw new Error(`Vastausten haku epäonnistui: ${error.message}`);
  }

  return ((data ?? []) as unknown as Row[]).flatMap((row) => {
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
        hasMoreDiscs: row.has_more_discs === true,
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
