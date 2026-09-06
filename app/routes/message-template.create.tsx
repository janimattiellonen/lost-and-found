import { useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import CreateMessageTemplatePage from '~/features/messaging/CreateMessageTemplatePage';
import { createMessageTemplateFromForm } from '~/features/messaging/createMessageTemplateFromForm.server';
import { loadCreateMessageTemplatePage } from '~/features/messaging/loadCreateMessageTemplatePage.server';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadCreateMessageTemplatePage(request);
};

export async function action({ request }: ActionFunctionArgs) {
  return createMessageTemplateFromForm(request, await request.formData());
}

export default function CreateMessageTemplateRoute(): JSX.Element {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return <CreateMessageTemplatePage categories={categories} errors={actionData?.errors} />;
}
