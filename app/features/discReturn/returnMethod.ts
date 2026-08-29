/**
 * How a disc got back to its owner.
 *
 * Stored as a smallint in discs.return_method. The numbers are persisted data:
 * add new ones, never renumber the existing ones, and extend the CHECK
 * constraint in the migration alongside them.
 */
export const ReturnMethod = {
  ByMail: 0,
  PickedUp: 1,
} as const;

export type ReturnMethodValue = (typeof ReturnMethod)[keyof typeof ReturnMethod];

/** Finnish labels, in the order they are offered in the form. */
export const returnMethodOptions: { value: ReturnMethodValue; label: string }[] = [
  { value: ReturnMethod.ByMail, label: 'Postitettu' },
  { value: ReturnMethod.PickedUp, label: 'Noudettu' },
];

const values: number[] = returnMethodOptions.map((option) => option.value);

export function isReturnMethod(value: unknown): value is ReturnMethodValue {
  return typeof value === 'number' && Number.isInteger(value) && values.includes(value);
}

export function returnMethodLabel(value: number | null | undefined): string | null {
  return returnMethodOptions.find((option) => option.value === value)?.label ?? null;
}
