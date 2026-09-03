import { redirect } from 'react-router';

import { queryUnhandledOwnerResponses } from './queryUnhandledOwnerResponses.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * The answers waiting for the admin.
 *
 * Signed in only: the cards carry owners' full phone numbers and, for a
 * posting, their home address.
 */
export async function loadOwnerResponsesPage(request: Request) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  return { responses: await queryUnhandledOwnerResponses(createSupabaseServerClient(request)) };
}
