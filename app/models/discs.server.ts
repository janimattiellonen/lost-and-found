import { format } from 'date-fns';

import { createConnection, createSupabaseServerClient } from '~/models/utils';
import * as process from 'process';

import type { DiscDTO } from '~/types';

import { fromDTO, toDTO } from '~/models/DiscMapper';
import type { DiscDisposalDetails } from '~/features/discs/disposal/discDisposal';
import type { DiscReturnDetails } from '~/features/discs/return/discReturn';

/** The columns the public disc list is built from. Safe for anyone to see. */
const PUBLIC_DISC_COLUMNS =
  'external_id, internal_disc_id, disc_name, disc_colour, disc_manufacturer, owner_name, owner_phone_number, owner_club_name, added_at, course';

/**
 * How many digits of an owner's phone number the public list may show.
 *
 * Enough for an owner to recognise their own number, not enough for anyone
 * else to dial it. The list page's phone search matches on these four whether
 * or not the viewer is signed in.
 */
const PUBLIC_PHONE_DIGITS = 4;

/** What the send-message pages read of a disc, phone number included. */
const MESSAGING_DISC_COLUMNS =
  'external_id, internal_disc_id, owner_phone_number, owner_name, disc_name, disc_colour, notified_at';

/**
 * Maps the rows behind the disc list, cutting each owner's phone number down to
 * its last digits unless the viewer is signed in.
 *
 * Separate from the query so the rule can be checked without a database, as
 * with toInsertRows. Copies the row rather than editing it, so nothing else
 * holding a reference sees a number shorten under it.
 */
export function toListedDiscs(rows: any[], includeAdminFields: boolean): DiscDTO[] {
  return rows.map((row) => {
    if (includeAdminFields || !row['owner_phone_number']) {
      return toDTO(row);
    }

    return toDTO({ ...row, owner_phone_number: row['owner_phone_number'].slice(-PUBLIC_PHONE_DIGITS) });
  });
}

/**
 * The discs this club is currently listing.
 *
 * `includeAdminFields` covers everything only a signed-in user may see: the
 * club-internal notes in `additional_info`, and the owner's full phone number.
 * The caller establishes the session — passing true on an unauthenticated
 * request hands out both.
 *
 * The notes are left out of the SELECT rather than stripped afterwards, so
 * they cannot reach the response by way of a forgotten mapping. The phone
 * number has to be read either way, since the public list shows its last four
 * digits, so that one is truncated on the way out.
 */
export async function getDiscs(includeAdminFields = false): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  const { data } = await supabase
    .from('discs')
    .select(includeAdminFields ? `${PUBLIC_DISC_COLUMNS}, additional_info` : PUBLIC_DISC_COLUMNS)
    .order('disc_name', { ascending: true })
    .eq('is_returned_to_owner', false)
    .eq('can_be_sold_or_donated', false)
    // Archived discs are ones the club has stopped listing; they are still in
    // the table, and still counted in the statistics.
    .is('archived_at', null)
    .eq('club_id', clubId);

  // Truncated here rather than in the table: what is not sent cannot be read
  // out of the page source or the loader's JSON payload.
  return data ? toListedDiscs(data, includeAdminFields) : [];
}

export async function getDiscsForStats(): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  const supabase = createConnection();

  const { data } = await supabase
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

/**
 * One disc for the send-message page, phone number and all.
 *
 * Addressed by external_id rather than internal_disc_id: the latter is a
 * Google Sheet row number, which a disc added through the web app does not
 * have. Null when the club has no such disc, so the caller can answer 404
 * rather than map an absent row.
 */
export async function getDiscWithFullPhoneNumber(externalId: string): Promise<DiscDTO | null> {
  const [disc] = await getDiscsWithFullPhoneNumbers([externalId]);

  return disc ?? null;
}

/**
 * The same discs as getDiscWithFullPhoneNumber, for a batch of external ids.
 *
 * Returned in the order the ids were given, which is the order the admin saw
 * them in the list, not the order the database happens to return. An id this
 * club has no disc for is left out rather than held as a gap, so the caller
 * can tell how many of the selection it actually has.
 */
export async function getDiscsWithFullPhoneNumbers(externalIds: string[]): Promise<DiscDTO[]> {
  const clubId = process.env.APP_CLUB_ID;

  if (externalIds.length === 0) {
    return [];
  }

  const supabase = createConnection();

  const { data } = await supabase
    .from('discs')
    .select(MESSAGING_DISC_COLUMNS)
    .eq('club_id', clubId)
    .in('external_id', externalIds);

  if (!data) {
    return [];
  }

  const byExternalId = new Map(data.map((row: any) => [row.external_id, toDTO(row)]));

  return externalIds.map((externalId) => byExternalId.get(externalId)).filter((disc): disc is DiscDTO => disc != null);
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
 * Files one disc under a course, addressed by its external id.
 *
 * The fix for a disc saved before the course was picked, which otherwise meant
 * editing the row by hand in the SQL editor. Null clears the course, so a disc
 * filed under the wrong one can be put back to having none.
 *
 * The caller checks the name against the club's courses; this only writes it.
 *
 * Scoped to APP_CLUB_ID as well as the uuid.
 */
export async function setDiscCourse(externalId: string, course: string | null, request: Request): Promise<MarkOutcome> {
  return updateDisc(externalId, { course }, request, 'Radan tallennus epäonnistui');
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
