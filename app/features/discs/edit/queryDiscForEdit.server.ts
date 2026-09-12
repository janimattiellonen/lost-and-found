import type { SupabaseClient } from '@supabase/supabase-js';

import type { DiscEditValues } from '~/features/discs/edit/discEdit';
import { isDisposalMethod, isReturnMethod } from '~/discMethods';

/**
 * The columns the edit form fills itself in from. Listed rather than selected
 * with `*` so nothing the form cannot write — the owner link token above all —
 * is read into a page that an admin's browser receives.
 */
const EDITABLE_COLUMNS =
  'disc_name, disc_colour, disc_manufacturer, owner_name, owner_phone_number, course, additional_info, ' +
  'is_returned_to_owner, returned_to_owner_date, return_method, ' +
  'can_be_sold_or_donated, can_be_sold_or_donated_date, can_be_sold_or_donated_method';

type Input = {
  /** The uuid the disc is addressed by. */
  externalId: string;
  /** The club this deployment serves; every read is scoped to it. */
  clubId: number;
};

/**
 * One disc's editable values, addressed by its external id (the uuid every disc
 * carries, sheet-imported or added through the web app) and scoped to the club
 * this deployment serves.
 *
 * Null when this club has no such disc, so the caller can answer 404 rather
 * than render an empty form. Unlike the public list, the owner's phone number
 * comes back whole: this page exists to correct it.
 */
export async function queryDiscForEdit(
  supabase: SupabaseClient,
  { externalId, clubId }: Input,
): Promise<DiscEditValues | null> {
  const { data } = await supabase
    .from('discs')
    .select(EDITABLE_COLUMNS)
    .eq('external_id', externalId)
    .eq('club_id', clubId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  // Cast through unknown: with no generated database types, supabase-js infers
  // the row shape from the select string and gets it wrong for a concatenated
  // one.
  const row = data as unknown as Record<string, unknown>;

  return {
    discName: (row.disc_name as string) ?? '',
    discColour: (row.disc_colour as string) ?? '',
    discManufacturer: (row.disc_manufacturer as string) ?? null,
    ownerName: (row.owner_name as string) ?? null,
    ownerPhoneNumber: (row.owner_phone_number as string) ?? null,
    course: (row.course as string) ?? null,
    additionalInfo: (row.additional_info as string) ?? null,
    isReturnedToOwner: row.is_returned_to_owner === true,
    returnedToOwnerDate: (row.returned_to_owner_date as string) ?? null,
    // Narrowed rather than asserted, as DiscMapper does: the CHECK constraint
    // should make an out-of-range value impossible, so treat one as unrecorded.
    returnMethod: isReturnMethod(row.return_method) ? row.return_method : null,
    canBeSoldOrDonated: row.can_be_sold_or_donated === true,
    canBeSoldOrDonatedDate: (row.can_be_sold_or_donated_date as string) ?? null,
    canBeSoldOrDonatedMethod: isDisposalMethod(row.can_be_sold_or_donated_method)
      ? row.can_be_sold_or_donated_method
      : null,
  };
}
