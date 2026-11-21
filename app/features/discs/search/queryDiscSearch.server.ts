import type { SupabaseClient } from '@supabase/supabase-js';

import { isDisposalMethod, isReturnMethod } from '~/discMethods';
import { MAX_RESULTS, discNamePattern, type DiscSearch } from '~/features/discs/search/discSearch';
import type { DiscMarks } from '~/features/discs/search/discStatus';
import { phoneSearchPattern } from '~/phoneNumber';

/** One disc as the search page shows it. */
export type FoundDisc = DiscMarks & {
  externalId: string;
  discName: string;
  discColour: string;
  ownerName: string | null;
  ownerPhoneNumber: string | null;
  addedAt: string | null;
  course: string | null;
};

/**
 * The columns the results table shows. Listed rather than `*`, so neither the
 * club's private notes nor the owner link token is read into a page an admin's
 * browser receives.
 */
const FOUND_COLUMNS =
  'external_id, disc_name, disc_colour, owner_name, owner_phone_number, added_at, course, ' +
  'is_returned_to_owner, returned_to_owner_date, return_method, ' +
  'can_be_sold_or_donated, can_be_sold_or_donated_date, can_be_sold_or_donated_method, archived_at';

/**
 * What the select above reads back. A select built from a string cannot be
 * typed by supabase-js, so the shape is declared beside it and cast once.
 */
type Row = {
  external_id: string;
  disc_name: string;
  disc_colour: string;
  owner_name: string | null;
  owner_phone_number: string | null;
  added_at: string | null;
  course: string | null;
  is_returned_to_owner: boolean | null;
  returned_to_owner_date: string | null;
  return_method: number | null;
  can_be_sold_or_donated: boolean | null;
  can_be_sold_or_donated_date: string | null;
  can_be_sold_or_donated_method: number | null;
  archived_at: string | null;
};

type Input = {
  /** The club this deployment serves; the search never leaves it. */
  clubId: number;
  search: DiscSearch;
};

/**
 * Every disc of the club that matches, whatever its status, newest first.
 *
 * There is deliberately no condition on the returned, released or archived
 * marks: finding the discs the front page no longer shows is what the search is
 * for. One row more than the page shows is asked for, so the caller can tell
 * "exactly a hundred" from "more than a hundred".
 *
 * A database failure throws: an empty table would tell the admin the disc is
 * not on file.
 */
export async function queryDiscSearch(supabase: SupabaseClient, { clubId, search }: Input): Promise<FoundDisc[]> {
  let query = supabase.from('discs').select(FOUND_COLUMNS).eq('club_id', clubId);

  if (search.phone !== null) {
    query = query.regexMatch('owner_phone_number', phoneSearchPattern(search.phone));
  }

  if (search.disc !== null) {
    query = query.ilike('disc_name', discNamePattern(search.disc));
  }

  const { data, error } = await query
    .order('added_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .limit(MAX_RESULTS + 1);

  if (error) {
    throw new Error('Kiekkojen haku epäonnistui.', { cause: error });
  }

  return (data as unknown as Row[]).map(toFoundDisc);
}

function toFoundDisc(row: Row): FoundDisc {
  return {
    externalId: row.external_id,
    discName: row.disc_name,
    discColour: row.disc_colour,
    ownerName: row.owner_name,
    ownerPhoneNumber: row.owner_phone_number,
    addedAt: row.added_at,
    course: row.course,
    isReturnedToOwner: row.is_returned_to_owner === true,
    returnedToOwnerDate: row.returned_to_owner_date,
    // Narrowed rather than asserted, as queryDiscForEdit does: the CHECK
    // constraint should make an out-of-range value impossible, so treat one as
    // unrecorded.
    returnMethod: isReturnMethod(row.return_method) ? row.return_method : null,
    canBeSoldOrDonated: row.can_be_sold_or_donated === true,
    canBeSoldOrDonatedDate: row.can_be_sold_or_donated_date,
    canBeSoldOrDonatedMethod: isDisposalMethod(row.can_be_sold_or_donated_method)
      ? row.can_be_sold_or_donated_method
      : null,
    archivedAt: row.archived_at,
  };
}
