import { format } from 'date-fns';

import { createConnection, createSupabaseServerClient } from '~/models/utils';
import * as process from 'process';

import type { DiscDTO } from '~/types';

import { fromDTO, toDTO } from '~/models/DiscMapper';
import type { DiscDisposalDetails } from '~/features/discs/disposal/discDisposal';
import type { DiscReturnDetails } from '~/features/discs/return/discReturn';

export async function getDiscs(): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  let { data } = await supabase
    .from('discs')
    .select(
      'external_id, internal_disc_id, disc_name, disc_colour, disc_manufacturer, owner_name, owner_phone_number, owner_club_name, added_at',
    )
    .order('disc_name', { ascending: true })
    .eq('is_returned_to_owner', false)
    .eq('can_be_sold_or_donated', false)
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        if (row['owner_phone_number']) {
          row['owner_phone_number'] = row['owner_phone_number'].slice(-4);
        }
        return toDTO(row);
      })
    : [];
}

export async function getDiscsForStats(): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  let { data } = await supabase
    .from('discs')
    .select(
      'internal_disc_id, disc_name, can_be_sold_or_donated, is_returned_to_owner, returned_to_owner_text, returned_to_owner_date, added_at',
    )
    .order('added_at', { ascending: true })
    .eq('club_id', clubId);

  return data
    ? data.map((row: any) => {
        if (row['owner_phone_number']) {
          row['owner_phone_number'] = row['owner_phone_number'].slice(-4);
        }
        return toDTO(row);
      })
    : [];
}

export async function getDiscWithFullPhoneNumber(internalDiscId: number): Promise<DiscDTO> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  let { data } = await supabase
    .from('discs')
    .select('internal_disc_id, owner_phone_number, owner_name, disc_name, disc_colour, notified_at')
    .eq('club_id', clubId)
    .eq('internal_disc_id', internalDiscId)
    .single();

  return toDTO(data);
}

/**
 * Drops keys whose value is undefined.
 *
 * postgrest-js builds the insert's `columns=` parameter from Object.keys(), and
 * an undefined value keeps its key while JSON.stringify removes it from the
 * body — so PostgREST would insert NULL for a column the caller never meant to
 * set, id included.
 */
