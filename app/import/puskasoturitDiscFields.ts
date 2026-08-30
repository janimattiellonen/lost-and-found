import type { DiscDTO } from '~/types';

/**
 * Turns the free-text columns of the Puskasoturit sheet into the typed columns
 * `discs` grew later (returned_to_owner_date, return_method,
 * can_be_sold_or_donated_method) and cleans up the course names.
 *
 * Everything here is best-effort: a note that does not carry a date or a method
 * simply yields null, and the original text is stored alongside regardless.
 *
 * The two method maps repeat the numbers from
 * ~/features/discs/return/returnMethod and ~/features/discs/disposal/disposalMethod
 * rather than importing them, so this module (and the import script that uses
 * it) stays free of `~/` runtime imports and runs under plain `node`. The
 * accompanying test asserts the numbers still match those enums.
 */

/** 0 = postitettu (ByMail), 1 = noudettu (PickedUp). */
export const RETURN_METHOD_BY_MAIL = 0;
export const RETURN_METHOD_PICKED_UP = 1;

/** 0 = myydään (Sold), 1 = lahjoitetaan (Donated). */
export const DISPOSAL_METHOD_SOLD = 0;
export const DISPOSAL_METHOD_DONATED = 1;

// The sheet is typed by hand, so the same course arrives spelled several ways.
const COURSE_SPELLINGS: Record<string, string> = {
  oittaa: 'Oittaa',
  oiittaa: 'Oittaa',
  aijanpelto: 'Äijänpelto',
  äijänpelto: 'Äijänpelto',
};

/**
 * The course name as the app should store it, or null when the row has none.
 * Without this, "Oiittaa" and "ÄIjänpelto" would each become an extra option in
 * the course filter.
 */
export function normalizeCourse(course?: string | null): string | null {
  const key = course?.trim().toLowerCase();

  if (!key) {
    return null;
  }

  return COURSE_SPELLINGS[key] ?? course!.trim();
}

// "14.5.2026 (Janimatti), noudettu". The lookahead rejects a mistyped year
// such as "17.7.10126" instead of silently reading it as the year 1012.
const DATE_PATTERN = /(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/;

/** The date mentioned in a note, as y-MM-dd, or null if there is none. */
export function parseNoteDate(text?: string | null): string | null {
  const match = text?.match(DATE_PATTERN);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match.map(Number);

  // Rejects both an impossible date and one that says 31.2., which Date would
  // otherwise roll over into March.
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

/**
 * How the disc got back to its owner. Matches the stems rather than the whole
 * word, so the typos in the sheet ("noudwttu", "kaveri nouti") still land.
 */
export function parseReturnMethod(text?: string | null): number | null {
  if (!text) {
    return null;
  }

  if (/noud|nout/i.test(text)) {
    return RETURN_METHOD_PICKED_UP;
  }

  if (/postit/i.test(text)) {
    return RETURN_METHOD_BY_MAIL;
  }

  return null;
}

/**
 * What is to happen to a disc the club is releasing. "Roskiin" (thrown away) is
 * neither, so it stays null.
 */
export function parseDisposalMethod(text?: string | null): number | null {
  if (!text) {
    return null;
  }

  if (/lahjoit/i.test(text)) {
    return DISPOSAL_METHOD_DONATED;
  }

  if (/myyd|muyyd/i.test(text)) {
    return DISPOSAL_METHOD_SOLD;
  }

  return null;
}

/** A `discs` row, ready to insert. */
export type DiscRow = {
  external_id: string;
  internal_disc_id: number;
  club_id: number;
  disc_name: string;
  disc_colour: string | null;
  disc_manufacturer: string | null;
  owner_name: string | null;
  owner_phone_number: string | null;
  added_at: string | null;
  additional_info: string | null;
  course: string | null;
  is_returned_to_owner: boolean;
  returned_to_owner_text: string | null;
  returned_to_owner_date: string | null;
  return_method: number | null;
  can_be_sold_or_donated: boolean;
  can_be_sold_or_donated_text: string | null;
  can_be_sold_or_donated_date: string | null;
  can_be_sold_or_donated_method: number | null;
};

function orNull(value?: string | null): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

/**
 * The imported disc as a row of the `discs` table, with the free-text notes
 * also read into the typed columns.
 *
 * The external id is generated here rather than left to a column default, so
 * the app does not depend on one being in place — the same reasoning as in
 * ~/models/syncDiscs.server.
 */
export function toDiscRow(disc: DiscDTO): DiscRow {
  return {
    external_id: crypto.randomUUID(),
    internal_disc_id: Number(disc.internalDiscId),
    club_id: disc.clubId!,
    disc_name: disc.discName,
    disc_colour: orNull(disc.discColour),
    disc_manufacturer: orNull(disc.discManufacturer),
    owner_name: orNull(disc.ownerName),
    owner_phone_number: orNull(disc.ownerPhoneNumber),
    added_at: disc.addedAt ?? null,
    additional_info: orNull(disc.additionalInfo),
    course: normalizeCourse(disc.course),
    is_returned_to_owner: !!disc.isReturnedToOwner,
    returned_to_owner_text: orNull(disc.returnedToOwnerText),
    returned_to_owner_date: parseNoteDate(disc.returnedToOwnerText),
    return_method: parseReturnMethod(disc.returnedToOwnerText),
    can_be_sold_or_donated: !!disc.canBeSoldOrDonated,
    can_be_sold_or_donated_text: orNull(disc.canBeSoldOrDonatedText),
    can_be_sold_or_donated_date: parseNoteDate(disc.canBeSoldOrDonatedText),
    can_be_sold_or_donated_method: parseDisposalMethod(disc.canBeSoldOrDonatedText),
  };
}
