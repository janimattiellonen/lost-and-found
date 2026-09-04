import { queryOwnerLinkDisc } from './queryOwnerLinkDisc.server';
import { createConnection } from '~/models/utils';
import { currentClubId, getClubContactEmail, getClubPayment, type ClubPayment } from '~/config/clubs';
import { isExternalId } from '~/lib/api/validate';
import type { OwnerLinkDisc } from './ownerResponse';

export type OwnerLinkPageData = {
  disc: OwnerLinkDisc | null;
  clubPayment: ClubPayment | null;
  contactEmail: string;
};

/**
 * The disc behind an owner link.
 *
 * No login: holding the link is the permission. `disc` is null when the token
 * resolves to nothing this club is still listing — a token that is not even a
 * uuid, an unknown one, a disc already returned, released or archived, or one
 * belonging to another club — and the page says so rather than 404ing, since an
 * owner who followed a real link that has gone stale deserves an explanation
 * rather than an error page.
 *
 * The payment details and the contact address come from this instance's own
 * club, which is also the only club whose discs this page will show.
 */
export async function loadOwnerLinkPage(token: string): Promise<OwnerLinkPageData> {
  const clubId = currentClubId();

  return {
    // A token that is not even a uuid never reaches the database.
    disc: isExternalId(token) ? await queryOwnerLinkDisc(createConnection(), token, clubId) : null,
    clubPayment: getClubPayment(clubId),
    contactEmail: getClubContactEmail(clubId),
  };
}
