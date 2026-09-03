import { queryOwnerLinkDisc } from './queryOwnerLinkDisc.server';
import { createConnection } from '~/models/utils';
import type { OwnerLinkDisc } from './ownerResponse';

/**
 * The disc behind an owner link.
 *
 * No login: holding the link is the permission. `disc` is null when the token
 * resolves to nothing the club is still listing — an unknown token, or a disc
 * already returned, released or archived — and the page says so rather than
 * 404ing, since an owner who followed a real link that has gone stale deserves
 * an explanation rather than an error page.
 */
export async function loadOwnerLinkPage(token: string): Promise<{ disc: OwnerLinkDisc | null }> {
  return { disc: await queryOwnerLinkDisc(createConnection(), token) };
}
