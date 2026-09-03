import { useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { handleResponseHandledRequest } from '~/features/discs/ownerResponse/handleResponseHandledRequest.server';
import { loadOwnerResponsesPage } from '~/features/discs/ownerResponse/loadOwnerResponsesPage.server';
import OwnerResponsesPage from '~/features/discs/ownerResponse/OwnerResponsesPage';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadOwnerResponsesPage(request);
};

export async function action({ request }: ActionFunctionArgs) {
  return handleResponseHandledRequest(request, await request.formData());
}

export default function OwnerResponsesRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <OwnerResponsesPage {...loaderData} />;
}
