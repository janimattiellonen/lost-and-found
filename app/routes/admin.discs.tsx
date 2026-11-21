import { useLoaderData, type LoaderFunctionArgs } from 'react-router';

import DiscSearchPage from '~/features/discs/search/DiscSearchPage';
import { loadDiscSearchPage } from '~/features/discs/search/loadDiscSearchPage.server';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDiscSearchPage(request);
};

export default function AdminDiscsRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <DiscSearchPage {...loaderData} />;
}
