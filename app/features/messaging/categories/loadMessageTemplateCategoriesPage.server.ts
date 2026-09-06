import { redirect } from 'react-router';

import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';
import { queryMessageTemplateCategories } from './queryMessageTemplateCategories.server';

/** The category admin tool's list. Signed in only, like every other admin page. */
export async function loadMessageTemplateCategoriesPage(request: Request) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  return { categories: await queryMessageTemplateCategories(createSupabaseServerClient(request)) };
}
