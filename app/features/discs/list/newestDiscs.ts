/** What picking the newest discs needs to know about a row. */
export type DatedDisc = {
  /** Only present for a signed-in visitor; a disc without one cannot be selected. */
  externalId?: string;
  /** Empty when the disc carries no date. */
  addedAt: string;
  /** Empty when the owner left no number. */
  ownerPhoneNumber: string;
};

/**
 * The discs to text after a round of adding: every disc added on the same day
 * as the most recent one, less those with no number to send to.
 *
 * The day is the first ten characters of `added_at`, compared as text. A day
 * after `today` (`y-MM-dd`) is skipped: the sheet sync stores whatever date was
 * typed, and one disc mistyped into a future year would otherwise be "newest"
 * for ever. When the newest day's discs all lack a number the answer is empty —
 * reaching back to an earlier day would tick discs that are not new.
 */
export function newestDiscIdsWithPhoneNumber(discs: DatedDisc[], today: string): string[] {
  const latestDay = discs.reduce((latest, disc) => {
    const day = toDay(disc.addedAt);

    return day > latest && day <= today ? day : latest;
  }, '');

  if (latestDay === '') {
    return [];
  }

  return discs
    .filter((disc) => toDay(disc.addedAt) === latestDay && !!disc.ownerPhoneNumber)
    .flatMap((disc) => (disc.externalId ? [disc.externalId] : []));
}

function toDay(addedAt: string): string {
  return addedAt.slice(0, 10);
}
