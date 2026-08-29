import { redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

import { handleNotificationAction } from '~/features/notifications/handleNotificationAction.server';
import { loadNotifications } from '~/features/notifications/loadNotifications.server';
import NotificationsPage from '~/features/notifications/NotificationsPage';
import { isUserLoggedIn } from '~/models/utils';

import type { JSX } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!(await isUserLoggedIn(request))) {
    return redirect('/sign-in');
  }

  return loadNotifications(request);
};

export async function action({ request }: ActionFunctionArgs) {
  return handleNotificationAction(request, await request.formData());
}

export default function NotificationsRoute(): JSX.Element {
  const loaderData = useLoaderData<typeof loader>();

  return <NotificationsPage {...loaderData} />;
}
