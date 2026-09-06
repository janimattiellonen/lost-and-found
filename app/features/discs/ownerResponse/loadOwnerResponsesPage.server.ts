import { redirect } from 'react-router';

import { ownerResponseCategoryId } from '~/config/messageTemplateCategories';
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

  return {
    responses: await queryUnhandledOwnerResponses(createSupabaseServerClient(request)),
    // Which templates the composer should offer when it is opened from a card
    // here. Read on the server because it comes from APP_CLUB_ID; null for a
    // club with no category of its own, and the link then carries none.
    messageCategoryId: ownerResponseCategoryId(),
  };
}
