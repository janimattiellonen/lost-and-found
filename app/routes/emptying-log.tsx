import { redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import EmptyingLogPage from '~/features/emptyingLog/EmptyingLogPage';
import { markBinEmptied } from '~/features/emptyingLog/markBinEmptied.server';
import { getEmptyingLogItems } from '~/models/emptyingLog.server';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return { emptyingLogItems: await getEmptyingLogItems(request) };
};

export async function action({ request }: ActionFunctionArgs) {
  return markBinEmptied(request, await request.formData());
}

export default function EmptyingLogRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <EmptyingLogPage {...loaderData} />;
}
