import type { ActionFunctionArgs } from 'react-router';

import NotifyForm from './components/NotifyForm';

import { createDiscFoundNotification } from '~/models/discFoundNotification.server';

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  const courseName = form.get('courseName')?.toString() || null;
  const contactName = form.get('contactName')?.toString() || null;
  const contactPhone = form.get('contactPhone')?.toString() || null;
  const contactEmail = form.get('contactEmail')?.toString() || null;
  const message = form.get('message')?.toString() || null;

  await createDiscFoundNotification({
    courseName,
    contactName,
    contactPhone,
    contactEmail,
    message,
  });

  return { success: true };
}

export default function NotifyPage(): JSX.Element {
  return <NotifyForm />;
}
