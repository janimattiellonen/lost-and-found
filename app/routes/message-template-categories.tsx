import { useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { handleMessageTemplateCategoryAction } from '~/features/messaging/categories/handleMessageTemplateCategoryAction.server';
import { loadMessageTemplateCategoriesPage } from '~/features/messaging/categories/loadMessageTemplateCategoriesPage.server';
import MessageTemplateCategoriesPage from '~/features/messaging/categories/MessageTemplateCategoriesPage';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadMessageTemplateCategoriesPage(request);
};

export async function action({ request }: ActionFunctionArgs) {
  return handleMessageTemplateCategoryAction(request, await request.formData());
}

export default function MessageTemplateCategoriesRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return <MessageTemplateCategoriesPage {...loaderData} error={actionData?.error ?? null} />;
}
