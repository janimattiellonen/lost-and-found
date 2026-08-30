import { methodEnum } from '~/lib/methodEnum';

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
