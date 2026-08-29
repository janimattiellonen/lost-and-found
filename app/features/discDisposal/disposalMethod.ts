/**
 * What is to happen to a disc the club is releasing.
 *
 * Stored as a smallint in discs.can_be_sold_or_donated_method. The numbers are
 * persisted data: add new ones, never renumber the existing ones, and extend
 * the CHECK constraint in the migration alongside them.
 */
export const DisposalMethod = {
  Sold: 0,
  Donated: 1,
} as const;

export type DisposalMethodValue = (typeof DisposalMethod)[keyof typeof DisposalMethod];

/** Finnish labels, in the order they are offered in the form. */
export const disposalMethodOptions: { value: DisposalMethodValue; label: string }[] = [
  { value: DisposalMethod.Sold, label: 'Myydään' },
  { value: DisposalMethod.Donated, label: 'Lahjoitetaan' },
];

const values: number[] = disposalMethodOptions.map((option) => option.value);

export function isDisposalMethod(value: unknown): value is DisposalMethodValue {
  return typeof value === 'number' && Number.isInteger(value) && values.includes(value);
}

export function disposalMethodLabel(value: number | null | undefined): string | null {
  return disposalMethodOptions.find((option) => option.value === value)?.label ?? null;
}
