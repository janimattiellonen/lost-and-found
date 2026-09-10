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
 */
export type RetrievalErrand = { kind: 'to-owner'; method: RetrievalMethodValue } | { kind: 'kept-by-club' };

/**
 * The one line under the disc's name on the retrieval list: what is to be done
 * with this disc once it is off the shelf.
 *
 * For a disc going back to its owner that is the method they asked for, which
 * is the difference between a stamp and a doorstep. A disc the club is keeping
 * is not going to anybody, so it says that instead.
 */
export function retrievalErrandLabel(errand: RetrievalErrand): string {
  if (errand.kind === 'kept-by-club') {
    return 'Myyntiin tai lahjoitukseen';
  }

  return retrievalMethodLabel(errand.method) ?? '';
}

/** The method to preselect when reopening the form, if there is one. */
export function retrievalErrandMethod(errand: RetrievalErrand | null): RetrievalMethodValue | null {
  return errand?.kind === 'to-owner' ? errand.method : null;
}

/**
 * Reads one disc_retrievals.retrieval_method into the errand it stands for.
 *
 * The one place the column's null is decoded, so the two queries that read the
 * table cannot come to disagree about what it means. An out-of-range smallint —
 * which the CHECK constraint should make impossible — is read the same way as a
 * null rather than as a method it might not be: either way the disc is on the
 * shelf and the line belongs on the list.
 */
export function toRetrievalErrand(retrievalMethod: number | null): RetrievalErrand {
  return isRetrievalMethod(retrievalMethod) ? { kind: 'to-owner', method: retrievalMethod } : { kind: 'kept-by-club' };
}
