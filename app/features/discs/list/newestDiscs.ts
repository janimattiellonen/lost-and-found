/** What picking the newest discs needs to know about a disc. */
export type DatedDisc = {
  /** Only present for a signed-in visitor; a disc without one cannot be selected. */
  externalId?: string;
  /** Missing or empty when the disc carries no date. */
  addedAt?: string;
  /** Missing or empty when the owner left no number. */
  ownerPhoneNumber?: string;
};

/**
 * Whether a disc has a number to text. The one place this is decided, so the
 * discs "Valitse uusimmat" ticks and the bar's SMS count cannot disagree.
 */
export function hasPhoneNumber(disc: Pick<DatedDisc, 'ownerPhoneNumber'>): boolean {
  return !!disc.ownerPhoneNumber;
}

/**
 * The day (`y-MM-dd`) the most recent disc in `discs` was added, or null when
 * none carries a usable date. Meant for the whole list, before any filter: a
 * filter narrows which of the newest discs are shown, not which day is newest.
 *
 * The day is the first ten characters of `added_at`, compared as text. A day
 * after `today` (`y-MM-dd`) is skipped: the sheet sync stores whatever date was
 * typed, and one disc mistyped into a future year would otherwise be "newest"
 * for ever.
 */
export function latestAddedDay(discs: DatedDisc[], today: string): string | null {
  const latestDay = discs.reduce((latest, disc) => {
    const day = toDay(disc.addedAt);

    return day > latest && day <= today ? day : latest;
  }, '');

  return latestDay === '' ? null : latestDay;
}

/**
 * The discs to text after a round of adding: those in `discs` added on
 * `newestDay`, less those with no number to send to. When none of them has a
 * number the answer is empty — reaching back to an earlier day would tick
 * discs that are not new.
 */
export function newestDiscIdsWithPhoneNumber(discs: DatedDisc[], newestDay: string | null): string[] {
  if (newestDay === null) {
    return [];
  }

  return discs
    .filter((disc) => toDay(disc.addedAt) === newestDay && hasPhoneNumber(disc))
    .flatMap((disc) => (disc.externalId ? [disc.externalId] : []));
}

function toDay(addedAt: string | undefined): string {
  return (addedAt ?? '').slice(0, 10);
}
