import { isRetrievalMethod, retrievalMethodLabel, type RetrievalMethodValue } from './retrievalMethod';

/**
 * Why a disc is waiting to be fetched out of the club's storage.
 *
 * The database says this with one column: disc_retrievals.retrieval_method is
 * the method the owner asked for, or NULL when the disc is not going back to an
 * owner at all. That is a fine thing for a column to do and a poor thing for a
 * type to do -- a nullable method read straight into the UI needed a companion
 * boolean to say whether the disc was on the list, and a comment at each of the
 * three places that read it warning which of the two facts a null carried.
 *
 * So the null is decoded once, on the way out of the database, and the rest of
 * the app has a value that cannot be misread: either the disc is going back to
 * its owner and there is a method, or the club is keeping it and there is not.
 *
 * This is what a *write* may ask for. What a row may turn out to say is
 * StoredErrand below, which has one more case.
 */
export type RetrievalErrand = { kind: 'to-owner'; method: RetrievalMethodValue } | { kind: 'kept-by-club' };

/**
 * The same, plus the case the column should never hold: a number that is
 * neither NULL nor a method this app knows.
 *
 * The CHECK constraint makes it impossible, and it is still worth a case of its
 * own. Reading it as "the club is keeping this disc" — which is what a bare
 * `else` does — would have a corrupt row calmly assert that a disc its owner
 * asked for is going to the bring-and-buy table. The list would rather say it
 * does not know and send the admin to the messages, which is what he would do
 * anyway.
 */
export type StoredErrand = RetrievalErrand | { kind: 'unclear' };

/** What the card says of a row whose method it cannot read. */
const UNCLEAR_LABEL = 'Noutotapa epäselvä – tarkista viestit';

/**
 * The one line under the disc's name on the retrieval list: what is to be done
 * with this disc once it is off the shelf.
 *
 * For a disc going back to its owner that is the method they asked for, which
 * is the difference between a stamp and a doorstep. A disc the club is keeping
 * is not going to anybody, so it says that instead.
 */
export function retrievalErrandLabel(errand: StoredErrand): string {
  switch (errand.kind) {
    case 'kept-by-club':
      return 'Myyntiin tai lahjoitukseen';
    case 'unclear':
      return UNCLEAR_LABEL;
    case 'to-owner':
      // The union guarantees a method the enum knows, so there is always a
      // label; the fallback is what an impossible one would read as anyway.
      return retrievalMethodLabel(errand.method) ?? UNCLEAR_LABEL;
  }
}

/** The method to preselect when reopening the form, if there is one. */
export function retrievalErrandMethod(errand: StoredErrand | null): RetrievalMethodValue | null {
  return errand?.kind === 'to-owner' ? errand.method : null;
}

/**
 * Reads one disc_retrievals.retrieval_method into the errand it stands for.
 *
 * The one place the column is decoded, so the two queries that read the table
 * cannot come to disagree about what it means. Each of the three readings is
 * its own: a method is a method, NULL is the club keeping the disc, and
 * anything else is a row the list will not guess about. The disc is on the
 * shelf in all three, so the line belongs on the list in all three.
 */
export function toRetrievalErrand(retrievalMethod: number | null): StoredErrand {
  if (retrievalMethod === null) {
    return { kind: 'kept-by-club' };
  }

  return isRetrievalMethod(retrievalMethod) ? { kind: 'to-owner', method: retrievalMethod } : { kind: 'unclear' };
}

/**
 * A request the club's decision overruled: what the row still says, when that
 * is anything other than "no request".
 *
 * The two cases of StoredErrand that carry a request, and neither more nor
 * less. A row that says nothing was overruled by nothing, and a row that cannot
 * be read still overruled *something* — collapsing that into "no request" is
 * how the first attempt at this quietly lost it.
 */
export type SupersededRequest = Exclude<StoredErrand, { kind: 'kept-by-club' }>;

/** One line of the list: what to do with the disc, and what that overruled. */
export type ListedErrand = {
  errand: StoredErrand;
  /** The request the club's decision overruled; null when there was none. */
  superseded: SupersededRequest | null;
};

/**
 * What the retrieval list shows for one row.
 *
 * The row alone cannot answer this. A disc released for sale or donation is not
 * going back to anybody whatever its own row says, and since 2026-09-10 the
 * mark deliberately leaves that row alone rather than clearing it — so the
 * disc's `can_be_sold_or_donated` decides what is to be done, and whatever the
 * row still asks for becomes the request that decision overruled.
 */
export function toListedErrand(retrievalMethod: number | null, keptByClub: boolean): ListedErrand {
  const fromRow = toRetrievalErrand(retrievalMethod);

  if (!keptByClub) {
    return { errand: fromRow, superseded: null };
  }

  return {
    errand: { kind: 'kept-by-club' },
    superseded: fromRow.kind === 'kept-by-club' ? null : fromRow,
  };
}

/**
 * The amber line: what the club's decision overruled, in full.
 *
 * A whole sentence rather than a fragment the page assembles, because the two
 * cases are not the same sentence with a word swapped — one names what the
 * owner asked for, the other admits the row cannot be read at all.
 */
export function supersededRequestLabel(superseded: SupersededRequest): string {
  if (superseded.kind === 'unclear') {
    return 'Huom! Kiekolla on avoin noutopyyntö, jonka noutotapaa ei voi lukea – tarkista viestit.';
  }

  return `Huom! Omistaja on pyytänyt kiekkoa: ${retrievalMethodLabel(superseded.method)}`;
}
