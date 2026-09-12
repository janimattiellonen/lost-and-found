/**
 * How long a disc's text fields may be, wherever they are written.
 *
 * Shared by the submission form's wire validator and the edit form: both write
 * the same columns, so a limit one enforced and the other did not would only be
 * a way for the two to disagree about the same disc.
 */

/** A disc name, colour, maker, owner, phone number or course. */
export const MAX_FIELD_LENGTH = 200;

// The note is free text rather than one catalogue value, so it is allowed to
// run longer than a disc name or a colour.
export const MAX_ADDITIONAL_INFO_LENGTH = 500;
