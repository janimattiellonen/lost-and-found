import { ActionArgs, json } from '@remix-run/node';

import NotifyForm from './components/NotifyForm';

import { createDiscFoundNotification } from '~/models/discFoundNotification.server';

export async function action({ request }: ActionArgs) {
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

  return json({ success: true });
}

export default function NotifyPage(): JSX.Element {
  return <NotifyForm />;
}
