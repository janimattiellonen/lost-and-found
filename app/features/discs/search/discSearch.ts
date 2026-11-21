import { MAX_FIELD_LENGTH } from '~/discFieldLimits';

/** Fewer characters than this find too many discs to be worth a request. */
const MIN_DISC_LENGTH = 2;

/** Fewer digits than this match a large share of every number on file. */
const MIN_PHONE_DIGITS = 3;

/** The most discs one search shows; the newest are kept. */
export const MAX_RESULTS = 100;

/**
 * A search worth running: each field that holds enough to search with, or null
 * for one that does not. At least one of the two is set — a search with neither
 * is no search at all, and `readDiscSearch` returns null for it instead.
 *
 * `phone` is in the search's own form: digits only, with a leading "+" kept if
 * one was typed, because `phoneSearchDigits` reads "+358…" differently from
 * "0…". Two typings of one number ("050 111 2222", "050-1112222") are the same
 * search and the same address.
 */
export type DiscSearch = {
  phone: string | null;
  disc: string | null;
};

/** What the two fields, or the two query parameters, hold. */
type Fields = {
  phone?: string | null;
  disc?: string | null;
};

/**
 * Reads the two fields into a search, or null when neither holds enough.
 *
 * Used by both the page, to decide whether to search at all, and the loader,
 * so an address typed by hand obeys the same minimums. Input over the column
 * limit is cut rather than refused: a search for a 300-character paste is
 * still a search.
 */
export function readDiscSearch({ phone, disc }: Fields): DiscSearch | null {
  const search = { phone: readPhone(phone), disc: readDisc(disc) };

  return search.phone === null && search.disc === null ? null : search;
}

/**
 * The query string for a search: only the fields that take part, so the
 * address says exactly what was searched. Empty for no search.
 */
export function toSearchParams(search: DiscSearch | null): URLSearchParams {
  const params = new URLSearchParams();

  if (search?.phone != null) {
    params.set('phone', search.phone);
  }

  if (search?.disc != null) {
    params.set('disc', search.disc);
  }

  return params;
}

/**
 * The `ILIKE` pattern a disc name is matched with: the text anywhere in it.
 *
 * `%`, `_` and `\` are escaped so they match themselves. (`*` never gets this
 * far; see `readDisc`.)
 */
export function discNamePattern(disc: string): string {
  return `%${disc.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

function readPhone(value: string | null | undefined): string | null {
  const entered = (value ?? '').slice(0, MAX_FIELD_LENGTH).trim();
  const digits = entered.replace(/\D/g, '');

  if (digits.length < MIN_PHONE_DIGITS) {
    return null;
  }

  return entered.startsWith('+') ? `+${digits}` : digits;
}

/**
 * `*` is dropped before the minimum is counted: PostgREST, which carries the
 * pattern to the database, reads it as another `%` and has no way to escape it,
 * so "a*" would otherwise be a one-letter search. No disc name needs a literal
 * asterisk to be found.
 */
function readDisc(value: string | null | undefined): string | null {
  const entered = (value ?? '').slice(0, MAX_FIELD_LENGTH).replace(/\*/g, '').trim();

  return entered.length < MIN_DISC_LENGTH ? null : entered;
}
