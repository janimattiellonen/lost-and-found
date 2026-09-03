import { redirect } from 'react-router';

import { isRetrievalListEnabled } from '~/config/clubs';
import { queryRetrievalList } from '~/features/discs/retrieval/queryRetrievalList.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * Everything the retrieval page renders.
 *
 * Two gates, both server-side: the page carries owners' full phone numbers, and
 * the list is a way of working only one club has. A club without it gets a 404
 * rather than an empty page, since there is nothing there to fill.
 */
export async function loadRetrievalList(request: Request) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  if (!isRetrievalListEnabled(parseInt(process.env.APP_CLUB_ID!, 10))) {
    throw new Response('Not Found', { status: 404 });
  }

  return { discs: await queryRetrievalList(createSupabaseServerClient(request)) };
}
