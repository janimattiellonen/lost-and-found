import {
  handoverMethodLabel,
  handoverMethodOptions,
  HandoverMethod,
  needsFetchingFromStorage,
  type FetchingHandoverMethod,
} from '~/features/discs/handoverMethod';

/**
 * What the retrieval list may be asked for: the handover methods that need the
 * admin to fetch the disc out of the club's storage first.
 *
 * Not an enum of its own — this is the shared handover method, narrowed. A disc
 * the owner is collecting from the storage never comes to the house, so it is
 * not an errand and cannot be put on this list; the CHECK constraint on
 * disc_retrievals says the same thing in the database.
 */
export const RetrievalMethod = {
  ByMail: HandoverMethod.ByMail,
  PickedUp: HandoverMethod.PickedUpFromHome,
} as const;

export const retrievalMethodOptions = handoverMethodOptions.filter(
  (option): option is { value: RetrievalMethodValue; label: string } => needsFetchingFromStorage(option.value),
);

export const isRetrievalMethod = needsFetchingFromStorage;

export const retrievalMethodLabel = handoverMethodLabel;

export type RetrievalMethodValue = FetchingHandoverMethod;

/**
 * The one line under the disc's name on the retrieval list: what is to be done
 * with this disc once it is off the shelf.
 *
 * For a disc going back to its owner that is the method they asked for, which
 * is the difference between a stamp and a doorstep. A disc the club is keeping
 * is not going to anybody, so it has no method — and that missing method is the
 * whole of how the two kinds of errand are told apart, in the database as well
 * as here.
 */
export function retrievalErrandLabel(retrievalMethod: RetrievalMethodValue | null): string {
  return retrievalMethod === null ? 'Myyntiin tai lahjoitukseen' : (handoverMethodLabel(retrievalMethod) ?? '');
}
