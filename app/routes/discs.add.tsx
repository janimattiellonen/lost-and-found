import { type JSX } from 'react';

import { redirect, type LoaderFunctionArgs } from 'react-router';

import AddDiscsPage from '~/features/discs/submission/AddDiscsPage';
import { isUserLoggedIn } from '~/models/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return null;
};

export default function AddDiscsRoute(): JSX.Element {
  return <AddDiscsPage />;
}
