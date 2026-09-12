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

/**
 * What the select above reads back.
 *
 * A select built from a string cannot be typed by supabase-js, so declaring the
 * columns asked for and casting once puts the checking back where the shape is
 * known — beside the select that names them.
 */
type Row = {
  disc_name: string;
  disc_colour: string;
  disc_manufacturer: string | null;
  owner_name: string | null;
  owner_phone_number: string | null;
  course: string | null;
  additional_info: string | null;
  is_returned_to_owner: boolean | null;
  returned_to_owner_date: string | null;
  return_method: number | null;
  can_be_sold_or_donated: boolean | null;
  can_be_sold_or_donated_date: string | null;
  can_be_sold_or_donated_method: number | null;
};

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
 * than render an empty form. A database failure throws instead: a page that
 * said "no such disc" because the database was unreachable would send the admin
 * looking for a disc that is sitting right there.
 *
 * Unlike the public list, the owner's phone number comes back whole: this page
 * exists to correct it.
 */
export async function queryDiscForEdit(
  supabase: SupabaseClient,
  { externalId, clubId }: Input,
): Promise<DiscEditValues | null> {
  const { data, error } = await supabase
    .from('discs')
    .select(EDITABLE_COLUMNS)
    .eq('external_id', externalId)
    .eq('club_id', clubId)
    .maybeSingle();

  if (error) {
    throw new Error('Kiekon tietojen haku epäonnistui.', { cause: error });
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as Row;

  return {
    discName: row.disc_name,
    discColour: row.disc_colour,
    discManufacturer: row.disc_manufacturer,
    ownerName: row.owner_name,
    ownerPhoneNumber: row.owner_phone_number,
    course: row.course,
    additionalInfo: row.additional_info,
    isReturnedToOwner: row.is_returned_to_owner === true,
    returnedToOwnerDate: row.returned_to_owner_date,
    // Narrowed rather than asserted, as DiscMapper does: the CHECK constraint
    // should make an out-of-range value impossible, so treat one as unrecorded.
    returnMethod: isReturnMethod(row.return_method) ? row.return_method : null,
    canBeSoldOrDonated: row.can_be_sold_or_donated === true,
    canBeSoldOrDonatedDate: row.can_be_sold_or_donated_date,
    canBeSoldOrDonatedMethod: isDisposalMethod(row.can_be_sold_or_donated_method)
      ? row.can_be_sold_or_donated_method
      : null,
  };
}
