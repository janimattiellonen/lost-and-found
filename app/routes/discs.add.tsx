import { type JSX } from 'react';

import { redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';

import AddDiscsPage from '~/features/discs/submission/AddDiscsPage';
import { getDiscCourseNames } from '~/config/courses';
import { isUserLoggedIn } from '~/models/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  // The courses this club files discs under, so the form can offer them.
  return { courses: getDiscCourseNames(parseInt(process.env.APP_CLUB_ID!, 10)) };
};

export default function AddDiscsRoute(): JSX.Element {
  const data = useLoaderData<typeof loader>();

  return <AddDiscsPage courses={data?.courses ?? []} />;
}
