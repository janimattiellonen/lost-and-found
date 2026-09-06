/**
 * The owner-facing link, built where both sides of it can reach the code.
 *
 * In ~/lib rather than in the ownerResponse feature because the messaging
 * feature is what puts the link in a message, and no feature may import from
 * another: the page that reads the token and the composer that writes it into
 * an sms would otherwise be a cross-feature import.
 */

/**
 * The path the sms link points at.
 *
 * Was `/kiekko` until routes were made consistently English. Links already sent
 * still carry the old path; `routes/kiekko.$token.tsx` redirects them here.
 */
export const OWNER_LINK_PATH = '/disc';

/**
 * The link to put in a message to an owner.
 *
 * The base url comes from the request the page was loaded with, rather than an
 * env var or window.location: the composer renders on the server as well as in
 * the browser, and a value read from `window` there would differ between the
 * two renders.
 */
export function ownerLinkUrl(baseUrl: string, ownerLinkToken: string | undefined): string {
  if (!ownerLinkToken) {
    return '';
  }

  return `${baseUrl.replace(/\/$/, '')}${OWNER_LINK_PATH}/${ownerLinkToken}`;
}
