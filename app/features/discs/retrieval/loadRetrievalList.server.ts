import { redirect } from 'react-router';

import { queryRetrievalList } from './queryRetrievalList.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * Everything the retrieval page renders.
 *
 * One gate, server-side rather than in the UI: the page carries owners' full
 * phone numbers. The list itself is every club's, since every admin has to
 * bring the disc to hand before its owner can have it.
 */
export async function loadRetrievalList(request: Request) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  return { discs: await queryRetrievalList(createSupabaseServerClient(request)) };
}
