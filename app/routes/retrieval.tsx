import { useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { handleRetrievedRequest } from '~/features/discs/retrieval/handleRetrievedRequest.server';
import { loadRetrievalList } from '~/features/discs/retrieval/loadRetrievalList.server';
import RetrievalListPage from '~/features/discs/retrieval/RetrievalListPage';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadRetrievalList(request);
};

export async function action({ request }: ActionFunctionArgs) {
  return handleRetrievedRequest(request, await request.formData());
}

export default function RetrievalRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <RetrievalListPage {...loaderData} />;
}
