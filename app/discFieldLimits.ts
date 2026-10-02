/**
 * How long a disc's text fields may be, wherever they are written.
 *
 * Shared by the submission form's wire validator, the edit form and the
 * message composer's phone editor: they write the same columns, so a limit one
 * enforced and another did not would only be a way for them to disagree about
 * the same disc.
 *
 * Here beside `discMethods.ts` rather than in the discs slice, for the same
 * reason: more than one feature reads it, and ESLint forbids one slice
 * importing another.
 */

/** A disc name, colour, maker, owner, phone number or course. */
export const MAX_FIELD_LENGTH = 200;

// The note is free text rather than one catalogue value, so it is allowed to
// run longer than a disc name or a colour.
export const MAX_ADDITIONAL_INFO_LENGTH = 500;
