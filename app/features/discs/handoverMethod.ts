import { methodEnum } from '~/lib/methodEnum';

/**
 * How a disc is to get back to its owner.
 *
 * One enum for the three places the question comes up: what the owner asks for
 * on the flag page, what the admin plans when a disc goes on the retrieval
 * list, and what `discs.return_method` records once it has happened. They were
 * separate enums with overlapping numbers, which is a mapping nothing in the UI
 * would have shown to be wrong.
 *
 * Lives at the root of the discs slice rather than in one of its subfolders,
 * because no one of them owns it.
 *
 * Stored as a smallint; see methodEnum for what that means for changing these
 * numbers. 0 and 1 are the two `discs.return_method` has held since the Google
 * Sheet, so they cannot move.
 */
const handoverMethod = methodEnum({
  ByMail: { value: 0, label: 'Postitus' },
  // "From me" rather than plain "Nouto": for a Talin Tallaajat disc there are
  // two places an owner can collect from, and which one is the whole point.
  PickedUpFromHome: { value: 1, label: 'Nouto (minulta)' },
  PickedUpFromStorage: { value: 2, label: 'Nouto varastolta' },
});

export const HandoverMethod = handoverMethod.values;
export const handoverMethodOptions = handoverMethod.options;
export const isHandoverMethod = handoverMethod.is;
export const handoverMethodLabel = handoverMethod.label;

export type HandoverMethodValue = (typeof HandoverMethod)[keyof typeof HandoverMethod];

/**
 * The methods that need the admin to bring the disc out of the storage first.
 *
 * Collecting from the storage is the one that does not: the disc never comes to
 * the house, so such a request is not an errand for anybody. The retrieval list
 * and its database CHECK both narrow to these two.
 */
export const FETCHING_HANDOVER_METHODS = [HandoverMethod.ByMail, HandoverMethod.PickedUpFromHome] as const;

export type FetchingHandoverMethod = (typeof FETCHING_HANDOVER_METHODS)[number];

export function needsFetchingFromStorage(method: unknown): method is FetchingHandoverMethod {
  return (FETCHING_HANDOVER_METHODS as readonly unknown[]).includes(method);
}