function withoutUndefined(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

/**
 * Builds the rows for a batch of hand-added discs.
 *
 * Separate from the insert so the row shape can be tested without a database.
 */
export function toInsertRows(discs: DiscDTO[], clubId: number, addedAt: string): Record<string, unknown>[] {
  return discs.map((disc) =>
    withoutUndefined({
      ...fromDTO(disc),
      // Assigned by the database, never sent.
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      external_id: crypto.randomUUID(),
      internal_disc_id: null,
      club_id: clubId,
      added_at: disc.addedAt ?? addedAt,
      is_returned_to_owner: false,
      can_be_sold_or_donated: false,
    }),
  );
}

/**
 * Inserts a batch of discs added by hand through the web app.
 *
 * These have no Google Sheet row, so internal_disc_id is left null and
 * external_id is what identifies them from the outside. The uuid is generated
 * here rather than by a column default, so the caller learns the ids without a
 * second round trip.
 *
 * The club comes from APP_CLUB_ID, not from the request, so a disc can never be
 * filed under another club's list.
 *
 * Returns the external ids of the inserted discs.
 */
export async function createDiscs(discs: DiscDTO[], request: Request): Promise<string[]> {
  const clubId = process.env.APP_CLUB_ID;

  if (discs.length === 0) {
    return [];
  }

  const supabase = createSupabaseServerClient(request);

  const rows = toInsertRows(discs, Number(clubId), format(new Date(), 'y-MM-dd'));

  const { data, error } = await supabase.from('discs').insert(rows).select('external_id');

  if (error) {
    throw new Error(`Kiekkojen tallennus epäonnistui: ${error.message}`);
  }

  return data ? data.map((row: { external_id: string }) => row.external_id) : [];
}

/**
 * Deletes one disc, addressed by its external id.
 *
 * Scoped to APP_CLUB_ID as well, so a club's admin cannot delete another club's
 * disc even with a valid uuid in hand.
 *
 * Returns false when nothing matched — an unknown id, or one belonging to
 * another club — so the caller can tell "already gone" from "deleted".
 */
export async function deleteDisc(externalId: string, request: Request): Promise<boolean> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase
    .from('discs')
    .delete()
    .eq('external_id', externalId)
    .eq('club_id', clubId)
    .select('external_id');

  if (error) {
    throw new Error(`Kiekon poisto epäonnistui: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

/**
 * What came of a mark: the row was updated, no such row exists for this club,
 * or the row is there but the update changed nothing.
 *
 * The last case is worth keeping separate: a row-level security policy filters
 * an UPDATE by returning zero rows rather than by raising an error, so a
 * missing permission and a missing disc otherwise look identical.
 */
export type MarkOutcome = 'updated' | 'not-found' | 'not-permitted';

/**
 * Applies a patch to one disc, addressed by its external id and scoped to
 * APP_CLUB_ID, and reports which of the three outcomes happened.
 */
async function updateDisc(
  externalId: string,
  patch: Record<string, unknown>,
  request: Request,
  failureMessage: string,
): Promise<MarkOutcome> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createSupabaseServerClient(request);

  const { data, error } = await supabase
    .from('discs')
    .update(patch)
    .eq('external_id', externalId)
    .eq('club_id', clubId)
    .select('external_id');

  if (error) {
    throw new Error(`${failureMessage}: ${error.message}`);
  }

  if ((data?.length ?? 0) > 0) {
    return 'updated';
  }

  // Nothing was updated. Read the row back to find out whether it is there at
  // all: SELECT is open to everyone, so this succeeds even when UPDATE is not
  // permitted.
  const { data: existing } = await supabase
    .from('discs')
    .select('external_id')
    .eq('external_id', externalId)
    .eq('club_id', clubId);

  return (existing?.length ?? 0) > 0 ? 'not-permitted' : 'not-found';
}

/**
 * Marks one disc as returned to its owner, addressed by its external id.
 *
 * Replaces the free-text note that used to be typed into the Google Sheet
 * ("29.8.2026 (Janimatti), postitettu") with the same facts as data. The text
 * column is left untouched, so the sheet-imported history stays as it is.
 *
 * Scoped to APP_CLUB_ID as well as the uuid. Returns false when nothing
 * matched.
 */
export async function markAsReturned(
  externalId: string,
  details: DiscReturnDetails,
  request: Request,
): Promise<MarkOutcome> {
  return updateDisc(
    externalId,
    {
      is_returned_to_owner: true,
      returned_to_owner_date: details.returnedToOwnerDate,
      return_method: details.returnMethod,
    },
    request,
    'Kiekon merkitseminen palautetuksi epäonnistui',
  );
}

/**
 * Marks one disc as free to be sold or donated, addressed by its external id.
 *
 * The counterpart to markAsReturned: the same date-and-method pair, on the
 * can_be_sold_or_donated columns. The text column is left untouched, so the
 * sheet-imported history stays as it is.
 *
 * Scoped to APP_CLUB_ID as well as the uuid. Returns false when nothing
 * matched.
 */
export async function markForDisposal(
  externalId: string,
  details: DiscDisposalDetails,
  request: Request,
): Promise<MarkOutcome> {
  return updateDisc(
    externalId,
    {
      can_be_sold_or_donated: true,
      can_be_sold_or_donated_date: details.canBeSoldOrDonatedDate,
      can_be_sold_or_donated_method: details.canBeSoldOrDonatedMethod,
    },
    request,
    'Kiekon merkitseminen myytäväksi tai lahjoitettavaksi epäonnistui',
  );
}
