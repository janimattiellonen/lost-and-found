import { redirect, useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import EditMessageTemplatePage from '~/features/messaging/EditMessageTemplatePage';
import { editMessageTemplateFromForm } from '~/features/messaging/editMessageTemplateFromForm.server';
import { getMessageTemplate } from '~/models/messageTemplate.server';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  const messageTemplate = await getMessageTemplate(parseInt(params.id || '', 10), request);

  return { messageTemplate, ok: null };
};

export async function action({ request, params }: ActionFunctionArgs) {
  return editMessageTemplateFromForm(request, parseInt(params.id || '', 10), await request.formData());
}

export default function EditMessageTemplateRoute(): JSX.Element {
  const { messageTemplate } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return <EditMessageTemplatePage messageTemplate={messageTemplate} errors={actionData?.errors} />;
}
