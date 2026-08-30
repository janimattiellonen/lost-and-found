/**
 * Per-club details that differ between the instances this codebase serves.
 *
 * The club itself comes from APP_CLUB_ID; everything here is keyed on it.
 */

export const PUSKASOTURIT = 1;
export const TALIN_TALLAAJAT = 2;

const CONTACT_EMAILS: Record<number, string> = {
  [PUSKASOTURIT]: 'loytokiekot@puskasoturit.com',
  [TALIN_TALLAAJAT]: 'janimatti.ellonen@gmail.com',
};

const LOST_DISCS_URLS: Record<number, string> = {
  [PUSKASOTURIT]: 'https://puskasoturit.com/index.php/loytokiekot/',
  [TALIN_TALLAAJAT]: 'https://www.tallaajat.org/loytokiekot/',
};

/**
 * The club's own lost-and-found page, which the disc list links to for the
 * fuller story. Null for a club that has none, so the link can be left out
 * rather than pointing somewhere wrong.
 */
export function getClubLostDiscsUrl(clubId: number | null): string | null {
  return clubId === null ? null : (LOST_DISCS_URLS[clubId] ?? null);
}

/**
 * Where a visitor should write about a disc.
 *
 * Falls back to Talin Tallaajat's address, which is the one the help text
 * carried before it was made per-club, so an unknown club still shows a
 * working contact rather than nothing.
 */
export function getClubContactEmail(clubId: number | null): string {
  return CONTACT_EMAILS[clubId ?? TALIN_TALLAAJAT] ?? CONTACT_EMAILS[TALIN_TALLAAJAT];
}
