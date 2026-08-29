/** What to show when the server gave no message of its own. */
export const GENERIC_ERROR = 'Toiminto epäonnistui. Yritä uudelleen.';

export const SIGNED_OUT_ERROR = 'Kirjautuminen on vanhentunut. Kirjaudu uudelleen.';

export const CONNECTION_ERROR = 'Yhteys palvelimeen katkesi – yritä uudelleen.';

/**
 * Turns a response status into something to show the user.
 *
 * Only 401 is reported as a session problem; anything else stays generic rather
 * than guessing at a cause.
 */
export function messageForStatus(status: number, genericError: string = GENERIC_ERROR): string {
  return status === 401 ? SIGNED_OUT_ERROR : genericError;
}
