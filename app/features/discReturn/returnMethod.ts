import { methodEnum } from '~/features/methodEnum';

/**
 * How a disc got back to its owner.
 *
 * Stored as a smallint in discs.return_method; see methodEnum for what that
 * means for changing these numbers.
 */
const returnMethod = methodEnum({
  ByMail: { value: 0, label: 'Postitettu' },
  PickedUp: { value: 1, label: 'Noudettu' },
});

export const ReturnMethod = returnMethod.values;
export const returnMethodOptions = returnMethod.options;
export const isReturnMethod = returnMethod.is;
export const returnMethodLabel = returnMethod.label;

export type ReturnMethodValue = (typeof ReturnMethod)[keyof typeof ReturnMethod];
