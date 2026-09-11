import { methodEnum } from '~/lib/methodEnum';

/**
 * The two enums recording what became of a disc: what the club means to do with
 * one it has released, and how one that went home got there.
 *
 * They live here, beside `types.ts` and `utils.ts`, rather than in the discs
 * slice that writes them. Both the disc table and the statistics page read their
 * labels, and ESLint forbids one feature slice importing another; `app/lib/` is
 * documented as plumbing with no domain in it, which these — Finnish words bound
 * to two specific columns — are not. This is the shared-vocabulary level, where
 * `app/types.ts` has always depended on them from.
 */

/**
 * What is to happen to a disc the club is releasing.
 *
 * Stored as a smallint in discs.can_be_sold_or_donated_method; see methodEnum
 * for what that means for changing these numbers.
 */
const disposalMethod = methodEnum({
  Sold: { value: 0, label: 'Myydään' },
  Donated: { value: 1, label: 'Lahjoitetaan' },
});

export const DisposalMethod = disposalMethod.values;
export const disposalMethodOptions = disposalMethod.options;
export const isDisposalMethod = disposalMethod.is;
export const disposalMethodLabel = disposalMethod.label;

export type DisposalMethodValue = (typeof DisposalMethod)[keyof typeof DisposalMethod];

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
