import { redirect } from 'react-router';

import { queryMarkResponseHandled } from './queryMarkResponseHandled.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * Marks one answer as dealt with, from the form on the page itself.
 *
 * A form post rather than a fetch to a resource route: the page has nothing to
 * do afterwards but show the shorter list, and a post to its own action
 * revalidates it — and the count beside the menu item — for free.
 */
export async function handleResponseHandledRequest(request: Request, formData: FormData): Promise<Response | null> {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  const responseId = Number(formData.get('responseId'));

  if (!Number.isInteger(responseId) || responseId <= 0) {
    return new Response('Virheellinen vastauksen tunniste.', { status: 422 });
  }

  // An id that no longer resolves is not worth an error page: the answer is off
  // the list either way, which is what the admin asked for.
  await queryMarkResponseHandled(createSupabaseServerClient(request), responseId);

  return null;
}
