import { redirect } from 'react-router';

import { queryMessageTemplateCategories } from '~/features/messaging/categories/queryMessageTemplateCategories.server';
import { getMessageTemplate } from '~/models/messageTemplate.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

/** One template and the categories its dropdown offers. */
export async function loadEditMessageTemplatePage(request: Request, id: number) {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  const [messageTemplate, categories] = await Promise.all([
    getMessageTemplate(id, request),
    queryMessageTemplateCategories(createSupabaseServerClient(request)),
  ]);

  return { messageTemplate, categories, ok: null };
}
