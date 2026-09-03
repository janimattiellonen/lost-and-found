import { methodEnum } from '~/lib/methodEnum';

/**
 * How the owner asked to get their disc back.
 *
 * Stored as a smallint in discs.retrieval_method; see methodEnum for what that
 * means for changing these numbers.
 *
 * The same two choices as ReturnMethod, and the same numbers, but a wish rather
 * than a record: this is what the owner asked for when the disc was put on the
 * retrieval list, which is why the labels name the act ("Postitus") instead of
 * reporting it as done ("Postitettu").
 */
const retrievalMethod = methodEnum({
  ByMail: { value: 0, label: 'Postitus' },
  PickedUp: { value: 1, label: 'Nouto' },
});

export const RetrievalMethod = retrievalMethod.values;
export const retrievalMethodOptions = retrievalMethod.options;
export const isRetrievalMethod = retrievalMethod.is;
export const retrievalMethodLabel = retrievalMethod.label;

export type RetrievalMethodValue = (typeof RetrievalMethod)[keyof typeof RetrievalMethod];
