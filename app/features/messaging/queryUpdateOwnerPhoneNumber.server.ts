import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * What came of the update: the row was written, or nothing matched — this club
 * has no disc with that uuid, or row level security refused the write, which it
 * does by filtering the UPDATE down to zero rows rather than by raising an
 * error. The admin's next step is the same either way.
 */
export type OwnerPhoneNumberOutcome = 'updated' | 'not-found';

type Input = {
  /** The uuid the disc is addressed by. */
  externalId: string;
  /** The club this deployment serves; the write is scoped to it. */
  clubId: number;
  phoneNumber: string;
};

/**
 * Writes one disc's owner phone number, addressed by its external id and
 * scoped to the club this deployment serves.
 *
 * Throws a Finnish sentence on a database failure; the driver's own words are
 * kept as the cause rather than shown to the admin.
 */
export async function queryUpdateOwnerPhoneNumber(
  supabase: SupabaseClient,
  { externalId, clubId, phoneNumber }: Input,
): Promise<OwnerPhoneNumberOutcome> {
  const { data, error } = await supabase
    .from('discs')
    .update({
      owner_phone_number: phoneNumber,
      // A hand-edit like the edit form's, so it leaves the same trace there.
      updated_at: new Date().toISOString(),
    })
    .eq('external_id', externalId)
    .eq('club_id', clubId)
    .select('external_id');

  if (error) {
    throw new Error('Puhelinnumeron tallennus epäonnistui.', { cause: error });
  }

  return (data?.length ?? 0) > 0 ? 'updated' : 'not-found';
}
