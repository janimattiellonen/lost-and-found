import { redirect, useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { queryMessageTemplateCategories } from '~/features/messaging/categories/queryMessageTemplateCategories.server';
import CreateMessageTemplatePage from '~/features/messaging/CreateMessageTemplatePage';
import { createMessageTemplateFromForm } from '~/features/messaging/createMessageTemplateFromForm.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

/**
 * The page had no loader at all until it needed the category list. It gets the
 * sign-in check its siblings have at the same time — an unguarded loader beside
 * a dozen guarded ones is not worth shipping. The action is still unguarded,
 * exactly as it was; see specs/06-messaging-and-templates.md.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return { categories: await queryMessageTemplateCategories(createSupabaseServerClient(request)) };
};

export async function action({ request }: ActionFunctionArgs) {
  return createMessageTemplateFromForm(request, await request.formData());
}

export default function CreateMessageTemplateRoute(): JSX.Element {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return <CreateMessageTemplatePage categories={categories} errors={actionData?.errors} />;
}
