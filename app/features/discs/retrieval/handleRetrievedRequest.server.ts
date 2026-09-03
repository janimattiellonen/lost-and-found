import { redirect } from 'react-router';

import { currentClubId, isRetrievalListEnabled } from '~/config/clubs';
import { isExternalId } from '~/lib/api/validate';
import { queryCompleteRetrieval } from '~/features/discs/retrieval/queryCompleteRetrieval.server';
import { createSupabaseServerClient } from '~/models/utils';
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

  if (!isRetrievalListEnabled(currentClubId())) {
    return new Response('Not Found', { status: 404 });
  }

  const externalId = formData.get('externalId');

  if (!isExternalId(externalId)) {
    return new Response('Virheellinen kiekon tunniste.', { status: 422 });
  }

  await queryCompleteRetrieval(createSupabaseServerClient(request), externalId);

  // A disc that is no longer on the list is not worth an error page: it is off
  // it either way, which is what the admin asked for.
  return null;
}
