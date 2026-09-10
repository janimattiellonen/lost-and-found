import type { RetrievalErrand } from './retrievalErrand';
import type { RetrievalMethodValue } from './retrievalMethod';

/** Putting one disc on the retrieval list — what the route receives. */
export type DiscRetrievalInput = {
  externalId: string;
  /** What the owner asked for. Required: the list exists to say which. */
  retrievalMethod: RetrievalMethodValue;
};

/**
 * One line of the retrieval list.
 *
 * The same things that used to be written down by hand: what the disc looks
 * like, when the club got it, who to call, and what they asked for — plus when
 * they asked, which the notepad never recorded.
 */
export type RetrievalListDisc = {
  externalId: string;
  discName: string;
  discColour: string;
  /** ISO date (y-MM-dd) the club took the disc in. */
  addedAt: string | null;
  ownerName: string | null;
  ownerPhoneNumber: string | null;
  /** What is to be done with the disc once it is off the shelf. */
  errand: RetrievalErrand;
  /**
   * What the owner had asked for before the club decided to keep the disc, when
   * those two disagree. Null the rest of the time — including when the owner
   * gave the disc up themselves, since then there is nothing to disagree about.
   */
  supersededMethod: RetrievalMethodValue | null;
  /** ISO timestamp of the request. */
  requestedAt: string;
};

/** What came of a write: the disc this club has no row for cannot be marked. */
export type RetrievalOutcome = 'done' | 'not-found';
