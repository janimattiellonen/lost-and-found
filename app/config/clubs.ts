/**
 * Per-club details that differ between the instances this codebase serves.
 *
 * The club itself comes from APP_CLUB_ID; everything here is keyed on it.
 */

export const PUSKASOTURIT = 1;
export const TALIN_TALLAAJAT = 2;

/**
 * The club this instance serves.
 *
 * One reading of APP_CLUB_ID rather than a parseInt in every loader that needs
 * it: the env var is the only place the club comes from, and a parse repeated
 * a dozen times is a dozen places to get the radix or the `!` wrong.
 */
export function currentClubId(): number {
  return parseInt(process.env.APP_CLUB_ID!, 10);
}

const CONTACT_EMAILS: Record<number, string> = {
  [PUSKASOTURIT]: 'loytokiekot@puskasoturit.com',
  [TALIN_TALLAAJAT]: 'janimatti.ellonen@gmail.com',
};

/**
 * The club's images. `favicon` is a small square where the club has one and the
 * full logo otherwise, since a browser scales it either way.
 */
type ClubImages = { logo: string; favicon: string };

const CLUB_IMAGES: Record<number, ClubImages> = {
  [PUSKASOTURIT]: { logo: '/ps-logo.png', favicon: '/ps-logo.png' },
  [TALIN_TALLAAJAT]: { logo: '/tt-sini-logo.jpg', favicon: '/tt-sini-logo-32-32.jpg' },
};

/**
 * The logo shown beside the page title, and the favicon. Null for a club with
 * no image on file, so the caller can leave the element out rather than render
 * one pointing nowhere.
 */
export function getClubLogo(clubId: number | null): string | null {
  return clubId === null ? null : (CLUB_IMAGES[clubId]?.logo ?? null);
}

export function getClubFavicon(clubId: number | null): string | null {
  return clubId === null ? null : (CLUB_IMAGES[clubId]?.favicon ?? null);
}

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

/**
 * Where an owner may pay the club the voluntary thank-you for a posted disc.
 *
 * A MobilePay number and the name it answers to, which is what the owner sees
 * in their payment app and what tells them they are paying the right club.
 * Separate from the postage itself, which goes to the admin.
 */
export type ClubPayment = { number: string; name: string };

const CLUB_PAYMENTS: Record<number, ClubPayment> = {
  [PUSKASOTURIT]: { number: '80603', name: 'Puskasoturit ry' },
  [TALIN_TALLAAJAT]: { number: '808226', name: 'Talin Tallaajat / Myynti' },
};

/**
 * Null for a club with no number on file, so the instruction can be left out
 * rather than sending an owner's money to another club.
 */
export function getClubPayment(clubId: number | null): ClubPayment | null {
  return clubId === null ? null : (CLUB_PAYMENTS[clubId] ?? null);
}
