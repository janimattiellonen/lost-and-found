import { redirect } from 'react-router';

import { queryMessageTemplateCategories } from '~/features/messaging/categories/queryMessageTemplateCategories.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/**
 * The category list the create form's dropdown offers.
 *
 * The page had no loader at all until it needed this, and gets the sign-in
 * check its siblings have at the same time — an unguarded loader beside a dozen
 * guarded ones was not worth shipping. The action is still unguarded, exactly
 * as it was; see specs/06-messaging-and-templates.md.
 */
export async function loadCreateMessageTemplatePage(request: Request) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  return { categories: await queryMessageTemplateCategories(createSupabaseServerClient(request)) };
}
