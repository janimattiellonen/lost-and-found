import { MAX_FIELD_LENGTH } from '~/discFieldLimits';
import { normalisePhoneNumber } from '~/phoneNumber';

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
 * Reads the number the phone editor posted: required, no longer than the
 * column's limit everywhere else, and in the stored form every writer of the
 * column uses (~/phoneNumber).
 *
 * Required, unlike in the edit form, because a number cleared while messaging
 * leaves nothing to send to.
 */
export function parseOwnerPhoneNumber(value: unknown): OwnerPhoneNumberResult {
  const phoneNumber = typeof value === 'string' ? value.trim() : '';

  if (phoneNumber.length === 0) {
    return { error: 'Puhelinnumero on pakollinen.' };
  }

  if (phoneNumber.length > MAX_FIELD_LENGTH) {
    return { error: `Puhelinnumero on liian pitkä (enintään ${MAX_FIELD_LENGTH} merkkiä).` };
  }

  const normalised = normalisePhoneNumber(phoneNumber);

  if (normalised.error !== undefined) {
    return { error: normalised.error };
  }

  // Null only for an empty number, which was turned away above.
  return normalised.phoneNumber === null
    ? { error: 'Puhelinnumero on pakollinen.' }
    : { phoneNumber: normalised.phoneNumber };
}
