import { useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import EditMessageTemplatePage from '~/features/messaging/EditMessageTemplatePage';
import { editMessageTemplateFromForm } from '~/features/messaging/editMessageTemplateFromForm.server';
import { loadEditMessageTemplatePage } from '~/features/messaging/loadEditMessageTemplatePage.server';

import type { JSX } from 'react';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  return loadEditMessageTemplatePage(request, parseInt(params.id || '', 10));
};

export async function action({ request, params }: ActionFunctionArgs) {
  return editMessageTemplateFromForm(request, parseInt(params.id || '', 10), await request.formData());
}

export default function EditMessageTemplateRoute(): JSX.Element {
  const { messageTemplate, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <EditMessageTemplatePage messageTemplate={messageTemplate} categories={categories} errors={actionData?.errors} />
  );
}
