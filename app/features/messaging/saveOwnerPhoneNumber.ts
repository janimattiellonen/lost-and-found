import { postJson } from '~/lib/api/postJson';

import type { OwnerPhoneNumberInput } from './ownerPhoneNumber';

/** The resource route that stores the number. */
const PHONE_NUMBER_URL = '/message/phone-number';

const GENERIC_ERROR = 'Puhelinnumeron tallennus epäonnistui. Yritä uudelleen.';

export type SaveOwnerPhoneNumberResult =
  | { status: 'success'; phoneNumber: string }
  | { status: 'error'; message: string };

/**
 * Saves one disc's owner phone number and answers with the number as stored.
 *
 * Never throws: a transport failure comes back as an error result, so the
 * caller has one thing to handle rather than two.
 */
export async function saveOwnerPhoneNumber(input: OwnerPhoneNumberInput): Promise<SaveOwnerPhoneNumberResult> {
  const result = await postJson(PHONE_NUMBER_URL, input, GENERIC_ERROR);

  if (result.status === 'error') {
    return result;
  }

  const stored = (result.body as { phoneNumber?: unknown } | null)?.phoneNumber;

  return typeof stored === 'string'
    ? { status: 'success', phoneNumber: stored }
    : { status: 'error', message: GENERIC_ERROR };
}
