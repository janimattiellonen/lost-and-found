import type { SupabaseClient } from '@supabase/supabase-js';

import type { DiscEditValues } from '~/features/discs/edit/discEdit';

/**
 * What came of the update: the row was written, or nothing matched — this club
 * has no disc with that uuid, or row level security refused the write, which it
 * does by filtering the UPDATE down to zero rows rather than by raising an
 * error.
 *
 * The two are not told apart here as `models/discs.server.ts` does for the row
 * actions: this page has already read the disc back in its loader, so "nothing
 * matched" on the save means it went away or was never this club's, and the
 * admin's next step is the same either way.
 */
export type DiscUpdateOutcome = 'updated' | 'not-found';

type Input = {
  /** The uuid the disc is addressed by. */
  externalId: string;
  /** The club this deployment serves; every write is scoped to it. */
  clubId: number;
  values: DiscEditValues;
};

/**
 * Writes every editable column of one disc at once, addressed by its external
 * id and scoped to the club this deployment serves.
 *
 * Every column is written on every save, including the ones back to null: that
 * is what lets the form clear a colour, or take a date off a disc whose
 * "returned" box has just been unticked.
 *
 * Throws a Finnish sentence on a database failure; the driver's own words are
 * kept as the cause rather than shown to the admin, who can do nothing with a
 * PostgREST error code.
 */
export async function queryUpdateDisc(
  supabase: SupabaseClient,
  { externalId, clubId, values }: Input,
): Promise<DiscUpdateOutcome> {
  const { data, error } = await supabase
    .from('discs')
    .update({
      disc_name: values.discName,
      disc_colour: values.discColour,
      disc_manufacturer: values.discManufacturer,
      owner_name: values.ownerName,
      owner_phone_number: values.ownerPhoneNumber,
      course: values.course,
      additional_info: values.additionalInfo,
      is_returned_to_owner: values.isReturnedToOwner,
      returned_to_owner_date: values.returnedToOwnerDate,
      return_method: values.returnMethod,
      can_be_sold_or_donated: values.canBeSoldOrDonated,
      can_be_sold_or_donated_date: values.canBeSoldOrDonatedDate,
      can_be_sold_or_donated_method: values.canBeSoldOrDonatedMethod,
      // The one trace a hand-edit leaves. Set here and nowhere else in the disc
      // writes: the row actions do not maintain the column, so it says when this
      // disc was last edited by hand, not when it last changed at all.
      updated_at: new Date().toISOString(),
    })
    .eq('external_id', externalId)
    .eq('club_id', clubId)
    .select('external_id');

  if (error) {
    throw new Error('Kiekon tallennus epäonnistui.', { cause: error });
  }

  return (data?.length ?? 0) > 0 ? 'updated' : 'not-found';
}
