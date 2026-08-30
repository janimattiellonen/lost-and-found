import type { ActionFunctionArgs } from 'react-router';

import NotifyForm from '~/features/notifications/NotifyForm';
import { reportDiscFound } from '~/features/notifications/reportDiscFound.server';

import type { JSX } from 'react';

export async function action({ request }: ActionFunctionArgs) {
  return reportDiscFound(await request.formData());
}

export default function NotifyRoute(): JSX.Element {
  return <NotifyForm />;
}
