import type { RetrievalMethodValue } from './retrievalMethod';

/** Putting one disc on the retrieval list — what the route receives. */
export type DiscRetrievalInput = {
  externalId: string;
  /** What the owner asked for. Required: the list exists to say which. */
  retrievalMethod: RetrievalMethodValue;
};

/**
 * Who asked for the disc.
 *
 * Stored in disc_retrievals.requested_by. Nothing sets Owner yet — the
 * owner-facing page is its own feature — but a request that arrives without
 * anyone at the club reading an sms is worth telling apart from one that was.
 */
export const RequestedBy = { Club: 0, Owner: 1 } as const;

export type RequestedByValue = (typeof RequestedBy)[keyof typeof RequestedBy];

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
  retrievalMethod: RetrievalMethodValue;
  /** ISO timestamp of the request. */
  requestedAt: string;
};

/** What came of a write: the disc this club has no row for cannot be marked. */
export type RetrievalOutcome = 'done' | 'not-found';
