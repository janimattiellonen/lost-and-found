import type { JSX } from 'react';

import { useActionData, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import EditDiscPage from '~/features/discs/edit/EditDiscPage';
import { editDiscFromForm } from '~/features/discs/edit/editDiscFromForm.server';
import { loadEditDiscPage } from '~/features/discs/edit/loadEditDiscPage.server';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  return loadEditDiscPage(request, params.externalId);
};

export async function action({ params, request }: ActionFunctionArgs) {
  return editDiscFromForm(request, params.externalId, await request.formData());
}

export default function EditDiscRoute(): JSX.Element {
  const { disc, courses } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return <EditDiscPage disc={disc} courses={courses} errors={actionData?.errors} saved={actionData?.ok === true} />;
}
