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
 * The same four things that used to be written down by hand: what the disc
 * looks like, when the club got it, who to call, and what they asked for.
 */
export type RetrievalListDisc = {
  externalId: string;
  discName: string;
  discColour: string;
  /** ISO date (y-MM-dd) the club took the disc in. */
  addedAt: string | null;
  ownerName: string | null;
  ownerPhoneNumber: string | null;
  retrievalMethod: RetrievalMethodValue | null;
};
