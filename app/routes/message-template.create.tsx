import { useActionData, type ActionFunctionArgs } from 'react-router';

import CreateMessageTemplatePage from '~/features/messaging/CreateMessageTemplatePage';
import { createMessageTemplateFromForm } from '~/features/messaging/createMessageTemplateFromForm.server';

import type { JSX } from 'react';

export async function action({ request }: ActionFunctionArgs) {
  return createMessageTemplateFromForm(request, await request.formData());
}

export default function CreateMessageTemplateRoute(): JSX.Element {
  const actionData = useActionData<typeof action>();

  return <CreateMessageTemplatePage errors={actionData?.errors} />;
}
