import { redirect } from 'react-router';

import { isRetrievalListEnabled } from '~/config/clubs';
import { isExternalId } from '~/lib/api/validate';
import { markDiscRetrieved } from '~/models/discs.server';
import { isUserLoggedIn } from '~/models/utils';

/**
 * Takes one disc off the retrieval list, from the form on the page itself.
 *
 * A form post rather than a fetch to a resource route: the page has nothing to
 * do afterwards but show the shorter list, and a post to the page's own action
 * revalidates it -- and the count beside the menu item -- for free.
 */
export async function handleRetrievedRequest(request: Request, formData: FormData): Promise<Response | null> {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  if (!isRetrievalListEnabled(parseInt(process.env.APP_CLUB_ID!, 10))) {
    return new Response('Not Found', { status: 404 });
  }

  const externalId = formData.get('externalId');

  if (!isExternalId(externalId)) {
    return new Response('Virheellinen kiekon tunniste.', { status: 422 });
  }

  await markDiscRetrieved(externalId, request);

  // An id that no longer resolves is not worth an error page: the disc is off
  // the list either way, which is what the admin asked for.
  return null;
}
