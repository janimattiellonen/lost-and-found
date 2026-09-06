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
 * value cannot get as far as the database.
 *
 * A well-formed id of *another club's* category gets past this untouched, and
 * nothing in the schema would stop it: the foreign key only proves the row
 * exists somewhere. `queryOwnCategoryId` is what rejects it, and every caller
 * that stores the value runs it through there.
 */
export function parseCategoryId(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);

  return typeof value === 'string' && value !== NO_CATEGORY && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
