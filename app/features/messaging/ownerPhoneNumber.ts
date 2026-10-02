import { MAX_FIELD_LENGTH } from '~/discFieldLimits';

/** What the composer's phone editor posts to /message/phone-number. */
export type OwnerPhoneNumberInput = {
  externalId: string;
  phoneNumber: string;
};

/** Either the number ready to store or the Finnish reason it was refused. */
export type OwnerPhoneNumberResult =
  | { phoneNumber: string; error?: undefined }
  | { phoneNumber?: undefined; error: string };

/**
 * Reads the number the phone editor posted: trimmed, required, and no longer
 * than the column's limit everywhere else.
 *
 * Deliberately not format-checked, for the edit form's reason: imported rows
 * hold things like "050 123 4567 (äiti)", and a pattern would refuse the very
 * correction the editor is for. Required, unlike in the edit form, because a
 * number cleared while messaging leaves nothing to send to.
 */
export function parseOwnerPhoneNumber(value: unknown): OwnerPhoneNumberResult {
  const phoneNumber = typeof value === 'string' ? value.trim() : '';

  if (phoneNumber.length === 0) {
    return { error: 'Puhelinnumero on pakollinen.' };
  }

  if (phoneNumber.length > MAX_FIELD_LENGTH) {
    return { error: `Puhelinnumero on liian pitkä (enintään ${MAX_FIELD_LENGTH} merkkiä).` };
  }

  return { phoneNumber };
}
