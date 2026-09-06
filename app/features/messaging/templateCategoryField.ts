/**
 * The "Kategoria" dropdown's value, on both sides of the form.
 *
 * The empty string is "Ei kategoriaa" — a select cannot carry a null, and an
 * absent field would be indistinguishable from a form that never had the
 * dropdown on it.
 */
export const NO_CATEGORY = '';

/**
 * Reads the posted category back.
 *
 * Anything that is not a positive whole number becomes null, so a hand-posted
 * value cannot get as far as the database. A real id belonging to another club
 * would be rejected there anyway, by the foreign key and the club scoping on
 * the update.
 */
export function parseCategoryId(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);

  return typeof value === 'string' && value !== NO_CATEGORY && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
