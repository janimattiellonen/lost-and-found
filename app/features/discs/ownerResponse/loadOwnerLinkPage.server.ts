import { queryOwnerLinkDisc } from './queryOwnerLinkDisc.server';
import { createConnection } from '~/models/utils';
import { getClubContactEmail, getClubPayment, type ClubPayment } from '~/config/clubs';
import type { OwnerLinkDisc } from './ownerResponse';

/**
 * The disc behind an owner link.
 *
 * No login: holding the link is the permission. `disc` is null when the token
 * resolves to nothing the club is still listing — an unknown token, or a disc
 * already returned, released or archived — and the page says so rather than
 * 404ing, since an owner who followed a real link that has gone stale deserves
 * an explanation rather than an error page.
 *
 * The payment details and the contact address come from this instance's own
 * club rather than from the disc: each club runs its own deployment, so the
 * link an owner followed is already the right club's.
 */
export async function loadOwnerLinkPage(
  token: string,
): Promise<{ disc: OwnerLinkDisc | null; clubPayment: ClubPayment | null; contactEmail: string }> {
  const clubId = parseInt(process.env.APP_CLUB_ID!, 10);

  return {
    disc: await queryOwnerLinkDisc(createConnection(), token),
    clubPayment: getClubPayment(clubId),
    contactEmail: getClubContactEmail(clubId),
  };
}
